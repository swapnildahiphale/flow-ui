package main

import (
	"context"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"
	"time"

	"github.com/swapnildahiphale/flow-ui/internal/db"
	"github.com/swapnildahiphale/flow-ui/internal/server"
)

const defaultDBPath = "~/.flow/flow.db"

// version is set at build time via -ldflags "-X main.version=<tag>".
var version = "dev"

func main() {
	port := flag.Int("port", 0, "port to bind on 127.0.0.1 (0 = pick a free one)")
	dbPath := flag.String("db", defaultDBPath, "path to flow.db (supports ~)")
	dev := flag.Bool("dev", false, "dev mode: skip SPA embed, serve API only (used with `make dev`)")
	noOpen := flag.Bool("no-open", false, "don't open the browser after starting")
	showVersion := flag.Bool("version", false, "print version and exit")
	flag.Parse()

	if *showVersion {
		fmt.Println(version)
		return
	}

	resolvedDB, err := db.ResolvePath(*dbPath)
	if err != nil {
		log.Fatalf("flow-ui: resolve db path: %v", err)
	}

	conn, err := db.OpenReadOnly(resolvedDB)
	if err != nil {
		log.Fatalf("flow-ui: open db: %v", err)
	}
	defer conn.Close()

	listener, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", *port))
	if err != nil {
		log.Fatalf("flow-ui: listen: %v", err)
	}

	addr := listener.Addr().(*net.TCPAddr)
	url := fmt.Sprintf("http://127.0.0.1:%d", addr.Port)

	flowRoot := filepath.Dir(resolvedDB)
	var static fs.FS
	if !*dev {
		static = staticFS()
	}
	handler := server.New(server.Config{
		DB:       conn,
		Dev:      *dev,
		Static:   static,
		FlowRoot: flowRoot,
	})

	srv := &http.Server{
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("flow-ui: serving on %s  (db: %s)", url, resolvedDB)
		if !*dev && !*noOpen {
			openBrowser(url)
		}
		if err := srv.Serve(listener); err != nil && err != http.ErrServerClosed {
			log.Fatalf("flow-ui: serve: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	log.Println("flow-ui: bye")
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "linux":
		cmd = exec.Command("xdg-open", url)
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", url)
	default:
		return
	}
	_ = cmd.Start()
}
