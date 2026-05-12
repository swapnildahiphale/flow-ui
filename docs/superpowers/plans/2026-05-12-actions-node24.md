# GitHub Actions Node.js 24 Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bump the five GitHub Actions pinned in `.github/workflows/release.yml` and `.github/workflows/ci.yml` to versions that run on Node.js 24, before GitHub's 2026-06-02 forced-cutover deprecates Node.js 20.

**Architecture:** Single PR. Apply exact-tag pin bumps to both workflow files. Verify in two gates: (1) PR's CI run must be green with zero "Node.js 20" deprecation annotations; (2) a throwaway `v1.0.1-rc1` pre-release tag must drive a green `release.yml` run that produces 3 binaries + SHA256SUMS, and the downloaded binary's `--version` must print the tag. Delete the rc1 release/tag before merging.

**Tech Stack:** GitHub Actions (YAML workflows), `gh` CLI for PR and release operations, `actionlint` for local YAML validation, `git` for branching and tagging.

**Reference:** Full design at `docs/superpowers/specs/2026-05-12-actions-node24-design.md`.

---

## Version targets (exact pins)

Used in Tasks 2 and 3. Do not deviate.

| Action | Old pin | New pin |
|---|---|---|
| `actions/checkout` | `@v4` | `@v6.0.2` |
| `actions/setup-go` | `@v5` | `@v6.4.0` |
| `actions/setup-node` | `@v4` | `@v6.4.0` |
| `pnpm/action-setup` | `@v4` | `@v6.0.7` |
| `softprops/action-gh-release` | `@v2` | `@v3.0.0` |

`actions/checkout`, `setup-go`, `setup-node`, and `pnpm/action-setup` appear in BOTH files. `softprops/action-gh-release` appears ONLY in `release.yml`.

---

### Task 1: Create feature branch off main

**Files:** none modified yet — git state only.

- [ ] **Step 1: Verify clean working tree on `main`**

Run: `cd /Users/Swapnil/workspace/swapnil/flow-ui && git status`
Expected: `On branch main` and `nothing to commit, working tree clean` (or only untracked files unrelated to workflows).

If the tree isn't clean, stop and check with the user — do NOT stash or discard.

- [ ] **Step 2: Pull latest main**

Run: `git pull --ff-only origin main`
Expected: `Already up to date.` or a fast-forward summary.

- [ ] **Step 3: Create and check out the feature branch**

Run: `git checkout -b chore/actions-node24`
Expected: `Switched to a new branch 'chore/actions-node24'`

---

### Task 2: Bump actions in `.github/workflows/ci.yml`

**Files:**
- Modify: `.github/workflows/ci.yml` (12 line changes total — 4 actions × 3 jobs: vet, test, build)

The four actions appear at identical line patterns inside each of the three jobs. Use `Edit` with `replace_all: true` for each — that catches all 3 occurrences per action in one call. Apply edits in any order; they do not interact.

- [ ] **Step 1: Read the file first**

Use the `Read` tool on `/Users/Swapnil/workspace/swapnil/flow-ui/.github/workflows/ci.yml`. The Edit tool requires a prior Read.

- [ ] **Step 2: Bump `actions/checkout`**

Edit with `replace_all: true`:
- old_string: `uses: actions/checkout@v4`
- new_string: `uses: actions/checkout@v6.0.2`

Expected: 3 occurrences replaced.

- [ ] **Step 3: Bump `pnpm/action-setup`**

Edit with `replace_all: true`:
- old_string: `uses: pnpm/action-setup@v4`
- new_string: `uses: pnpm/action-setup@v6.0.7`

Expected: 3 occurrences replaced.

- [ ] **Step 4: Bump `actions/setup-node`**

Edit with `replace_all: true`:
- old_string: `uses: actions/setup-node@v4`
- new_string: `uses: actions/setup-node@v6.4.0`

Expected: 3 occurrences replaced.

- [ ] **Step 5: Bump `actions/setup-go`**

Edit with `replace_all: true`:
- old_string: `uses: actions/setup-go@v5`
- new_string: `uses: actions/setup-go@v6.4.0`

Expected: 3 occurrences replaced.

- [ ] **Step 6: Verify the file changed as expected**

Run: `grep -nE 'uses:' /Users/Swapnil/workspace/swapnil/flow-ui/.github/workflows/ci.yml`

Expected (12 lines total — 4 actions × 3 jobs, in this order per job: checkout, pnpm, setup-node, setup-go):
```
uses: actions/checkout@v6.0.2
uses: pnpm/action-setup@v6.0.7
uses: actions/setup-node@v6.4.0
uses: actions/setup-go@v6.4.0
```
(Each of those 4 lines appears 3 times, once per job.)

If any line still shows an old pin (`@v4`, `@v5`), stop and fix.

- [ ] **Step 7: Verify `node-version: 20` is still present (we are NOT changing it)**

Run: `grep -n 'node-version:' /Users/Swapnil/workspace/swapnil/flow-ui/.github/workflows/ci.yml`

Expected: 3 occurrences of `node-version: 20`. This is the app's Node version (Vite/pnpm build environment), separate from the action's own Node 24 runtime. Do NOT touch this.

---

### Task 3: Bump actions in `.github/workflows/release.yml`

**Files:**
- Modify: `.github/workflows/release.yml` (5 line changes total — one of each action, single job)

- [ ] **Step 1: Read the file first**

Use the `Read` tool on `/Users/Swapnil/workspace/swapnil/flow-ui/.github/workflows/release.yml`. The Edit tool requires a prior Read.

- [ ] **Step 2: Bump `actions/checkout`**

Edit (single occurrence, so `replace_all` is unnecessary but harmless):
- old_string: `uses: actions/checkout@v4`
- new_string: `uses: actions/checkout@v6.0.2`

- [ ] **Step 3: Bump `pnpm/action-setup`**

Edit:
- old_string: `uses: pnpm/action-setup@v4`
- new_string: `uses: pnpm/action-setup@v6.0.7`

- [ ] **Step 4: Bump `actions/setup-node`**

Edit:
- old_string: `uses: actions/setup-node@v4`
- new_string: `uses: actions/setup-node@v6.4.0`

- [ ] **Step 5: Bump `actions/setup-go`**

Edit:
- old_string: `uses: actions/setup-go@v5`
- new_string: `uses: actions/setup-go@v6.4.0`

- [ ] **Step 6: Bump `softprops/action-gh-release`**

Edit:
- old_string: `uses: softprops/action-gh-release@v2`
- new_string: `uses: softprops/action-gh-release@v3.0.0`

Note: this is a real semver major bump (v2 → v3). Per the spec's diligence, it is a pure runtime bump — no input/output schema change. Our three inputs (`files`, `generate_release_notes`, `fail_on_unmatched_files`) are unchanged. Safe.

- [ ] **Step 7: Verify the file changed as expected**

Run: `grep -nE 'uses:' /Users/Swapnil/workspace/swapnil/flow-ui/.github/workflows/release.yml`

Expected exactly these 5 lines (in this order):
```
uses: actions/checkout@v6.0.2
uses: pnpm/action-setup@v6.0.7
uses: actions/setup-node@v6.4.0
uses: actions/setup-go@v6.4.0
uses: softprops/action-gh-release@v3.0.0
```

If any line still shows an old pin, stop and fix.

---

### Task 4: Local validation with `actionlint`

**Files:** none modified.

- [ ] **Step 1: Check `actionlint` is available**

Run: `which actionlint`
Expected: a path (e.g. `/opt/homebrew/bin/actionlint`).

If not installed, install via Homebrew: `brew install actionlint`. Re-run the `which` check to confirm.

- [ ] **Step 2: Lint `ci.yml`**

Run: `actionlint /Users/Swapnil/workspace/swapnil/flow-ui/.github/workflows/ci.yml`
Expected: no output (zero issues). Exit code 0.

If `actionlint` complains, read the error and fix the YAML before continuing.

- [ ] **Step 3: Lint `release.yml`**

Run: `actionlint /Users/Swapnil/workspace/swapnil/flow-ui/.github/workflows/release.yml`
Expected: no output. Exit code 0.

---

### Task 5: Commit, push, and open PR

**Files:** git state + remote.

- [ ] **Step 1: Stage and inspect the diff**

Run: `cd /Users/Swapnil/workspace/swapnil/flow-ui && git diff .github/workflows/`

Expected: 17 changed lines total — 12 in `ci.yml`, 5 in `release.yml`. Each line is a `uses:` pin replacement. No other lines should change (no whitespace, no `node-version`, no job logic).

- [ ] **Step 2: Commit**

Run:
```bash
git add .github/workflows/ci.yml .github/workflows/release.yml
git commit -m "$(cat <<'EOF'
chore(ci): bump GitHub Actions to Node.js 24-compatible tags

Before GitHub's 2026-06-02 cutover that forces Node.js 24 on runners,
pin all five actions to the latest exact tags that ship the node24
runtime:

- actions/checkout         @v4 -> @v6.0.2
- actions/setup-go         @v5 -> @v6.4.0
- actions/setup-node       @v4 -> @v6.4.0
- pnpm/action-setup        @v4 -> @v6.0.7
- softprops/action-gh-release @v2 -> @v3.0.0

node-version: 20 in setup-node steps is the app's build runtime and
is intentionally unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: one new commit on `chore/actions-node24`. Run `git log --oneline -3` to confirm.

- [ ] **Step 3: Push the branch**

Run: `git push -u origin chore/actions-node24`
Expected: branch created on origin, tracking set up.

- [ ] **Step 4: Open PR**

Run:
```bash
gh pr create --title "chore(ci): bump GitHub Actions to Node.js 24-compatible tags" --body "$(cat <<'EOF'
## Summary

- Bumps five actions to exact tags that run on Node.js 24
- Pre-empts GitHub's 2026-06-02 forced-cutover that deprecates Node.js 20
- Pure version bumps — no logic, runner, or platform changes

| Action | Before | After |
|---|---|---|
| actions/checkout | @v4 | @v6.0.2 |
| actions/setup-go | @v5 | @v6.4.0 |
| actions/setup-node | @v4 | @v6.4.0 |
| pnpm/action-setup | @v4 | @v6.0.7 |
| softprops/action-gh-release | @v2 | @v3.0.0 |

`node-version: 20` in `setup-node` steps is intentionally unchanged — that's the app's build runtime, separate from the action's own Node 24 runtime.

## Test plan

- [ ] CI run (vet / test / build) is green
- [ ] CI run page shows zero "Node.js 20" deprecation annotations
- [ ] A throwaway v1.0.1-rc1 tag drives a green release.yml run
- [ ] rc1 release has 3 binaries + SHA256SUMS attached
- [ ] Downloaded binary's --version prints v1.0.1-rc1
- [ ] rc1 release and tag cleaned up before merge

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: prints a PR URL. Capture this URL — Task 6 needs it.

---

### Task 6: Verify the PR's CI run

**Files:** none modified — verification only.

- [ ] **Step 1: Wait for the CI run to complete**

Run: `gh pr checks --watch`
Expected: all three jobs (`vet`, `test`, `build`) finish with ✓. The command blocks until done.

If any job fails, read the log (`gh run view --log-failed`) and fix the underlying issue before continuing. Most likely failure modes: a typo in an action tag, or a transient runner issue (re-run via `gh run rerun <run-id>`).

- [ ] **Step 2: Inspect annotations for "Node.js 20" deprecation warnings**

Run:
```bash
gh run list --workflow=ci.yml --branch chore/actions-node24 --limit 1 --json databaseId --jq '.[0].databaseId' | \
  xargs -I {} gh api repos/:owner/:repo/check-runs/{}/annotations 2>/dev/null || \
gh pr view --json statusCheckRollup --jq '.statusCheckRollup'
```

Simpler manual alternative: open the PR's "Checks" tab in the browser (`gh pr view --web`) and scan for any yellow "Node.js 20 actions are deprecated" banners.

Expected: zero "Node.js 20" deprecation annotations across all three jobs.

If any deprecation warning remains, identify which action triggered it (the warning names the action), confirm its pin matches the table at the top of this plan, and re-check that the bump was committed.

- [ ] **Step 3: Confirm green**

Mark this task complete only when: 3/3 CI jobs green AND zero Node.js 20 deprecation annotations.

---

### Task 7: Tag-verify the release pipeline with `v1.0.1-rc1`

**Files:** git tag (local + remote) + GitHub release.

The release workflow only fires on a `v*` tag push, so the PR's CI run does not exercise it. We push a throwaway pre-release tag from the branch HEAD to prove the release path works.

- [ ] **Step 1: Confirm you are on the branch HEAD**

Run: `git rev-parse --abbrev-ref HEAD && git rev-parse HEAD`
Expected: `chore/actions-node24` and a SHA. This SHA is what the tag will point at — NOT a main commit.

- [ ] **Step 2: Create and push the rc1 tag**

Run:
```bash
git tag v1.0.1-rc1
git push origin v1.0.1-rc1
```
Expected: tag created locally and pushed to origin.

- [ ] **Step 3: Wait for the release workflow run**

Run: `gh run watch $(gh run list --workflow=release.yml --limit 1 --json databaseId --jq '.[0].databaseId')`
Expected: the `build` job finishes ✓.

If the run fails, the most likely culprit is `softprops/action-gh-release@v3.0.0` misbehaving against our inputs. Read the failed step's log (`gh run view --log-failed`) and decide: fix forward, or fall back to `softprops/action-gh-release@v2.6.2` (still `node20` but functional) for now.

- [ ] **Step 4: Verify the release page has the expected assets**

Run: `gh release view v1.0.1-rc1`
Expected: release exists, with these four assets attached:
- `flow-ui-darwin-arm64`
- `flow-ui-darwin-amd64`
- `flow-ui-linux-amd64`
- `SHA256SUMS`

- [ ] **Step 5: Inspect the release run for deprecation annotations**

Run: `gh run view --web $(gh run list --workflow=release.yml --limit 1 --json databaseId --jq '.[0].databaseId')` (opens in browser).

Expected: zero "Node.js 20" deprecation annotations on the release run.

---

### Task 8: Install smoke test

**Files:** local tempdir for downloaded binary. No repo changes.

This proves the `-X main.version=${GITHUB_REF_NAME}` ldflag injection still works through the new actions — the README install command depends on it.

- [ ] **Step 1: Create a scratch directory and `cd` into it**

Run:
```bash
SMOKE_DIR=$(mktemp -d -t flow-ui-rc1-smoke)
cd "$SMOKE_DIR"
echo "$SMOKE_DIR"
```
Expected: prints a tmp path.

- [ ] **Step 2: Download the darwin-arm64 binary and SHA256SUMS**

Run:
```bash
gh release download v1.0.1-rc1 --repo "$(gh repo view --json nameWithOwner --jq .nameWithOwner)" \
  --pattern 'flow-ui-darwin-arm64' --pattern 'SHA256SUMS'
ls -la
```
Expected: two files in the scratch dir.

Note: `gh release download` uses authenticated access. Public anonymous `curl` against this private repo's assets returns 404 (known issue from v1.0.0); we don't care here — we're testing the pipeline, not public reachability.

- [ ] **Step 3: Verify checksum**

Run:
```bash
grep flow-ui-darwin-arm64 SHA256SUMS | shasum -a 256 -c
```
Expected: `flow-ui-darwin-arm64: OK`

- [ ] **Step 4: Verify the binary's reported version matches the tag**

Run:
```bash
chmod +x ./flow-ui-darwin-arm64
xattr -d com.apple.quarantine ./flow-ui-darwin-arm64 2>/dev/null || true
./flow-ui-darwin-arm64 --version
```
Expected: prints `v1.0.1-rc1` (or contains `v1.0.1-rc1` if the binary prints a multi-field version string).

If the binary prints `dev` or a different tag, the ldflag injection broke — investigate before merging.

- [ ] **Step 5: Clean up the scratch directory**

Run: `cd /Users/Swapnil/workspace/swapnil/flow-ui && rm -rf "$SMOKE_DIR" && unset SMOKE_DIR`
Expected: scratch dir gone.

---

### Task 9: Delete the rc1 release and tag

**Files:** GitHub release + git tag (local + remote).

The rc1 release was scaffolding. Remove it so the only `v*` release on the repo remains `v1.0.0` (until a real `v1.0.1` is cut later).

- [ ] **Step 1: Delete the GitHub release AND its tag in one shot**

Run: `gh release delete v1.0.1-rc1 --cleanup-tag --yes`
Expected: confirms release deleted; `--cleanup-tag` also deletes the remote tag.

- [ ] **Step 2: Delete the local tag**

Run: `git tag -d v1.0.1-rc1`
Expected: `Deleted tag 'v1.0.1-rc1'`.

- [ ] **Step 3: Verify everything is gone**

Run:
```bash
gh release view v1.0.1-rc1 2>&1 | head -1
gh api "repos/$(gh repo view --json nameWithOwner --jq .nameWithOwner)/git/refs/tags/v1.0.1-rc1" 2>&1 | head -1
git tag -l v1.0.1-rc1
```
Expected: first two return "not found" / 404 messages; third produces no output.

The branch-head commit remains reachable via the open PR — nothing is garbage-collected.

---

### Task 10: Merge the PR

**Files:** main branch state.

- [ ] **Step 1: Confirm PR is still mergeable**

Run: `gh pr view --json mergeable,mergeStateStatus`
Expected: `mergeable: MERGEABLE` and `mergeStateStatus: CLEAN` (or `UNSTABLE` only if a non-required check is pending — verify before merging).

- [ ] **Step 2: Squash-merge the PR**

Run: `gh pr merge --squash --delete-branch`
Expected: PR merged via squash, remote branch `chore/actions-node24` deleted.

Squash matches the prior release PR (#2: `Ship single-command install via GitHub Releases (v1.0.0) (#2)`). If the user prefers merge commits, swap `--squash` for `--merge` — but be consistent.

- [ ] **Step 3: Update local main**

Run:
```bash
git checkout main
git pull --ff-only origin main
git branch -d chore/actions-node24
```
Expected: main fast-forwards to include the new commit; local branch deleted.

- [ ] **Step 4: Confirm the merged commit is on main**

Run: `git log --oneline -3`
Expected: top commit message starts with `chore(ci): bump GitHub Actions to Node.js 24-compatible tags`.
