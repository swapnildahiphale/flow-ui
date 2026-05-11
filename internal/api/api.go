package api

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/swapnildahiphale/flow-ui/internal/db"
)

type Handler struct {
	DB *sql.DB
}

func New(conn *sql.DB) *Handler {
	return &Handler{DB: conn}
}

func (h *Handler) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/health", h.health)
	mux.HandleFunc("GET /api/v1/stats", h.stats)
	mux.HandleFunc("GET /api/v1/tasks", h.listTasks)
	mux.HandleFunc("GET /api/v1/tasks/{slug}", h.getTask)
	mux.HandleFunc("GET /api/v1/projects", h.listProjects)
	mux.HandleFunc("GET /api/v1/tags", h.listTags)
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) stats(w http.ResponseWriter, r *http.Request) {
	s, err := db.GetStats(r.Context(), h.DB)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, s)
}

func (h *Handler) listTasks(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	f := db.TaskFilter{
		Status:          q.Get("status"),
		Priority:        q.Get("priority"),
		ProjectSlug:     q.Get("project"),
		Tag:             q.Get("tag"),
		Kind:            q.Get("kind"),
		IncludeArchived: q.Get("archived") == "1",
	}
	tasks, err := db.ListTasks(r.Context(), h.DB, f)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"tasks": tasks,
		"count": len(tasks),
	})
}

func (h *Handler) getTask(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	t, err := db.GetTask(r.Context(), h.DB, slug)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if t == nil {
		writeError(w, http.StatusNotFound, errString("task not found"))
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (h *Handler) listProjects(w http.ResponseWriter, r *http.Request) {
	includeArchived := r.URL.Query().Get("archived") == "1"
	ps, err := db.ListProjects(r.Context(), h.DB, includeArchived)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"projects": ps,
		"count":    len(ps),
	})
}

func (h *Handler) listTags(w http.ResponseWriter, r *http.Request) {
	tags, err := db.ListTags(r.Context(), h.DB)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"tags":  tags,
		"count": len(tags),
	})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]string{"error": err.Error()})
}

type errString string

func (e errString) Error() string { return string(e) }
