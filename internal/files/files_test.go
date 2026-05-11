package files

import (
	"os"
	"path/filepath"
	"testing"
)

func mkFlow(t *testing.T) *Reader {
	t.Helper()
	root := t.TempDir()
	must := func(err error) { t.Helper(); if err != nil { t.Fatal(err) } }
	must(os.MkdirAll(filepath.Join(root, "tasks", "abc", "updates"), 0o755))
	must(os.MkdirAll(filepath.Join(root, "kb"), 0o755))
	must(os.WriteFile(filepath.Join(root, "tasks", "abc", "brief.md"), []byte("# brief"), 0o644))
	must(os.WriteFile(filepath.Join(root, "tasks", "abc", "updates", "2026-05-10-first.md"), []byte("body 1"), 0o644))
	must(os.WriteFile(filepath.Join(root, "tasks", "abc", "updates", "2026-05-11-second.md"), []byte("body 2"), 0o644))
	must(os.WriteFile(filepath.Join(root, "kb", "user.md"), []byte("# user\n\n- 2026-05-01 — fact 1\n- 2026-05-02 — fact 2\n"), 0o644))
	return &Reader{Root: root}
}

func TestBrief(t *testing.T) {
	r := mkFlow(t)
	got, err := r.Brief("tasks", "abc")
	if err != nil { t.Fatal(err) }
	if got != "# brief" { t.Fatalf("got %q", got) }

	if _, err := r.Brief("tasks", "missing"); err != ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
	if _, err := r.Brief("tasks", "../escape"); err == nil {
		t.Fatal("expected slug validation error")
	}
}

func TestUpdates(t *testing.T) {
	r := mkFlow(t)
	ups, err := r.Updates("tasks", "abc")
	if err != nil { t.Fatal(err) }
	if len(ups) != 2 { t.Fatalf("got %d updates", len(ups)) }
	if ups[0].Date != "2026-05-11" { t.Fatalf("newest first ordering: %v", ups[0]) }
	if ups[0].Title != "second" { t.Fatalf("title parse: %q", ups[0].Title) }
}

func TestKBList(t *testing.T) {
	r := mkFlow(t)
	list, err := r.KBList()
	if err != nil { t.Fatal(err) }
	if len(list) != 1 || list[0].Name != "user" { t.Fatalf("KBList: %+v", list) }
	if list[0].Entries != 2 { t.Fatalf("entries count: %d", list[0].Entries) }
}
