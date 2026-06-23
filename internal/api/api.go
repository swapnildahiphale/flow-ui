package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/swapnildahiphale/flow-ui/internal/db"
	"github.com/swapnildahiphale/flow-ui/internal/files"
	"github.com/swapnildahiphale/flow-ui/internal/graph"
)

type Handler struct {
	DB    *sql.DB
	Files *files.Reader
	// Archive mutates a task by shelling out to the `flow` CLI. The app is
	// read-only on the DB by design, so every mutation routes through the CLI
	// (see CLAUDE.md). Overridable in tests; defaults to the exec-based impl.
	Archive func(ctx context.Context, slug string) error
}

func New(conn *sql.DB, root string) *Handler {
	return &Handler{DB: conn, Files: &files.Reader{Root: root}, Archive: flowArchive}
}

func (h *Handler) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/health", h.health)
	mux.HandleFunc("GET /api/v1/stats", h.stats)
	mux.HandleFunc("GET /api/v1/tasks", h.listTasks)
	mux.HandleFunc("GET /api/v1/tasks/{slug}", h.getTask)
	mux.HandleFunc("GET /api/v1/tasks/{slug}/brief", h.taskBrief)
	mux.HandleFunc("GET /api/v1/tasks/{slug}/updates", h.taskUpdates)
	mux.HandleFunc("POST /api/v1/tasks/{slug}/archive", h.archiveTask)
	mux.HandleFunc("GET /api/v1/projects", h.listProjects)
	mux.HandleFunc("GET /api/v1/projects/{slug}", h.getProject)
	mux.HandleFunc("GET /api/v1/projects/{slug}/brief", h.projectBrief)
	mux.HandleFunc("GET /api/v1/projects/{slug}/updates", h.projectUpdates)
	mux.HandleFunc("GET /api/v1/projects/{slug}/tasks", h.projectTasks)
	mux.HandleFunc("GET /api/v1/playbooks", h.listPlaybooks)
	mux.HandleFunc("GET /api/v1/playbooks/{slug}", h.getPlaybook)
	mux.HandleFunc("GET /api/v1/playbooks/{slug}/brief", h.playbookBrief)
	mux.HandleFunc("GET /api/v1/playbooks/{slug}/runs", h.playbookRuns)
	mux.HandleFunc("GET /api/v1/kb", h.kbList)
	mux.HandleFunc("GET /api/v1/kb/{file}", h.kbRead)
	mux.HandleFunc("GET /api/v1/timeline", h.timeline)
	mux.HandleFunc("GET /api/v1/graph", h.graph)
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

// --- file-backed handlers ---

func (h *Handler) taskBrief(w http.ResponseWriter, r *http.Request) {
	h.briefHandler(w, r, "tasks", r.PathValue("slug"))
}
func (h *Handler) projectBrief(w http.ResponseWriter, r *http.Request) {
	h.briefHandler(w, r, "projects", r.PathValue("slug"))
}
func (h *Handler) playbookBrief(w http.ResponseWriter, r *http.Request) {
	h.briefHandler(w, r, "playbooks", r.PathValue("slug"))
}
func (h *Handler) briefHandler(w http.ResponseWriter, r *http.Request, kind, slug string) {
	body, err := h.Files.Brief(kind, slug)
	if errors.Is(err, files.ErrNotFound) {
		writeError(w, http.StatusNotFound, err)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"markdown": body})
}

func (h *Handler) taskUpdates(w http.ResponseWriter, r *http.Request) {
	h.updatesHandler(w, r, "tasks", r.PathValue("slug"))
}
func (h *Handler) projectUpdates(w http.ResponseWriter, r *http.Request) {
	h.updatesHandler(w, r, "projects", r.PathValue("slug"))
}
func (h *Handler) updatesHandler(w http.ResponseWriter, r *http.Request, kind, slug string) {
	ups, err := h.Files.Updates(kind, slug)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"updates": ups, "count": len(ups)})
}

func (h *Handler) kbList(w http.ResponseWriter, r *http.Request) {
	list, err := h.Files.KBList()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"files": list, "count": len(list)})
}
func (h *Handler) kbRead(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("file")
	body, mtime, err := h.Files.KBRead(name)
	if errors.Is(err, files.ErrNotFound) {
		writeError(w, http.StatusNotFound, err)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"markdown": body, "mtime": mtime, "name": name})
}

func (h *Handler) timeline(w http.ResponseWriter, r *http.Request) {
	all, err := h.Files.AllUpdates()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	since := r.URL.Query().Get("since")
	if since != "" {
		filtered := all[:0]
		for _, e := range all {
			if e.Date >= since {
				filtered = append(filtered, e)
			}
		}
		all = filtered
	}
	writeJSON(w, http.StatusOK, map[string]any{"entries": all, "count": len(all)})
}

// --- DB-backed project + playbook handlers ---

func (h *Handler) getProject(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	p, err := db.GetProject(r.Context(), h.DB, slug)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if p == nil {
		writeError(w, http.StatusNotFound, errString("project not found"))
		return
	}
	writeJSON(w, http.StatusOK, p)
}
func (h *Handler) projectTasks(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	tasks, err := db.ListTasks(r.Context(), h.DB, db.TaskFilter{ProjectSlug: slug})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"tasks": tasks, "count": len(tasks)})
}
func (h *Handler) listPlaybooks(w http.ResponseWriter, r *http.Request) {
	pbs, err := db.ListPlaybooks(r.Context(), h.DB, r.URL.Query().Get("archived") == "1")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"playbooks": pbs, "count": len(pbs)})
}
func (h *Handler) getPlaybook(w http.ResponseWriter, r *http.Request) {
	p, err := db.GetPlaybook(r.Context(), h.DB, r.PathValue("slug"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if p == nil {
		writeError(w, http.StatusNotFound, errString("playbook not found"))
		return
	}
	writeJSON(w, http.StatusOK, p)
}
func (h *Handler) playbookRuns(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	runs, err := db.ListTasks(r.Context(), h.DB, db.TaskFilter{Kind: "playbook_run", PlaybookSlug: slug})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"runs": runs, "count": len(runs)})
}

func (h *Handler) graph(w http.ResponseWriter, r *http.Request) {
	g, err := graph.Build(r.Context(), h.DB)
	if err != nil {
		// Empty graph is a 200 with explicit empty + a hint
		if g != nil {
			writeJSON(w, http.StatusOK, map[string]any{"nodes": g.Nodes, "edges": g.Edges, "empty": true})
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, g)
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
