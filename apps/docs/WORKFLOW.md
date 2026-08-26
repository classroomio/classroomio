# Docs-drift prevention

Docs drift because the "does this need docs?" checklist defaults to "no," and ship mode leaves authors to self-assess. This replaces that self-assessment with automatic detection from the diff.

## Two mechanisms

The API reference is generated from the OpenAPI spec. `upload-openapi-spec.yml` regenerates and republishes it on every push to `main`, so it can't drift: there's nothing hand-written to forget.

Everything else user-facing (routes, nav, components, copy) is hand-written and can drift. That's what `needs-docs-review` is for.

`apps/api/**` should never end up in `.github/docs-review/globs.yml`. It would just relabel PRs whose docs already regenerate themselves.

## The pieces

| File | Does what |
|---|---|
| `.github/docs-review/globs.yml` | Defines "user-facing." Edit this to tune the label. |
| `.github/workflows/docs-label.yml` | Labels/comments on PRs matching the globs. Advisory. |
| `.github/workflows/docs-validate.yml` | Lints `apps/docs/**` PRs (links + prose). Advisory. |
| `apps/docs/.vale.ini` | Vale config: Google + write-good, warnings only. |
| `apps/docs/CONTRIBUTING.md` | Placement rules, doc types, voice/style. |
| `apps/docs/scripts/check-stale-docs.mjs` | `pnpm docs:check-stale`: stale-page worklist. |

## Making it blocking later

`docs-label.yml` has a `TODO(make-blocking)` comment marking the one line to change. Don't add `docs-validate.yml` to required checks, ever: it's path-filtered to `apps/docs/**`, so a required check there would leave code-only PRs stuck pending forever.

## Running things locally

```
cd apps/docs
vale sync && vale content/docs
```

```
pnpm docs:check-stale
```

## Deferred for later

- A Vale rule for the task-first-heading style. Google and write-good don't catch it.
- A scheduled bot that opens an issue from the staleness script instead of someone running it by hand.
