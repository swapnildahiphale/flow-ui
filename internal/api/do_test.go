package api

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestDoTask(t *testing.T) {
	h, mux := setupFixture(t)

	var started string
	h.Do = func(slug string) error {
		started = slug
		return nil
	}

	r := httptest.NewRequest(http.MethodPost, "/api/v1/tasks/alpha/do", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body = %s", w.Code, w.Body.String())
	}
	if started != "alpha" {
		t.Fatalf("do runner called with %q, want alpha", started)
	}
}

func TestDoTaskNotFound(t *testing.T) {
	h, mux := setupFixture(t)

	called := false
	h.Do = func(_ string) error {
		called = true
		return nil
	}

	r := httptest.NewRequest(http.MethodPost, "/api/v1/tasks/nonexistent/do", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, r)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404; body = %s", w.Code, w.Body.String())
	}
	if called {
		t.Fatal("do runner should not run for an unknown slug")
	}
}
