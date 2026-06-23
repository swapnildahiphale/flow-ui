package api

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strings"

	"github.com/swapnildahiphale/flow-ui/internal/db"
)

// archiveTask archives a task via the `flow` CLI. The DB handle is read-only,
// so this is the only sanctioned write path: it confirms the task exists (which
// also prevents the slug from being interpreted as a CLI flag) and then shells
// out to `flow archive <slug>`. Already-archived tasks are treated as an
// idempotent no-op.
func (h *Handler) archiveTask(w http.ResponseWriter, r *http.Request) {
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
	if t.ArchivedAt != nil {
		// Idempotent: the redirect after archiving makes a re-archive rare, but
		// don't error if it happens (e.g. a stale tab).
		writeJSON(w, http.StatusOK, map[string]any{"slug": slug, "archived": true})
		return
	}
	if err := h.Archive(r.Context(), slug); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"slug": slug, "archived": true})
}

// flowArchive runs `flow archive <slug>` with the parent process's environment.
// flow resolves its DB from $FLOW_ROOT / ~/.flow, independent of flow-ui's
// --db flag; for the default single-user dashboard these point at the same db.
func flowArchive(ctx context.Context, slug string) error {
	bin, err := exec.LookPath("flow")
	if err != nil {
		return fmt.Errorf("flow CLI not found on PATH: %w", err)
	}
	cmd := exec.CommandContext(ctx, bin, "archive", slug)
	cmd.Env = os.Environ()
	out, err := cmd.CombinedOutput()
	if err != nil {
		msg := strings.TrimSpace(string(out))
		if msg == "" {
			msg = err.Error()
		}
		return fmt.Errorf("flow archive %q: %s", slug, msg)
	}
	return nil
}
