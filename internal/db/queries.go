package db

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"
)

const taskColumns = `
	t.slug, t.name, t.project_slug, t.status, t.kind, t.playbook_slug,
	t.priority, t.work_dir, t.waiting_on, t.due_date, t.assignee,
	t.status_changed_at, t.session_id, t.session_started,
	t.session_last_resumed, t.created_at, t.updated_at, t.archived_at
`

func computeStale(status, updatedAt string) bool {
	if status != "in-progress" {
		return false
	}
	t, err := time.Parse(time.RFC3339, updatedAt)
	if err != nil {
		return false
	}
	return time.Since(t) > 7*24*time.Hour
}

type TaskFilter struct {
	Status          string // "", "backlog", "in-progress", "done"
	Priority        string // "", "high", "medium", "low"
	ProjectSlug     string // "" = any; "(none)" = floating only
	Tag             string // "" = any
	Kind            string // "", "regular", "playbook_run"
	IncludeArchived bool
}

// ListTasks returns tasks ordered by updated_at DESC, with tags hydrated.
func ListTasks(ctx context.Context, conn *sql.DB, f TaskFilter) ([]Task, error) {
	var clauses []string
	var args []any

	if !f.IncludeArchived {
		clauses = append(clauses, "t.archived_at IS NULL")
	}
	if f.Status != "" {
		clauses = append(clauses, "t.status = ?")
		args = append(args, f.Status)
	}
	if f.Priority != "" {
		clauses = append(clauses, "t.priority = ?")
		args = append(args, f.Priority)
	}
	if f.ProjectSlug == "(none)" {
		clauses = append(clauses, "t.project_slug IS NULL")
	} else if f.ProjectSlug != "" {
		clauses = append(clauses, "t.project_slug = ?")
		args = append(args, f.ProjectSlug)
	}
	if f.Kind != "" {
		clauses = append(clauses, "t.kind = ?")
		args = append(args, f.Kind)
	}
	if f.Tag != "" {
		clauses = append(clauses, "t.slug IN (SELECT task_slug FROM task_tags WHERE tag = ?)")
		args = append(args, f.Tag)
	}

	where := ""
	if len(clauses) > 0 {
		where = "WHERE " + strings.Join(clauses, " AND ")
	}

	query := fmt.Sprintf(`SELECT %s FROM tasks t %s ORDER BY t.updated_at DESC`, taskColumns, where)

	rows, err := conn.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list tasks: %w", err)
	}
	defer rows.Close()

	tasks := []Task{}
	slugs := []string{}
	for rows.Next() {
		var t Task
		if err := rows.Scan(
			&t.Slug, &t.Name, &t.ProjectSlug, &t.Status, &t.Kind, &t.PlaybookSlug,
			&t.Priority, &t.WorkDir, &t.WaitingOn, &t.DueDate, &t.Assignee,
			&t.StatusChangedAt, &t.SessionID, &t.SessionStarted,
			&t.SessionLastResumed, &t.CreatedAt, &t.UpdatedAt, &t.ArchivedAt,
		); err != nil {
			return nil, fmt.Errorf("scan task: %w", err)
		}
		t.Stale = computeStale(t.Status, t.UpdatedAt)
		t.Tags = []string{}
		tasks = append(tasks, t)
		slugs = append(slugs, t.Slug)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(tasks) > 0 {
		if err := hydrateTags(ctx, conn, tasks, slugs); err != nil {
			return nil, err
		}
	}
	return tasks, nil
}

func hydrateTags(ctx context.Context, conn *sql.DB, tasks []Task, slugs []string) error {
	placeholders := strings.Repeat("?,", len(slugs))
	placeholders = placeholders[:len(placeholders)-1]
	args := make([]any, len(slugs))
	for i, s := range slugs {
		args[i] = s
	}
	q := fmt.Sprintf(`SELECT task_slug, tag FROM task_tags WHERE task_slug IN (%s) ORDER BY tag`, placeholders)
	rows, err := conn.QueryContext(ctx, q, args...)
	if err != nil {
		return fmt.Errorf("hydrate tags: %w", err)
	}
	defer rows.Close()

	byslug := map[string][]string{}
	for rows.Next() {
		var slug, tag string
		if err := rows.Scan(&slug, &tag); err != nil {
			return err
		}
		byslug[slug] = append(byslug[slug], tag)
	}
	for i, t := range tasks {
		if tags, ok := byslug[t.Slug]; ok {
			tasks[i].Tags = tags
		}
	}
	return rows.Err()
}

// GetTask fetches a single task with tags.
func GetTask(ctx context.Context, conn *sql.DB, slug string) (*Task, error) {
	query := fmt.Sprintf(`SELECT %s FROM tasks t WHERE t.slug = ?`, taskColumns)
	row := conn.QueryRowContext(ctx, query, slug)
	var t Task
	if err := row.Scan(
		&t.Slug, &t.Name, &t.ProjectSlug, &t.Status, &t.Kind, &t.PlaybookSlug,
		&t.Priority, &t.WorkDir, &t.WaitingOn, &t.DueDate, &t.Assignee,
		&t.StatusChangedAt, &t.SessionID, &t.SessionStarted,
		&t.SessionLastResumed, &t.CreatedAt, &t.UpdatedAt, &t.ArchivedAt,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get task: %w", err)
	}
	t.Stale = computeStale(t.Status, t.UpdatedAt)
	t.Tags = []string{}
	tasks := []Task{t}
	if err := hydrateTags(ctx, conn, tasks, []string{t.Slug}); err != nil {
		return nil, err
	}
	return &tasks[0], nil
}

// ListProjects returns projects ordered by priority+name.
func ListProjects(ctx context.Context, conn *sql.DB, includeArchived bool) ([]Project, error) {
	q := `SELECT slug, name, status, priority, work_dir, created_at, updated_at, archived_at
	      FROM projects`
	if !includeArchived {
		q += ` WHERE archived_at IS NULL`
	}
	q += ` ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, name`

	rows, err := conn.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("list projects: %w", err)
	}
	defer rows.Close()

	out := []Project{}
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.Slug, &p.Name, &p.Status, &p.Priority, &p.WorkDir,
			&p.CreatedAt, &p.UpdatedAt, &p.ArchivedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// ListTags returns all tags with their task counts.
func ListTags(ctx context.Context, conn *sql.DB) ([]TagCount, error) {
	q := `SELECT tt.tag, COUNT(*) AS n
	      FROM task_tags tt
	      JOIN tasks t ON t.slug = tt.task_slug
	      WHERE t.archived_at IS NULL
	      GROUP BY tt.tag
	      ORDER BY n DESC, tt.tag`
	rows, err := conn.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("list tags: %w", err)
	}
	defer rows.Close()
	out := []TagCount{}
	for rows.Next() {
		var tc TagCount
		if err := rows.Scan(&tc.Tag, &tc.Count); err != nil {
			return nil, err
		}
		out = append(out, tc)
	}
	return out, rows.Err()
}

// Stats returns headline counts for the dashboard home page.
type Stats struct {
	TasksByStatus    map[string]int `json:"tasks_by_status"`
	TasksByPriority  map[string]int `json:"tasks_by_priority"`
	WaitingCount     int            `json:"waiting_count"`
	OverdueCount     int            `json:"overdue_count"`
	ProjectsActive   int            `json:"projects_active"`
	PlaybooksActive  int            `json:"playbooks_active"`
}

func GetStats(ctx context.Context, conn *sql.DB) (*Stats, error) {
	s := &Stats{
		TasksByStatus:   map[string]int{},
		TasksByPriority: map[string]int{},
	}

	rows, err := conn.QueryContext(ctx,
		`SELECT status, COUNT(*) FROM tasks WHERE archived_at IS NULL GROUP BY status`)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var st string
		var n int
		if err := rows.Scan(&st, &n); err != nil {
			rows.Close()
			return nil, err
		}
		s.TasksByStatus[st] = n
	}
	rows.Close()

	rows, err = conn.QueryContext(ctx,
		`SELECT priority, COUNT(*) FROM tasks WHERE archived_at IS NULL AND status != 'done' GROUP BY priority`)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var p string
		var n int
		if err := rows.Scan(&p, &n); err != nil {
			rows.Close()
			return nil, err
		}
		s.TasksByPriority[p] = n
	}
	rows.Close()

	if err := conn.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM tasks WHERE archived_at IS NULL AND waiting_on IS NOT NULL AND status != 'done'`,
	).Scan(&s.WaitingCount); err != nil {
		return nil, err
	}

	if err := conn.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM tasks
		 WHERE archived_at IS NULL AND status != 'done' AND due_date IS NOT NULL
		   AND date(due_date) < date('now')`,
	).Scan(&s.OverdueCount); err != nil {
		return nil, err
	}

	if err := conn.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM projects WHERE archived_at IS NULL AND status = 'active'`,
	).Scan(&s.ProjectsActive); err != nil {
		return nil, err
	}

	if err := conn.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM playbooks WHERE archived_at IS NULL`,
	).Scan(&s.PlaybooksActive); err != nil {
		return nil, err
	}

	return s, nil
}
