package graph

import (
	"context"
	"testing"

	"github.com/swapnildahiphale/flow-ui/internal/db"
)

func TestBuildEmpty(t *testing.T) {
	ctx := context.Background()
	conn := db.TestDB(t)
	defer conn.Close()

	g, err := Build(ctx, conn)
	if err == nil {
		t.Fatal("expected error for empty graph")
	}
	if g == nil {
		t.Fatal("expected non-nil graph even on error")
	}
	if len(g.Nodes) != 0 || len(g.Edges) != 0 {
		t.Fatalf("expected empty nodes/edges, got %d nodes, %d edges", len(g.Nodes), len(g.Edges))
	}
}

func TestBuildWithTasks(t *testing.T) {
	ctx := context.Background()
	conn := db.TestDB(t)
	defer conn.Close()

	// Add a project and task
	_, err := conn.ExecContext(ctx, `
		INSERT INTO projects (slug, name, status, priority, work_dir, created_at, updated_at)
		VALUES ('test-proj', 'Test Project', 'in_progress', 'high', '/tmp', datetime('now'), datetime('now'))
	`)
	if err != nil {
		t.Fatalf("insert project: %v", err)
	}

	_, err = conn.ExecContext(ctx, `
		INSERT INTO tasks (slug, name, project_slug, status, kind, priority, work_dir, created_at, updated_at)
		VALUES ('test-task', 'Test Task', 'test-proj', 'pending', 'task', 'high', '/tmp', datetime('now'), datetime('now'))
	`)
	if err != nil {
		t.Fatalf("insert task: %v", err)
	}

	g, err := Build(ctx, conn)
	if err != nil {
		t.Fatalf("Build: %v", err)
	}
	if len(g.Nodes) < 2 {
		t.Fatalf("expected at least 2 nodes (task + project), got %d", len(g.Nodes))
	}
	if len(g.Edges) < 1 {
		t.Fatalf("expected at least 1 edge (membership), got %d", len(g.Edges))
	}

	// Check for membership edge
	found := false
	for _, e := range g.Edges {
		if e.Source == "task:test-task" && e.Target == "project:test-proj" && e.Kind == "membership" {
			found = true
			break
		}
	}
	if !found {
		t.Fatal("expected membership edge from task to project")
	}
}

func TestBuildWithPeople(t *testing.T) {
	ctx := context.Background()
	conn := db.TestDB(t)
	defer conn.Close()

	_, err := conn.ExecContext(ctx, `
		INSERT INTO tasks (slug, name, status, kind, priority, work_dir, waiting_on, assignee, created_at, updated_at)
		VALUES ('test-task', 'Test Task', 'pending', 'task', 'high', '/tmp', 'alice', 'bob', datetime('now'), datetime('now'))
	`)
	if err != nil {
		t.Fatalf("insert task: %v", err)
	}

	g, err := Build(ctx, conn)
	if err != nil {
		t.Fatalf("Build: %v", err)
	}

	// Should have task + alice + bob nodes
	if len(g.Nodes) < 3 {
		t.Fatalf("expected at least 3 nodes, got %d", len(g.Nodes))
	}

	// Check for waiting and assignee edges
	waitingFound := false
	assigneeFound := false
	for _, e := range g.Edges {
		if e.Source == "task:test-task" && e.Target == "person:alice" && e.Kind == "waiting" {
			waitingFound = true
		}
		if e.Source == "task:test-task" && e.Target == "person:bob" && e.Kind == "assignee" {
			assigneeFound = true
		}
	}
	if !waitingFound {
		t.Fatal("expected waiting edge")
	}
	if !assigneeFound {
		t.Fatal("expected assignee edge")
	}
}
