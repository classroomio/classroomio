# Docs-drift prevention

Docs drift because the "does this need docs?" checklist defaults to "no," and ship mode leaves authors to self-assess. This replaces that self-assessment with automatic detection from the diff.

## Two mechanisms

The API reference is generated from the OpenAPI spec. `upload-openapi-spec.yml` regenerates and republishes it on every push to `main`, so it can't drift: there's nothing hand-written to forget.

Everything else user-facing (routes, nav, components, copy) is hand-written and can drift. That's what `needs-docs-review` is for.

`apps/api/**` should never end up in `.github/docs-review/globs.yml`. It would just relabel PRs whose docs already regenerate themselves.

This applies equally to `apps/docs` (Developers, self-hosting, API reference) and `apps/help` (task-based user guides, plus the Glossary) — they're two separate Blume apps, but the same drift risk and the same tooling covers both.

## The pieces

| File | Does what |
|---|---|
| `.github/docs-review/globs.yml` | Defines "user-facing." Edit this to tune the label. |
| `.github/workflows/docs-label.yml` | Labels/comments on PRs matching the globs. Advisory. |
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
