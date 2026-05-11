.PHONY: build dev test clean ui-install ui-build go-build

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

clean:
	rm -rf ui/dist ui/node_modules flow-ui

install: build
	mv flow-ui $${GOBIN:-$$(go env GOPATH)/bin}/flow-ui
	@echo "Installed flow-ui to $${GOBIN:-$$(go env GOPATH)/bin}/flow-ui"
