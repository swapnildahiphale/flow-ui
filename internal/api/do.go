package api

import (
	"net/http"

	"github.com/swapnildahiphale/flow-ui/internal/db"
)

// doTask starts (or resumes) work on a task by shelling out to `flow do <slug>`
// (the only sanctioned write path — flow-ui's DB handle is read-only). Unlike
// `flow archive`, `flow do` spawns an interactive terminal tab + Claude session
// on the host and returns immediately, so this is fire-and-forget: a non-zero
// exit (live-session guard, missing macOS Accessibility grant, etc.) comes back
// as an error and is surfaced to the UI verbatim.
//
// No CSRF guard by design: flow-ui binds 127.0.0.1 with no auth (CLAUDE.md). The
// localhost-only / no-auth stance is the documented trade-off for this
// single-user dashboard, matching archiveTask.
func (h *Handler) doTask(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	// The read may ride the request context; the spawn below deliberately does not.
	t, err := db.GetTask(r.Context(), h.DB, slug)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if t == nil {
		writeError(w, http.StatusNotFound, errString("task not found"))
		return
	}
	if err := h.Do(slug); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"slug": slug, "started": true})
}

// do shells out to `flow do -- <slug>`. The `--` terminator stops a slug
// beginning with `-` from being parsed as a flag by flow's own flag parser.
// It reuses flowRunner.run (FLOW_ROOT forwarding, detached context + timeout).
func (f *flowRunner) do(slug string) error {
	return f.run("do", "--", slug)
}
