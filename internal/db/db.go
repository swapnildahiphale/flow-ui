package db

import (
	"database/sql"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"

	_ "modernc.org/sqlite"
)

// ResolvePath expands a `~` prefix and returns an absolute path.
func ResolvePath(p string) (string, error) {
	if strings.HasPrefix(p, "~/") || p == "~" {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		p = filepath.Join(home, strings.TrimPrefix(p, "~"))
	}
	abs, err := filepath.Abs(p)
	if err != nil {
		return "", err
	}
	if _, err := os.Stat(abs); err != nil {
		return "", fmt.Errorf("db file not found at %s: %w", abs, err)
	}
	return abs, nil
}

// OpenReadOnly opens flow.db read-only, with a busy-timeout for safety when flow
// CLI writes concurrently.
func OpenReadOnly(path string) (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"file:%s?mode=ro&_pragma=busy_timeout(5000)&_pragma=query_only(1)",
		url.PathEscape(path),
	)
	conn, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	if err := conn.Ping(); err != nil {
		conn.Close()
		return nil, err
	}
	conn.SetMaxOpenConns(4)
	return conn, nil
}

// TestDB creates a fresh SQLite database suitable for testing, with the minimal
// schema applied. Each call returns an independent DB (backed by a unique temp
// file) and the connection is closed automatically on test cleanup.
func TestDB(t *testing.T) *sql.DB {
	dbPath := filepath.Join(t.TempDir(), "test.db")
	conn, err := sql.Open("sqlite", "file:"+dbPath)
	if err != nil {
		t.Fatalf("open test db: %v", err)
	}
	t.Cleanup(func() { _ = conn.Close() })

	// Create minimal schema for testing
	schema := `
		CREATE TABLE projects (
			slug TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			status TEXT NOT NULL,
			priority TEXT NOT NULL,
			work_dir TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			archived_at TEXT
		);
		CREATE TABLE tasks (
			slug TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			project_slug TEXT,
			status TEXT NOT NULL,
			kind TEXT NOT NULL,
			playbook_slug TEXT,
			priority TEXT NOT NULL,
			work_dir TEXT NOT NULL,
			waiting_on TEXT,
			due_date TEXT,
			assignee TEXT,
			status_changed_at TEXT,
			session_id TEXT,
			session_started TEXT,
			session_last_resumed TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			archived_at TEXT,
			FOREIGN KEY (project_slug) REFERENCES projects(slug)
		);
		CREATE TABLE task_tags (
			task_slug TEXT NOT NULL,
			tag TEXT NOT NULL,
			PRIMARY KEY (task_slug, tag),
			FOREIGN KEY (task_slug) REFERENCES tasks(slug)
		);
		CREATE TABLE playbooks (
			slug TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			project_slug TEXT,
			work_dir TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			archived_at TEXT
		);
	`
	if _, err := conn.Exec(schema); err != nil {
		t.Fatalf("create schema: %v", err)
	}

	return conn
}
