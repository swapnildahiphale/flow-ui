# Release checklist

## What
Run before every Friday release: make sure the build is green, the changelog is
written, the tag is cut, the deploy went out clean, and the release is announced.

## Why
Releases ship Fridays (see [processes.md](../../kb/processes.md)). A solo dev
shipping weekly will eventually forget a step at 5pm on a Friday — skip the
changelog, forget to tag, deploy without a backup. This checklist makes the
ritual mechanical so a tired brain can't drop a step.

## Where
work_dir: ~/code/tideline-app

## Each run does
- **Tests green.** Full suite passes on the release commit, no skips.
- **Changelog.** Write the user-facing changelog entry for this release.
- **Tag.** Cut a semver tag on the release commit.
- **Backup.** Confirm last night's S3 backup succeeded before cutover
  (`nightly-backups` is the gate — no deploy without a fresh backup).
- **Deploy.** Blue/green cutover via the deploy script; smoke-test the green slot.
- **Announce.** Post the release notes (changelog + highlights) to users.

## Out of scope
- Hotfixes. An out-of-band emergency fix skips the changelog/announce steps and
  goes straight to deploy. This checklist is for the planned Friday release.

## Signals to watch for
- Tests "green" only because something was skipped → not green.
- A deploy with no fresh backup → stop and fix the backup first.

---
*Run with `flow run playbook release-checklist`. Each run gets its own session
and a snapshot of this brief at run time. Editing this file does not
retroactively change past runs.*
