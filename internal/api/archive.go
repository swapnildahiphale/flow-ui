package api

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/swapnildahiphale/flow-ui/internal/db"
)

// archiveTask archives a task via the `flow` CLI (the only sanctioned write path —
// flow-ui's DB handle is read-only). It confirms the task exists, then shells out;
// an already-archived task is an idempotent no-op.
//
// No CSRF guard by design: flow-ui binds 127.0.0.1 with no auth (CLAUDE.md). A web
// page the user visits could POST here, but the localhost-only / no-auth stance is
// the documented trade-off for this single-user dashboard.
func (h *Handler) archiveTask(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	// The read may ride the request context; the mutation below deliberately does not.
	t, err := db.GetTask(r.Context(), h.DB, slug)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if t == nil {
		writeError(w, http.StatusNotFound, errString("task not found"))
		return
	}
	if t.ArchivedAt == nil {
		// Only invoke the CLI when there's something to do; both paths share the
		// single success response below.
		if err := h.Archive(slug); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"slug": slug, "archived": true})
}

// flowRunner runs the `flow` CLI for mutations. flow-ui's DB handle is read-only
// (CLAUDE.md), so every write routes through the CLI. The binary is resolved once;
// the DB location is forwarded via FLOW_ROOT so the CLI mutates the same db flow-ui
// is reading (flow has no --db flag and derives its db as $FLOW_ROOT/flow.db).
type flowRunner struct {
	bin      string // resolved path to `flow`; "" if not on PATH (surfaced at call time)
	flowRoot string // dir of the db flow-ui opened; exported to the child as FLOW_ROOT
}

func newFlowRunner(flowRoot string) *flowRunner {
	bin, _ := exec.LookPath("flow") // resolve once, not per call
	return &flowRunner{bin: bin, flowRoot: flowRoot}
}

// run executes `flow <args...>`. It deliberately uses a detached background context
// with its own timeout: a client disconnect must NOT SIGKILL a write mid-flight.
func (f *flowRunner) run(args ...string) error {
	if f.bin == "" {
		return errString("flow CLI not found on PATH")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, f.bin, args...)
	// Last value wins, so flow-ui's FLOW_ROOT overrides any inherited one.
	cmd.Env = append(os.Environ(), "FLOW_ROOT="+f.flowRoot)
	out, err := cmd.CombinedOutput()
	if err != nil {
		msg := strings.TrimSpace(string(out))
		if msg == "" {
			msg = err.Error()
		}
		return fmt.Errorf("flow %s: %s", strings.Join(args, " "), msg)
	}
	return nil
}

// archive shells out to `flow archive -- <slug>`. The `--` terminator stops a
// slug beginning with `-` from being parsed as a flag by flow's own flag parser.
func (f *flowRunner) archive(slug string) error {
	return f.run("archive", "--", slug)
}
