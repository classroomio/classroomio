---
name: userjot-changelog
description: Draft and publish ClassroomIO product changelog posts in UserJot. Use when the user asks to "write/draft a changelog", "announce a shipped feature", "post an update", "add to the changelog", or mentions UserJot, the updates widget, or notifying customers about a shipped change.
---

# UserJot changelog drafting

ClassroomIO announces shipped features through UserJot (feedback widget + changelog, app id `cm4a6vcmp00jpmdb5n66rmkzz`). Publishing a changelog post automatically notifies customers: the in-app widget flags the update ("What's new" in the sidebar profile menu) and subscribed users get an email.

## Golden rules

1. **Never publish without explicit approval.** Always create a `draft` and let the user review. The user adds screenshots/demo videos themselves in the UserJot dashboard — put `[SCREENSHOT: ...]` placeholder lines where media belongs (the API has no media upload).
2. **Only org managers see the widget** (admins/tutors). Write for organization owners and tutors, not students.
3. Follow the house style in `.github/changelog-draft-prompt.md` — it is the single source of truth for voice and structure (read it before drafting).

## How to draft

### Option A — REST script (preferred, no MCP dependency)

Requires `USERJOT_API_TOKEN` in the environment.

```bash
USERJOT_API_TOKEN=... node scripts/userjot-create-changelog.mjs \
  --title "Feature name" \
  --markdown-file draft.md
```

Creates a **draft**. Add `--request-ids <ids>` to link UserJot feedback requests (their voters get notified on publish), `--short "..."` for a summary line. Publishing is done by the user in the UserJot dashboard, or with `--publish` / `--publish-at <ISO timestamp>` when they explicitly ask.

### Option B — UserJot MCP server

The repo's `opencode.json` registers a remote MCP server (`userjot`) at `https://api.userjot.com/v1/mcp`, authenticated with the `USERJOT_API_TOKEN` env var. If connected, use `createChangelog` / `updateChangelog` tools the same way — draft first. `listChangelogs` is useful to review recent posts and keep the voice consistent.

## Workflow for a shipped feature/PR

1. Gather what shipped: PR title, description, diff (or ask the user).
2. Apply the style rules from `.github/changelog-draft-prompt.md`, write the markdown to a file.
3. Create the draft via Option A (or B).
4. Show the draft text to the user and tell them: review in UserJot dashboard → Changelog, add screenshots/demo video at the `[SCREENSHOT: ...]` placeholders, then publish.

Note: merges of `feat`/`perf` PRs into `main` are drafted automatically by the `Draft changelog` GitHub Action (`.github/workflows/changelog-draft.yml`) — this skill is for drafting on demand.
