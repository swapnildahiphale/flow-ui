.PHONY: build dev test clean ui-install ui-build go-build smoke install

# Build everything: ui first, then go binary with embedded ui/dist
build: ui-build go-build

ui-install:
	cd ui && pnpm install

ui-build: ui-install
	cd ui && pnpm build

go-build:
	go build -o flow-ui .

# Dev: vite on :5173 (with /api proxy), go server on :7777 (api only, no embed)
dev:
	@command -v concurrently >/dev/null 2>&1 || npm i -g concurrently
	concurrently -n "ui,api" -c "cyan,magenta" \
		"cd ui && pnpm dev" \
		"go run . --dev --port 7777"

test:
	go test ./...

smoke: build
	./flow-ui --port 17877 --no-open & echo $$! > /tmp/flow-ui-smoke.pid
	@sleep 1
	@echo "--- health ---"
	@curl -sf http://127.0.0.1:17877/api/v1/health
	@echo "\n--- stats ---"
	@curl -sf http://127.0.0.1:17877/api/v1/stats | head -c 200
	@echo "\n--- tasks ---"
	@curl -sf 'http://127.0.0.1:17877/api/v1/tasks?status=in-progress' | head -c 200
	@kill `cat /tmp/flow-ui-smoke.pid` ; rm /tmp/flow-ui-smoke.pid

clean:
	rm -rf ui/dist ui/node_modules flow-ui

install: build
	mv flow-ui $${GOBIN:-$$(go env GOPATH)/bin}/flow-ui
	@echo "Installed flow-ui to $${GOBIN:-$$(go env GOPATH)/bin}/flow-ui"
