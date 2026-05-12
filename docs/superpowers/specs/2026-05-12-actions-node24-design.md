# Upgrade GitHub Actions before Node.js 20 deprecation — design

**Date:** 2026-05-12
**Task:** [actions-node24](https://github.com/Facets-cloud/flow) (flow task)
**Deadline:** 2026-06-02 (Node.js 24 becomes forced default on GitHub runners)
**Removal date:** 2026-09-16 (Node.js 20 removed from runners entirely)

## Context

After the `v1.0.0` release on 2026-05-11, every job in our workflows was annotated with a deprecation warning: five pinned actions still run on the Node.js 20 runtime. We need to bump them before the cutover so our release pipeline doesn't silently break — `release.yml` is the path the README install command depends on.

The fix is mechanical but has two real decision points: how to verify the release pipeline (which CI does not exercise) and how to handle `softprops/action-gh-release` (still on `node20` even at its latest v2.6.2 — v3.0.0 is mandatory).

## Approach

Single-PR mechanical bump with empirical verification:

1. Branch `chore/actions-node24` off `main`.
2. Apply exact-pin bumps to `.github/workflows/release.yml` (5 refs) and `.github/workflows/ci.yml` (12 refs — same 4 actions × 3 jobs: vet, test, build).
3. Local sanity: `actionlint` on both workflows before pushing.
4. Push branch, open PR. CI runs vet / test / build against the new actions. Verify jobs green AND zero "Node.js 20" deprecation annotations.
5. Tag-verify the release path: push throwaway pre-release tag `v1.0.1-rc1` pointing at the branch head. Watch `release.yml` run.
6. Verify the rc1 release: workflow green, three binaries + `SHA256SUMS` uploaded, zero deprecation warnings. Install smoke test: download `flow-ui-darwin-arm64` via `gh release download`, verify its sha matches `SHA256SUMS`, run `./flow-ui --version` and confirm it prints `v1.0.1-rc1`.
7. Clean up: `gh release delete v1.0.1-rc1 --cleanup-tag --yes` deletes both the GitHub release and the remote tag in one shot. Delete the local tag too. The branch-head commit remains reachable via the PR; nothing is garbage-collected.
8. Merge PR.

Cutting a real `v1.0.1` is left as a separate "when there's actually something to release" decision — this task ends at merge.

## Version mapping (exact pins)

Both workflows get these replacements. Every occurrence in both files, no exceptions.

| Action | Current pin | New pin (exact) | Why this tag |
|---|---|---|---|
| `actions/checkout` | `@v4` | `@v6.0.2` | Latest stable. `runs.using: node24`. |
| `actions/setup-go` | `@v5` | `@v6.4.0` | Latest stable. `runs.using: node24`. First v6 release supports node24; v6.4.0 is current minor. |
| `actions/setup-node` | `@v4` | `@v6.4.0` | Latest stable. `runs.using: node24`. |
| `pnpm/action-setup` | `@v4` | `@v6.0.7` | Latest stable. `runs.using: node24`. Published 2026-05-11. |
| `softprops/action-gh-release` | `@v2` | `@v3.0.0` | First and only release that supports `node24` — v2.6.2 (latest v2) is still `node20`. Release notes describe a pure runtime bump; no input/output schema change. |

### Pinning convention

Exact tag pins (`@v6.0.2`), not floating majors (`@v6`). Tradeoff accepted: more churn next time, no surprises in between.

### What stays the same

- `node-version: 20` in `setup-node` steps — that's the *app's* Node version (Vite/pnpm build environment), NOT the action's runtime. The brief explicitly carves this out as out-of-scope.
- `ubuntu-latest` for all jobs.
- The set of actions used (no additions, no replacements).
- The set of platforms built (`darwin/arm64`, `darwin/amd64`, `linux/amd64`).

### Edit counts

- `release.yml`: 5 line changes (one of each action, one occurrence each).
- `ci.yml`: 12 line changes (4 actions × 3 jobs).
- Total: 17 line edits. Pure mechanical replacement, no logic changes.

## Verification gates

Each blocks the next.

1. **Local: `actionlint` both files.** Catches typos in tag references and YAML syntax errors before pushing.
2. **PR CI run.** All three jobs green AND the PR/run page shows zero `Node.js 20` deprecation annotations. Visual inspection is sufficient; `gh run view --log` works as a fallback.
3. **rc1 tag push → release run green.** Tag the branch HEAD (not main): `git tag v1.0.1-rc1 && git push origin v1.0.1-rc1`. `release.yml` fires. Verify three binaries + `SHA256SUMS` attached, zero deprecation annotations.
4. **Install smoke test.** `gh release download v1.0.1-rc1 -p flow-ui-darwin-arm64` (authenticated — repo is private), `shasum -a 256 -c` against `SHA256SUMS`, then `./flow-ui --version` should print `v1.0.1-rc1`. This proves the `-X main.version=${GITHUB_REF_NAME}` ldflag injection still works through the new actions.
5. **Cleanup.** `gh release delete v1.0.1-rc1 --cleanup-tag --yes` plus `git tag -d v1.0.1-rc1` locally.
6. **Merge PR.** Match the prior PR #2 merge style.

## Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| `softprops@v3` misbehaves despite the "pure runtime bump" claim | Low | The rc1 tag-test catches this before merge. If it breaks, drop softprops to `@v2.6.2` (still node20, re-adds one deprecation warning) and file an upstream issue. |
| Tagging from a feature-branch HEAD ties the release to a non-main commit | Low | Intentional — we're testing the workflow against the PR's state. The release and tag are deleted before merge. |
| `generate_release_notes: true` produces odd output for `-rc1` (no comparable prior tag in that line) | Low | We don't care — the rc1 release is deleted regardless. |
| Repo is private → rc1 release assets 404 to anonymous downloaders | Known (observation 7415 from v1.0.0) | Smoke-test via `gh release download` (authenticated). We're testing the pipeline, not public reachability. |
| `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` stopgap might be needed (open question in brief) | N/A | Moot. All five actions have node24-supporting tags published. |

## Out of scope (restated from brief)

- No new actions, no new platforms (Windows, linux-arm64).
- No runner change (stay on `ubuntu-latest`).
- No `node-version` change (stays at 20 for the app's build environment — the deprecation is about the action's own runtime, not our app's).
- No cutting a real `v1.0.1` — separate decision, not gated on this task.

## Done when (from brief, validated against this design)

- All five flagged actions are bumped to a node24-supporting tag (exact pins per the version mapping above). ✓ design covers this.
- A PR opens and CI runs green with **zero** Node.js 20 deprecation annotations. ✓ verification gate 2.
- A test tag cuts a release successfully on the updated workflow, with all three binaries + `SHA256SUMS` uploaded — same shape as v1.0.0. ✓ verification gates 3–4 (using `v1.0.1-rc1` rather than a real `v1.0.1`).
- README install command still works end-to-end against the new release. ✓ verification gate 4 (download + checksum + `--version`).
