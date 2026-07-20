# Automated Release Process & Changelog PRD

## Purpose

Give ClassroomIO a real **release** mechanism — versioned, tagged, changelog'd
snapshots that self-hosters can pin to and read about — on top of the existing
continuous **deploy** to production.

Today `main` merges deploy to prod continuously (CI builds Docker images), but
there is no reliable release: the `release` script runs the **deprecated**
`standard-version` manually and has drifted (`package.json` says `0.1.13`, the
latest git tag is `v1.0.0`, and `CHANGELOG.md` only reflects `0.1.x`). This PRD
replaces that manual step with **release-please**, which prepares a versioned
release continuously and lets a maintainer cut it on a cadence with one merge.

## The governing distinction

> **Deploy ≠ Release.** A deploy is "the code running on our prod server" and
> stays continuous/automatic on every `main` merge (unchanged by this PRD). A
> release is a named, tagged, changelog'd snapshot for the **community** to
> self-host and pin to. This PRD only adds the release track; it does not touch
> how prod deploys.

## Confirmed decisions

1. **Tool: [release-please](https://github.com/googleapis/release-please)
   (v4 action).** GitHub-native, reads Conventional Commits (already enforced),
   maintains a permanent "Release PR." This is the maintainer-recommended
   successor to `standard-version`.
2. **Model: cadence-by-habit, not release-on-every-merge and not cron.**
   release-please keeps a Release PR always up to date; a maintainer merges it on
   a chosen rhythm (target: **weekly**). Merging *work* PRs never releases;
   merging the *Release PR* is the one and only release trigger. This mirrors how
   cal.com operates (human-triggered, machine-prepared).
3. **Versioning: SemVer, single version for the whole app.** `feat` → minor,
   `fix` → patch, `feat!`/`BREAKING CHANGE` → major. One version tag `vX.Y.Z`
   covers the Dockerized app (api + dashboard + jobs + packages).
4. **Side packages stay independently published.** `@classroomio/mcp`
   (`publish-mcp.yml`) and `@classroomio/course-app` (`publish-course-app.yml`)
   keep their own manual `workflow_dispatch` publish flows. release-please does
   **not** version or publish them. (Not Changesets — that only pays off with
   many independently-versioned npm packages; we ship one app.)
5. **Docker images reuse the existing tag trigger.** `docker-publish.yml` already
   fires on `push: tags: v*`; a release-please tag builds the versioned image
   automatically. No new build pipeline.
6. **Retire `standard-version`.** Remove the dep and the `"release"` script.

## Current state audit

| Capability | Status | Location |
| --- | --- | --- |
| Continuous deploy on `main` | works | `docker-publish.yml` (`push: branches: main`, path-filtered) |
| Docker build on version tag | works | `docker-publish.yml` (`push: tags: v*`) + `workflow_dispatch` |
| Conventional Commits enforced | works (PR-title lint) | `semantic-pull-requests.yml` (`amannn/action-semantic-pull-request@v5`) |
| Squash-merge → conventional commit on `main` | works | commit history (`feat(...): ... (#NNN)`) |
| Changelog generation | **deprecated + drifted** | `standard-version` dep + `"release": "standard-version"`; `CHANGELOG.md` stale at `0.1.x` |
| Version source of truth | **inconsistent** | `package.json` `0.1.13` vs latest git tag `v1.0.0` |
| GitHub Releases | none/ad hoc | — |
| Side-package publish | manual, independent | `publish-mcp.yml`, `publish-course-app.yml` (`workflow_dispatch`) |

## Target flow

```
Mon–Thu  merge work PRs → prod deploys continuously (unchanged)
         release-please keeps the "Release PR" (version + CHANGELOG) up to date
Friday   maintainer skims the Release PR changelog → merges it
         → tag vX.Y.Z + GitHub Release + CHANGELOG.md committed
         → docker-publish.yml builds classroomio:vX.Y.Z automatically
```

## Backend / infra changes

### New files

- **`.github/workflows/release-please.yml`** — `on: push: branches: [main]`;
  `googleapis/release-please-action@v4`; permissions `contents: write`,
  `pull-requests: write`.
- **`release-please-config.json`** — single root package:
  `{ "packages": { ".": { "release-type": "node", "changelog-path": "CHANGELOG.md", "bump-minor-pre-major": true } } }`.
- **`release-please-manifest.json`** — seed with the agreed current version
  (see Open questions): `{ ".": "1.0.0" }`.

### Changes

- **`package.json`** — remove `standard-version` from `devDependencies` and
  remove the `"release": "standard-version"` script. Reconcile `version` to the
  manifest seed so it stops drifting.
- **`docker-publish.yml`** — ensure the tag-triggered build reliably fires for
  release-please tags (see Risk below); optionally add a `release: [published]`
  trigger as a belt-and-suspenders path.

## Risks / gotchas

1. **`GITHUB_TOKEN` does not trigger downstream workflows.** A tag pushed by
   release-please using the default `GITHUB_TOKEN` will **not** fire
   `docker-publish.yml`'s `tags: v*` trigger. Resolve by giving release-please a
   **GitHub App token / PAT**, **or** adding a `release: [published]` trigger to
   `docker-publish.yml`. Must be decided before rollout or releases won't build
   images.
2. **Version reconciliation.** The manifest seed must match reality or the first
   release computes a wrong next version. Pick `v1.0.0` (latest tag) vs `0.1.13`
   (package.json) up front.
3. **Unattended cron rejected.** Fully-automated scheduled publishing was
   considered and rejected: a bad image would reach real self-hosted deployments
   with unreviewed notes. Cadence stays a deliberate human merge.

## How modern OSS projects informed this

- **cal.com** — SemVer, ~monthly headline releases + patches; machine-generated
  draft release notes, **human triggers and reviews** before publish; Docker
  builds on the `v*` tag. (This PRD automates one step further: the version is
  computed, not hand-typed.)
- **Polar** — Changesets, per-package SemVer, frequent alpha/beta releases —
  fits their **many published SDKs**, which is why we don't adopt it.
- **Supabase** — two-track: continuous per-repo releases **plus** a curated
  quarterly marketing changelog. Track 2 is out of scope here (see below).

## Out of scope (possible follow-ups)

- **Curated end-user changelog** (a cal.com/Supabase-style blog or docs "What's
  new in vX" page) written for humans, batched at a slower cadence. Track 1
  (GitHub Releases + `CHANGELOG.md`) ships first; this is Track 2.
- Bringing `@classroomio/mcp` / `@classroomio/course-app` into release-please as
  independently-versioned components (would move us toward a manifest with
  multiple packages).
- Pre-release / release-candidate channel (e.g. `next` tag) before promoting to
  stable.

## Open questions

1. **Manifest seed version** — start from `v1.0.0` (latest git tag,
   recommended) or `0.1.13` (current `package.json`)?
2. **Downstream-trigger fix** — GitHub App token/PAT for release-please, or add
   `release: [published]` to `docker-publish.yml`? (Recommend the App token so
   the existing tag trigger keeps working unchanged.)
3. **Cadence** — weekly (recommended) or biweekly Release-PR merge?
