package server

import (
	"database/sql"
	"io/fs"
	"net/http"
	"strings"

	"github.com/swapnildahiphale/flow-ui/internal/api"
)

type Config struct {
	DB  *sql.DB
	Dev bool
	// Static is the embedded SPA filesystem rooted at index.html.
	// In dev mode this may be nil — Vite serves the SPA.
	Static fs.FS
}

func New(cfg Config) http.Handler {
	mux := http.NewServeMux()

	apiH := api.New(cfg.DB)
	apiH.Routes(mux)

	if !cfg.Dev && cfg.Static != nil {
		mux.Handle("/", spaHandler(cfg.Static))
	} else if cfg.Dev {
		// In dev, anything that isn't /api/* should be a 404 from this server;
		// the user is expected to hit Vite on :5173 instead.
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.NotFound(w, r)
				return
			}
			http.Error(w, "dev mode: hit Vite on :5173 instead", http.StatusNotFound)
		})
	}

	return mux
}

// spaHandler serves files from the embedded fs and falls back to index.html
// for unknown paths so React Router can take over.
func spaHandler(static fs.FS) http.Handler {
	fileServer := http.FileServer(http.FS(static))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := fs.Stat(static, strings.TrimPrefix(r.URL.Path, "/"))
		if err != nil && r.URL.Path != "/" {
			// SPA fallback: serve index.html for unknown non-asset routes.
			r2 := r.Clone(r.Context())
			r2.URL.Path = "/"
			fileServer.ServeHTTP(w, r2)
			return
		}
		fileServer.ServeHTTP(w, r)
	})
}
