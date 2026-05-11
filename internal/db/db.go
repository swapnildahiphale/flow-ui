package db

import (
	"database/sql"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"

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
