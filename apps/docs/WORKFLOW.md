# Docs-drift prevention

Docs drift because the "does this need docs?" checklist defaults to "no," and ship mode leaves authors to self-assess. This replaces that self-assessment with automatic detection from the diff.

## Three mechanisms

The API reference is generated from the OpenAPI spec. `upload-openapi-spec.yml` regenerates and republishes it on every push to `main`, so it can't drift: there's nothing hand-written to forget.

Everything else user-facing (routes, nav, components, copy) is hand-written and can drift. That's what `needs-docs-review` is for.

The PR docs fact check uses OpenCode with DeepSeek V4.1 Flash to compare each PR diff with the hand-written Help Center, Developers, and relevant README pages. It also checks screenshots referenced by affected guides against changed screens. It posts a 1–5 score as a GitHub review and adds replyable review comments for each confirmed stale page or image. A reply to one of its review threads triggers a fresh check and a response in that thread. A clean check says ✅ 5/5 and “All good.”

`apps/api/**` should never end up in `.github/docs-review/globs.yml`. It would just relabel PRs whose docs already regenerate themselves.

This applies equally to `apps/docs` (Developers, self-hosting, API reference) and `apps/help` (task-based user guides, plus the Glossary) — they're two separate Blume apps, but the same drift risk and the same tooling covers both.

## The pieces

| File | Does what |
|---|---|
| `.github/docs-review/globs.yml` | Defines "user-facing." Edit this to tune the label. |
| `.github/workflows/docs-label.yml` | Labels/comments on PRs matching the globs. Advisory. |
| `.github/workflows/docs-fact-check.yml` | Runs the OpenCode documentation fact check on PR updates and review thread replies. |
| `.github/workflows/docs-fact-check-reply.yml` | Relays review replies from fork PRs to the trusted fact-check workflow. |
| `.github/prompts/docs-fact-check.md` | Defines the evidence and JSON output required from the reviewer. |
| `.github/scripts/docs-fact-check.mjs` | Prepares the PR diff, validates findings, and posts GitHub reviews and replies. |
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

Swap `apps/docs` for `apps/help` (and its own `.vale.ini`) to run Vale against the Help Center content instead.

## Deferred for later

- A Vale rule for the task-first-heading style. Google and write-good don't catch it.
- A scheduled bot that opens an issue from the staleness script instead of someone running it by hand.
