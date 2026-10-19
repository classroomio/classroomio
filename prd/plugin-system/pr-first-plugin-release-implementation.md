# PR-First Plugin Release Implementation Playbook

Status: proposed implementation plan

## Objective

Replace the developer-uploaded quarantine submission system with a source-controlled release system.

Plugin authors, including ClassroomIO team members and third-party developers, contribute source code by opening a pull request against the `classroomio-plugins` repository. Maintainers review source code and the untrusted pull-request CI results. Only a protected, post-merge release workflow may build production artifacts, upload them to production storage, and register them in the ClassroomIO catalog.

This document is an implementation specification. Follow the phases in order. Do not leave the old public publishing path in place after the release workflow is operational.

## Target operating model

```text
Contributor fork or branch
  -> pull request to classroomio-plugins
  -> untrusted CI: build, test, package, inspect
  -> maintainer and code-owner review
  -> protected merge to main
  -> trusted release CI with protected deployment credentials
  -> deterministic build and artifact digest
  -> immutable R2 production upload
  -> internal release-registration API
  -> transactional catalog/version registration
  -> plugin is installable from the catalog
```

There is no contributor-facing publish API, submission ID, quarantine bucket, reviewer CDN, reviewer dashboard, or `plugin:publish` credential.

## Scope and decisions

This plan assumes the following decisions:

1. `classroomio-plugins` is the canonical source repository for every catalog plugin.
2. A merged pull request is the human approval event for a public plugin release.
3. The release workflow is the only production publisher.
4. Production assets continue to live in immutable digest-qualified R2/CDN paths.
5. The ClassroomIO API owns catalog/database writes; GitHub Actions must not receive unrestricted production database credentials.
6. The public CLI remains for scaffolding, local packaging, and local development installation only.
7. Each published `(pluginId, version)` is immutable. Any plugin code change requires a new version.
8. Community plugins are source-visible to ClassroomIO reviewers. Closed-source marketplace publishing is out of scope for this model.

## Security invariants

The implementation is incomplete if any of these statements is false:

1. Pull-request code never receives production API, R2, database, Cloudflare, or deployment credentials.
2. A contributor cannot cause a deployment by modifying package scripts, GitHub workflow files, artifact metadata, or a committed digest in a pull request.
3. The production artifact is built from the exact protected commit that was merged, not uploaded by a contributor.
4. The digest stored in `plugin_version` is computed by trusted CI from that artifact.
5. Catalog registration verifies that the immutable artifact exists and matches the submitted manifest and digest.
6. Production artifact paths are never overwritten for a released version.
7. Local development installation cannot create a public catalog version or write to production R2.
8. The host never serves source directories, working directories, or an artifact that is not the approved digest for the requested version.

## Repository ownership and layout

Keep the separate plugin repository. It already exists at `classroomio-plugins` and contains first-party plugins such as `announcement-banner` and `reading-time`.

Introduce an explicit registry at:

```text
classroomio-plugins/registry/plugins.json
```

Suggested shape:

```json
{
  "schemaVersion": 1,
  "plugins": [
    {
      "id": "com.classroomio.announcement-banner",
      "path": "announcement-banner",
      "kind": "first-party",
      "release": true
    },
    {
      "id": "com.example.reading-timer",
      "path": "reading-timer",
      "kind": "community",
      "release": true
    },
    {
      "id": "com.classroomio.plugin-conformance",
      "path": "plugin-conformance",
      "kind": "fixture",
      "release": false
    }
  ]
}
```

Rules enforced by CI:

- Each enabled entry points to one plugin directory containing `plugin.json`.
- The registry ID and `plugin.json.id` must match.
- A plugin ID and path occur once only.
- `com.classroomio.*` is first-party only and requires platform owner approval.
- Fixtures, examples, and conformance plugins are explicitly `release: false`.
- A plugin cannot leave the registry while still published without an explicit deprecation/revocation change.

Do not infer production release candidates from “every directory containing `plugin.json`.” The current CLI’s `--all` discovery model would otherwise accidentally include test fixtures such as `plugin-conformance`.

## Phase 1: prepare public dependencies and repository commands

### 1.1 Replace local linked dependencies

The plugin repository currently declares:

```json
"@classroomio/plugin-sdk": "link:../classroomio/packages/plugin-sdk"
```

This cannot work for external contributors, forks, or standalone CI. Replace every local `link:`, `file:`, and `portal:` dependency used by a releasable plugin with a published and pinned public package version.

Examples:

```json
{
  "devDependencies": {
    "@classroomio/plugin-sdk": "^1.0.0"
  }
}
```

Do the same for all public design, certificate, and shared plugin packages. Do not let a production plugin import `@cio/*`, `$lib/*`, `$app/*`, or repository-relative ClassroomIO application source.

Commit the plugin repository lockfile and require `pnpm install --frozen-lockfile` in CI.

### 1.2 Normalize commands

The plugin repository currently advertises unsupported commands such as `cio-plugin verify`, `cio-plugin validate`, `cio-plugin digest`, `cio-plugin seed`, and `--auto-install`. Remove them rather than retaining compatibility aliases.

The root `classroomio-plugins/package.json` should expose only commands that exist and have one meaning:

```json
{
  "scripts": {
    "build": "pnpm -r --filter=!classroomio-plugins run build",
    "check": "pnpm -r --if-present --filter=!classroomio-plugins run check",
    "test": "pnpm -r --if-present --filter=!classroomio-plugins run test",
    "pack": "cio-plugin build --registry registry/plugins.json",
    "seed": "cio-plugin dev",
    "release:verify": "node scripts/verify-release.mjs"
  }
}
```

`npm run dev` and `npm run build` inside an individual UI plugin remain normal Vite commands. `pnpm pack` at repository root creates canonical release artifacts. `pnpm seed -- --org <organization-id>` installs one local development release only.

The exact `--registry` flag may be implemented in the SDK CLI or the root script may enumerate registry entries. Prefer adding an explicit registry-aware option to the CLI so release selection is deterministic and shared by local and CI workflows.

### 1.3 Make package output deterministic

The canonical packager must:

- Build each enabled plugin into `dist/` from a clean checkout.
- Package `plugin.json`, compiled runtime assets, declared icons, and `inventory.json`.
- Exclude `src/`, tests, editor files, `.env*`, `node_modules`, lockfile copies, and source maps unless source maps are explicitly approved.
- Sort archive entries deterministically.
- Use a stable archive timestamp.
- Calculate `sha256-<hex>` over the final archive bytes.
- Emit `release-index.json` containing plugin ID, version, digest, artifact path, archive path, and manifest summary.

The release workflow must reproduce the package from a clean checkout. It must not trust an archive or digest committed in a pull request.

## Phase 2: add plugin-repository contribution governance

Move or recreate the following controls inside `classroomio-plugins`:

- `.github/CODEOWNERS`
- `.github/PULL_REQUEST_TEMPLATE.md`
- Contributor License Agreement workflow
- Semantic pull-request title workflow
- Required labels or checks for first-time contributors
- Repository branch protection configuration

Suggested `CODEOWNERS` policy:

```text
/.github/workflows/                  @classroomio/platform-maintainers
/package.json                        @classroomio/platform-maintainers
/pnpm-lock.yaml                      @classroomio/platform-maintainers
/registry/                           @classroomio/plugin-reviewers
/announcement-banner/                @classroomio/plugin-maintainers
/certificate-studio/                 @classroomio/plugin-maintainers
/com.classroomio.*/                  @classroomio/plugin-maintainers
```

Use actual GitHub teams or usernames that exist in the plugin repository. A path named with a glob should not replace explicit owners for existing plugin directories.

The plugin PR template must ask for:

- New plugin or existing plugin update
- Plugin ID and version
- Changed permissions and why they are necessary
- Changed `networkAccess.allowedDomains`
- Changed data policy and retention behavior
- Changed host surfaces or actions
- Screenshots or a short demo video for UI behavior
- Test instructions
- Release/rollback impact
- Confirmation that an already-published version was not changed
- CLA confirmation for external contributors

Protect `main` with:

- No direct pushes
- No force pushes
- Required PR review
- Required CODEOWNERS review
- Required PR validation workflow
- Required CLA check for external contributors
- Required conversation resolution
- Restricted changes to workflows and registry metadata

## Phase 3: add untrusted pull-request CI

Create this workflow in the plugin repository:

```text
classroomio-plugins/.github/workflows/plugin-pr.yml
```

Trigger it with `pull_request`, never `pull_request_target`, for any workflow that checks out or executes pull-request code.

Required permissions:

```yaml
permissions:
  contents: read
```

The workflow may use the default read-only `GITHUB_TOKEN`. It must not expose secrets, protected environment variables, cloud credentials, deployment keys, or persistent caches to fork PRs.

Required steps:

1. Check out the pull-request commit.
2. Install the pinned pnpm and Node versions.
3. Run `pnpm install --frozen-lockfile`.
4. Validate `registry/plugins.json`.
5. Build every changed releaseable plugin, or all enabled plugins for the initial implementation.
6. Run each plugin’s `check` and `test` script where present.
7. Run `pnpm pack` to build canonical artifacts.
8. Run `pnpm release:verify`.
9. Run the plugin isolation check against compiled output and source imports.
10. Build twice in clean output directories and fail if the release digest changes.
11. Upload `.plugin-artifacts/` as a short-retention GitHub Actions artifact for reviewer inspection only.

`release:verify` must verify:

- Registry consistency and unique IDs
- SemVer version format
- No duplicate published candidate versions in the pull request
- Manifest schema validity
- Entrypoint and icon resources exist in the package
- Archive paths are safe and unique
- No symlinks or hardlinks
- No forbidden imports or host-private dependencies
- Package/extracted size and file-count limits
- `networkAccess` is a valid origin allowlist
- Plugin dependencies are public, pinned, and not local links
- No secrets, `.env` files, or private keys are packaged
- Every changed releaseable plugin has tests/checks appropriate to its runtime

Do not upload artifacts to R2 from this workflow. GitHub Actions artifacts are acceptable because they are not installable production releases and expire automatically.

The existing core-repository workflow at [plugin-isolation-check.yml](../../.github/workflows/plugin-isolation-check.yml) checks out `classroomio-plugins` from the application repository. It triggers when the application repository changes, not when plugin PRs change. Replace that pattern with the plugin-repository PR workflow above. Keep only a small core-repository compatibility check if needed when SDK/public API packages change.

## Phase 4: add the trusted release workflow

Create this workflow in the plugin repository:

```text
classroomio-plugins/.github/workflows/release-plugins.yml
```

Trigger it after merge to protected `main`. For the initial version, release only plugins whose source or registry entry changed in the merged commit and whose version is new. A documentation-only merge must do nothing.

Use a protected GitHub Environment named `plugin-production`. Require a maintainer approval before credentials are exposed.

Required release steps:

1. Check out the exact protected merge commit.
2. Install dependencies from the committed lockfile.
3. Run the same build, check, test, pack, and release verification steps as PR CI.
4. Generate a release request from the trusted `release-index.json`.
5. Confirm every candidate version is new in the ClassroomIO catalog.
6. Upload the archive and extracted assets to immutable production R2 keys.
7. Call the internal ClassroomIO release-registration endpoint.
8. Persist provenance and emit a release summary.
9. Create a GitHub release or attach a build attestation containing the digest and commit SHA.

The workflow must run only from the protected repository and protected branch. It must not be runnable against arbitrary PR refs with production credentials.

Use a release-constrained R2 credential that can write only the configured production plugin prefix. Do not use an account-wide Cloudflare token.

The production key layout remains:

```text
{pluginId}/{version}/{artifactDigest}/{assetPath}
{pluginId}/{version}/{artifactDigest}/package.tar.gz
```

The key is immutable. A second upload to an existing key must either be rejected or byte-compared and accepted only if it is identical.

## Phase 5: add an internal release-registration API

Do not let GitHub Actions connect directly to the production database. Add an internal API route, composed under the existing `internal` router, for trusted CI only.

Suggested route:

```text
POST /internal/plugin-releases
```

Suggested request body:

```json
{
  "sourceCommit": "40-character-git-sha",
  "workflowRunUrl": "https://github.com/classroomio/classroomio-plugins/actions/runs/123",
  "releases": [
    {
      "pluginId": "com.example.reading-timer",
      "version": "1.2.0",
      "artifactDigest": "sha256-...",
      "artifactKeyPrefix": "com.example.reading-timer/1.2.0/sha256-..."
    }
  ]
}
```

Authentication requirements:

- Do not use `PRIVATE_SERVER_KEY` as a plugin developer credential.
- Do not use `plugin:publish`.
- Use a dedicated `PLUGIN_RELEASE_DEPLOY_TOKEN` for the initial CI integration, stored only in the protected GitHub Environment and API host environment.
- Scope it exclusively to this internal release-registration endpoint.
- Rotate it independently from other server credentials.
- Prefer GitHub OIDC verification in a later hardening phase if the production identity provider supports it.

The API service must:

1. Authenticate the release identity.
2. Validate the request schema.
3. Reject duplicate plugin IDs in one request.
4. Confirm each R2 archive exists at the expected immutable key.
5. Read the archive from production storage.
6. Recompute the digest and parse the archive.
7. Validate archive safety, manifest schema, paths, resources, forbidden imports, sizes, and file counts.
8. Confirm the archive manifest ID/version exactly match the request.
9. Enforce namespace and registry policy supplied by CI or a server-side approved-plugin policy.
10. In one database transaction, upsert the plugin metadata and create the new immutable version record.
11. Fail if the `(pluginId, version)` exists with a different digest.
12. Be idempotent if the same version and digest are registered again after a recoverable CI failure.
13. Write release provenance.

Artifact upload occurs before registration. If registration fails, the artifact remains unreachable because no approved catalog version references it. Add a scheduled cleanup policy for old unregistered production-prefix artifacts after an appropriate retention period.

Refactor reusable archive parsing and validation out of the old submission service into a neutral module, for example:

```text
apps/api/src/services/plugin/release-validation.ts
```

The release route and local development route may use this validator. Do not retain the submission state machine merely because its archive parser is useful.

## Phase 6: update the database model

The existing `plugin_version` table already has `artifactDigest`, `signature`, review status, and publication timestamps. Extend it with immutable release provenance:

```text
source_commit        varchar(40), not null for CI releases
release_run_url      text, not null for CI releases
released_by          enum or text identity, e.g. `github-actions`
release_metadata     jsonb, optional for build/SDK versions and attestations
```

Use meaningful column names consistent with the existing schema conventions. The release record must be sufficient to answer:

```text
Which source commit created this catalog version?
Which workflow created it?
Which digest and archive key were approved?
```

The old public-submission model can then be removed:

- `plugin_submission` table
- `plugin_submission_status` enum
- `plugin_release_lane` enum, if no other feature uses it
- submission-specific indexes and query functions
- submission-specific test fixtures

Before deleting the table, inspect deployed environments for rows. If the feature has never been used, one migration can drop it. If rows exist, export/archive them or add a migration that preserves audit history elsewhere.

Create one migration file for all schema changes in this PR/branch. Follow the repository migration journal rules: use an index after main’s current maximum and a `when` timestamp later than main’s maximum.

## Phase 7: remove the quarantine submission system

After the internal release route and trusted release workflow are verified, remove all public publishing components in one coordinated change.

### API routes and services to remove

- `apps/api/src/routes/plugins/submissions.ts`
- `apps/api/src/services/plugin/submission.ts`, after extracting shared archive validation
- `apps/api/src/middlewares/plugin-publisher-auth.ts`, unless another feature genuinely uses it
- Submission route mount from `apps/api/src/routes/plugins/index.ts`
- Reviewer preview URL and reviewer queue logic
- Submission-specific API tests

### Permissions and environment values to remove

- `plugin:publish` automation-key scope
- Publisher-token UI or validation related only to publishing
- `CLASSROOMIO_PLUGIN_TOKEN` as a publishing credential
- `PLUGIN_QUARANTINE_BUCKET`
- `PLUGIN_REVIEW_ORIGIN`
- Presigned plugin-upload helpers used only by the old flow

Keep these values:

- `PLUGIN_ASSET_BUCKET`
- `PLUGIN_ASSET_ORIGIN`
- `PLUGIN_ARTIFACTS_PATH` for local development only
- `PLUGIN_API_TOKEN_SECRET` if the plugin backend-access-token system still uses it

Update [apps/api/.env.example](../../apps/api/.env.example) and [packages/core/src/config/env.ts](../../packages/core/src/config/env.ts) in the same change.

## Phase 8: retain a narrow local development flow

The development endpoint is still useful, but it is not a public release mechanism.

Keep:

```text
POST /plugins/development/releases
```

Change its authorization away from `plugin:publish`. Introduce a narrow local-only development permission, for example `plugin:development`, or use a dedicated local developer credential contract. The final choice must satisfy these rules:

- The endpoint returns 404 or rejects requests in production.
- The caller must be an admin of the target organization.
- The token may install only into its own organization.
- It may write only to `PLUGIN_ARTIFACTS_PATH`.
- It may create only `development` or `private` records, never public catalog versions.
- It may not call production R2 or the internal release-registration route.

Document the local command as:

```bash
export CLASSROOMIO_API_URL=http://localhost:3002
export CLASSROOMIO_DEV_TOKEN=<organization-development-token>
export CLASSROOMIO_ORG_ID=<organization-id>
npm run seed
```

If retaining `CLASSROOMIO_PLUGIN_TOKEN` temporarily for local compatibility, document that it is development-only and schedule a rename to `CLASSROOMIO_DEV_TOKEN`. Do not leave a name that implies production publishing once publishing no longer exists.

## Phase 9: tighten production and local asset serving

Production remains CDN-only. The application API must not serve artifact files in production; it should resolve digest-qualified URLs through `PLUGIN_ASSET_ORIGIN`.

For local development, simplify [assets.ts](../../apps/api/src/routes/plugins/assets.ts): remove fallback searches relative to `process.cwd()` and serve only from explicit `PLUGIN_ARTIFACTS_PATH`. This prevents accidental serving of source or stale build output from a neighboring checkout.

Keep the existing protections:

- Version record must be approved or explicitly allowed development state.
- Requested digest must match the database record.
- Asset path cannot traverse outside the resolved artifact directory.
- MIME types, `nosniff`, CSP, and immutable cache headers are set correctly.

## Phase 10: documentation migration

Replace “Packaging and publishing” documentation with “Packaging and contributing.” The developer journey becomes:

```text
1. Scaffold a plugin.
2. Run Vite locally with npm run dev.
3. Build and package locally with npm run build and npm run pack.
4. Install into a local organization with npm run seed.
5. Fork classroomio-plugins.
6. Add or update a plugin, registry entry, tests, and documentation.
7. Open a pull request.
8. Address CI and review feedback.
9. After merge, ClassroomIO release CI publishes the approved version.
```

Remove all documentation of:

- `npm run publish`
- `npm run status`
- `cio-plugin publish`
- `cio-plugin status`
- publisher tokens and `plugin:publish`
- production `CLASSROOMIO_API_URL` for contributors
- quarantine buckets, presigned URLs, reviewer CDN, submissions, and review dashboard

Add two separate maintainer documents:

1. Release runbook: protected environment approval, release logs, artifact verification, and rollback.
2. Security review guide: permissions, network access, data policy, dependency changes, host API usage, source integrity, and release provenance.

Update the historical research document to mark the old quarantine recommendation as superseded. Do not leave contradictory documentation in the repository.

## Phase 11: test plan

### Unit tests

- Registry parser rejects duplicate IDs, invalid paths, and unreleaseable entries.
- Release validator rejects malformed archive, digest mismatch, unsafe paths, symlinks, duplicate paths, forbidden host imports, missing resources, oversized archives, and unsupported dependencies.
- Internal release API rejects invalid credentials and malformed request payloads.
- Internal release API rejects a missing R2 archive.
- Internal release API rejects manifest/request ID or version mismatch.
- Internal release API rejects a duplicate version with a different digest.
- Internal release API accepts idempotent replay of the same version/digest.
- Local development endpoint cannot create a public release.
- Asset route rejects unknown or mismatched digest.

### Workflow tests

- Fork PR can build and package but has no access to deployment secrets.
- Internal PR can build and package but still cannot deploy.
- Protected main release can upload and register a test plugin in staging.
- A failed registration leaves no catalog-visible version.
- A retry after an interrupted upload/register succeeds idempotently.
- An attempt to change code without bumping a released version fails.
- An attempt to release `plugin-conformance` fails or is ignored by registry policy.
- Rollback disables a bad version and restores the previously selected release.

### End-to-end staging test

Use one low-risk first-party plugin:

1. Create a version-bump PR.
2. Confirm untrusted CI produces reviewer artifacts only.
3. Approve and merge.
4. Approve the protected staging release environment.
5. Confirm R2 assets exist only under the expected digest-qualified prefix.
6. Confirm the API records the source commit, workflow URL, version, and digest.
7. Confirm the catalog exposes the new version.
8. Install it into a staging organization.
9. Confirm the iframe loads only production CDN assets.
10. Exercise rollback.

## Phase 12: cutover sequence

Implement in this order:

1. Publish public SDK/design dependency versions and remove all local links in the plugin repository.
2. Add registry and update root plugin repository commands.
3. Implement registry-aware packing and release verification.
4. Add plugin-repository untrusted PR CI and governance controls.
5. Add the trusted release workflow, protected environment, and staging credentials.
6. Add the internal release-registration route, provenance columns, query functions, service, and tests.
7. Test the full workflow in staging with one first-party plugin.
8. Update docs, local developer credentials, and SDK CLI to remove public publishing.
9. Remove quarantine API routes, service, permissions, environment values, submission schema, tests, and docs.
10. Deploy the API/database migration and release workflow together.
11. Run a production release and a rollback drill before announcing third-party contribution support.

Do not remove the old submission system before the replacement has completed the staging end-to-end test. Do not run the old and new public publication paths in parallel; two release authorities create provenance ambiguity.

## Definition of done

The PR-first model is complete when:

- A third-party contributor can fork the plugin repository, add a plugin, and open a PR without any ClassroomIO production credential.
- Maintainers can inspect source, compiled GitHub artifact, permissions, network access, and tests before merge.
- CI rejects unsafe, malformed, nondeterministic, or incompatible releases before merge.
- A merge to protected `main` is the only event that can produce a production artifact.
- The production artifact digest is generated by trusted CI and linked to a commit and workflow URL in the database.
- The API exposes only catalog versions backed by registered immutable artifacts.
- Local seed remains available but cannot publish publicly.
- No contributor-facing publish command, submission endpoint, quarantine bucket, reviewer preview, reviewer queue, or `plugin:publish` scope remains.
- Documentation describes pull-request contribution as the only public publication path.
