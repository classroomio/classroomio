# Docs-drift prevention

Docs drift because the "does this need docs?" checklist defaults to "no," and ship mode leaves authors to self-assess. This replaces that self-assessment with automatic detection from the diff.

## Three mechanisms

The API reference is generated from the OpenAPI spec. `upload-openapi-spec.yml` regenerates and republishes it on every push to `main` that touches `apps/api/**` or `packages/utils/src/openapi/**`, so it can't drift: there's nothing hand-written to forget.

Everything else user-facing (routes, nav, components, copy) is hand-written and can drift. That's what `needs-docs-review` is for.

The PR docs fact check uses OpenCode with DeepSeek V4.1 Flash to compare each PR diff with the hand-written Help Center, Developers, and relevant README pages. It also checks screenshots referenced by affected guides against changed screens. After the first successful check, later runs review only the commits added on top of the last checked commit and revalidate the pages with open fact-check findings (review threads and fallback PR comments); a force-push or unavailable commit falls back to a full PR review. It posts a 1–5 score as a GitHub review and adds replyable review comments for each confirmed stale page or image, or a regular PR comment when that finding's file is no longer in the PR diff. A reply to one of its review threads triggers a response in that thread. A full clean check says ✅ 5/5 and “All good,” and resolves all of the fact-check's open review threads; an incremental clean check resolves only the findings it revalidated and removes the fallback comments it revalidated. Thread resolution runs in a separate `resolve` job that holds `contents: write` and checks out only the default branch; the review job keeps `contents: read` and never executes PR code.

`apps/api/**` should never end up in `.github/docs-review/globs.yml`. It would just relabel PRs whose docs already regenerate themselves.

This applies equally to `apps/docs` (Developers, self-hosting, API reference) and `apps/help` (task-based user guides, plus the Glossary) — they're two separate Blume apps, but the same drift risk and the same tooling covers both.

## The pieces

| File | Does what |
|---|---|
| `.github/docs-review/globs.yml` | Defines "user-facing." Edit this to tune the label. |
| `.github/workflows/docs-label.yml` | Labels/comments on PRs matching the globs. Advisory. |
| `.github/workflows/docs-fact-check.yml` | Runs the OpenCode documentation fact check on PR updates and review thread replies, then applies its thread-resolution plan in a separate `resolve` job. |
| `.github/workflows/docs-fact-check-reply.yml` | Relays review replies to the trusted fact-check workflow (needed for fork PRs). |
| `.github/prompts/docs-fact-check.md` | Defines the evidence and JSON output required from the reviewer. |
| `.github/scripts/docs-fact-check.mjs` | Prepares the PR diff, validates findings, posts GitHub reviews and replies, and writes the thread-resolution plan (`--resolve-only` applies it). |
| `apps/docs/.vale.ini`, `apps/help/.vale.ini` | Vale config per app: Google + write-good, warnings only. |
| `apps/docs/CONTRIBUTING.md` | Placement rules, doc types, voice/style — for `apps/docs`. |
| `apps/docs/scripts/check-stale-docs.mjs`, `apps/help/scripts/check-stale-docs.mjs` | `pnpm docs:check-stale` / `pnpm help:check-stale`: stale-page worklists, one per app. |

## Making it blocking later

`docs-label.yml` has a `TODO(make-blocking)` comment marking the one line to change.

## Running things locally

```bash
cd apps/docs
vale sync && vale content/docs
```

```bash
pnpm docs:check-stale
pnpm help:check-stale
```

Swap `apps/docs` for `apps/help` and `content/docs` for `content/help` (with its own `.vale.ini`) to run Vale against the Help Center content instead.

## Deferred for later

- A Vale rule for the task-first-heading style. Google and write-good don't catch it.
- A scheduled bot that opens an issue from the staleness script instead of someone running it by hand.
