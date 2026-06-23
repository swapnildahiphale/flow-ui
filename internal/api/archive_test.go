package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestArchiveTask(t *testing.T) {
	h, mux := setupFixture(t)

	var archived string
	h.Archive = func(_ context.Context, slug string) error {
		archived = slug
		return nil
	}

	r := httptest.NewRequest(http.MethodPost, "/api/v1/tasks/alpha/archive", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body = %s", w.Code, w.Body.String())
	}
	if archived != "alpha" {
		t.Fatalf("archiver called with %q, want alpha", archived)
	}
}

func TestArchiveTaskNotFound(t *testing.T) {
	h, mux := setupFixture(t)

	called := false
	h.Archive = func(_ context.Context, _ string) error {
		called = true
		return nil
	}

	r := httptest.NewRequest(http.MethodPost, "/api/v1/tasks/nonexistent/archive", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, r)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404; body = %s", w.Code, w.Body.String())
	}
	if called {
		t.Fatal("archiver should not run for an unknown slug")
	}
}
