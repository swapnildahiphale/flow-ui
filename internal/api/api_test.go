package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/swapnildahiphale/flow-ui/internal/db"
	"github.com/swapnildahiphale/flow-ui/internal/files"
)

// setupFixture creates an in-memory DB via db.TestDB, seeds a project, a task,
// and a tag, then builds an api.Handler with a tempdir-rooted files.Reader.
func setupFixture(t *testing.T) (*Handler, *http.ServeMux) {
	t.Helper()
	conn := db.TestDB(t)

	seed := `
		INSERT INTO projects(slug, name, status, priority, work_dir, created_at, updated_at)
		VALUES('apollo', 'Apollo', 'active', 'high', '/tmp/apollo', '2026-05-01T00:00:00Z', '2026-05-10T00:00:00Z');

		INSERT INTO tasks(slug, name, project_slug, status, kind, priority, work_dir, created_at, updated_at)
		VALUES('alpha', 'Alpha task', 'apollo', 'in-progress', 'regular', 'medium', '/tmp/apollo', '2026-05-01T00:00:00Z', '2026-05-11T16:00:00Z');

		INSERT INTO tasks(slug, name, status, kind, priority, work_dir, created_at, updated_at)
		VALUES('beta', 'Beta task', 'backlog', 'regular', 'low', '/tmp/beta', '2026-05-01T00:00:00Z', '2026-05-09T00:00:00Z');

		INSERT INTO task_tags(task_slug, tag) VALUES('alpha', 'urgent');
	`
	if _, err := conn.Exec(seed); err != nil {
		t.Fatalf("seed: %v", err)
	}

	h := &Handler{DB: conn, Files: &files.Reader{Root: t.TempDir()}, Archive: func(string) error { return errString("archive not stubbed") }}
	mux := http.NewServeMux()
	h.Routes(mux)
	return h, mux
}

func TestHealth(t *testing.T) {
	_, mux := setupFixture(t)

	r := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body = %s", w.Code, w.Body.String())
	}
	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body["status"] != "ok" {
		t.Fatalf("body = %v, want status:ok", body)
	}
}

func TestListTasksFilterByStatus(t *testing.T) {
	_, mux := setupFixture(t)

	r := httptest.NewRequest(http.MethodGet, "/api/v1/tasks?status=in-progress", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body = %s", w.Code, w.Body.String())
	}
	var body struct {
		Tasks []struct {
			Slug   string   `json:"slug"`
			Name   string   `json:"name"`
			Status string   `json:"status"`
			Tags   []string `json:"tags"`
		} `json:"tasks"`
		Count int `json:"count"`
	}
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body.Count != 1 {
		t.Fatalf("count = %d, want 1; tasks = %+v", body.Count, body.Tasks)
	}
	got := body.Tasks[0]
	if got.Slug != "alpha" || got.Status != "in-progress" {
		t.Fatalf("task = %+v, want slug=alpha status=in-progress", got)
	}
	if len(got.Tags) != 1 || got.Tags[0] != "urgent" {
		t.Fatalf("tags = %v, want [urgent]", got.Tags)
	}
}

func TestStatsNonZero(t *testing.T) {
	_, mux := setupFixture(t)

	r := httptest.NewRequest(http.MethodGet, "/api/v1/stats", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body = %s", w.Code, w.Body.String())
	}
	var s struct {
		TasksByStatus   map[string]int `json:"tasks_by_status"`
		TasksByPriority map[string]int `json:"tasks_by_priority"`
		ProjectsActive  int            `json:"projects_active"`
	}
	if err := json.NewDecoder(w.Body).Decode(&s); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if s.TasksByStatus["in-progress"] != 1 {
		t.Fatalf("tasks_by_status[in-progress] = %d, want 1; full = %+v", s.TasksByStatus["in-progress"], s.TasksByStatus)
	}
	if s.TasksByStatus["backlog"] != 1 {
		t.Fatalf("tasks_by_status[backlog] = %d, want 1; full = %+v", s.TasksByStatus["backlog"], s.TasksByStatus)
	}
	if s.ProjectsActive != 1 {
		t.Fatalf("projects_active = %d, want 1", s.ProjectsActive)
	}
	totalPriority := 0
	for _, n := range s.TasksByPriority {
		totalPriority += n
	}
	if totalPriority == 0 {
		t.Fatalf("tasks_by_priority all zero; got %+v", s.TasksByPriority)
	}
}
