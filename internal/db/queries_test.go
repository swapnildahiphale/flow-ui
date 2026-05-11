package db

import (
	"testing"
	"time"
)

func TestComputeStale(t *testing.T) {
	now := time.Now()
	cases := []struct {
		name      string
		status    string
		updated   time.Time
		wantStale bool
	}{
		{"in-progress 2d ago", "in-progress", now.Add(-48 * time.Hour), false},
		{"in-progress 8d ago", "in-progress", now.Add(-8 * 24 * time.Hour), true},
		{"backlog 30d ago", "backlog", now.Add(-30 * 24 * time.Hour), false},
		{"done 30d ago", "done", now.Add(-30 * 24 * time.Hour), false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := computeStale(c.status, c.updated.Format(time.RFC3339))
			if got != c.wantStale {
				t.Fatalf("computeStale(%s, %v) = %v, want %v", c.status, c.updated, got, c.wantStale)
			}
		})
	}
}
