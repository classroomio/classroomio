# Plugin Platform Reduction and Security Audit

**Audited branch:** `feat/plugin-platform-v2`  
**Comparison base:** `origin/main` (`2eb6f2df`)  
**Audit date:** 2026-10-26  
**Decision:** reduce this branch in place on `feat/plugin-platform-v2` across 6 reviewable commits; keep the PR in draft until the reduced diff passes all merge gates.

## 1. Purpose and decision

The intended architecture is source-first and PR-first:

1. A contributor opens a source-code PR in `classroomio-plugins`.
2. Reviewers inspect source and protected CI validates, builds, packs, and scans it.
3. After merge, trusted release CI uploads an immutable digest-addressed artifact to object storage.
4. Trusted release CI registers that exact artifact with ClassroomIO's internal release endpoint.
5. Organizations install catalogued releases; the dashboard renders only approved, active contributions.

This branch implements part of that path, but also adds a large public plugin API, remote backend credential flow, outbound event delivery system, certificate-template product slice, broad dashboard UI, SDK server client, and several packages. Those systems are not required to make the PR-first release path work, and the added surface contains confirmed authorization defects.

The right fix is **reduction first, then hardening of the retained boundary**. Reduce the active PR on `feat/plugin-platform-v2` in place using 6 sequential, reviewable commits while keeping the PR in draft until all merge gates pass.

## 2. Audit scope and size

`origin/main...feat/plugin-platform-v2` contains **223 changed files** (+31,908 / -794 at audit time), including:

| Area | Changed files | Assessment |
| --- | ---: | --- |
| API plugin routes and services | 77 API source files, including 11 Plugin API route files and 20 plugin-service files | Too broad for the release MVP; contains confirmed authorization issues. |
| Dashboard plugin feature | 41 dashboard files, including 15 plugin-feature files | Keep only the catalog/install/contribution path that is actually needed. |
| Plugin SDK | 19 files | Split the CLI/client bridge from the server SDK and unpublished capabilities. |
| Certificate kit | 17 files | Separate product work; it is not release-pipeline infrastructure. |
| Plugin design package | 5 files | Optional public dependency; retain only if the official plugin repository consumes the published package. |
| Developer docs | 7 plugin MDX documents plus PRD material | Reduce to the supported MVP and remove references to unavailable APIs. |
| Tests and fixtures | 35 changed test or fixture files | Delete tests with deleted code; retain a compact security/release regression suite. |

The branch already removed the old public quarantine/upload route concept. That is correct. No contributor-facing publish token, submission endpoint, reviewer CDN, quarantine bucket, or `plugin:publish` scope should be reintroduced.

## 3. Greptile findings: validation and disposition

Severity is assessed against the current branch, not against a future expanded marketplace.

| # | Finding | Verdict | Evidence | Required disposition |
| ---: | --- | --- | --- | --- |
| 1 | Slot tokens are rejected | **Confirmed P1** | `apps/api/src/services/plugin/access-token.ts:25` restricts `contributionTarget` claims to `['plugin.page', 'certificate.templates']`, while `apps/api/src/services/plugin/launch.ts:42` issues codes for slots (`lesson.after`, `lms.banner`). Token exchange via `/plugins/launch/exchange` rejects slot claims. | If slot backend access remains, use one shared contribution-target validator. If the broad backend API is removed for MVP, remove slot-token issuance entirely. |
| 2 | Template saves report failure | **Confirmed P1** | `apps/api/src/routes/plugin-api/v1/courses.ts:407` calls `.strict()` `ZPluginApiApplyCertificateTemplateResult.parse(result)`. Because `applyCertificateTemplate` in `services/plugin/templates.ts:167` returns an extra top-level `success` field, parsing fails with a 500 error after the course database record has already mutated. | Remove the unsupported certificate-template slice, or return one normalized response shape before the mutation result is parsed. Never parse a post-write result with a schema that rejects its actual shape. |
| 3 | Plugins bypass lesson locks | **Confirmed P1 🛡️** | `apps/api/src/services/plugin/content.ts:244` and `packages/db/src/queries/lesson/lesson.ts:276-304` (`getPluginLessonContent`) check only course membership and `lesson.public`, ignoring `lesson.isUnlocked`. A learner with a valid plugin token can read locked lessons and exams that the learner UI restricts. | Do not expose lesson content in the MVP. If retained, call the same learner access assertion before returning body or attachments, with a regression test for a locked lesson. |
| 4 | Development releases cross organizations | **Confirmed P1 🛡️** | `apps/api/src/services/plugin/development.ts:85-87` finds globally keyed `(pluginId, version)` rows and calls `updatePluginVersionArtifact()` without first checking `existingVersion.releaseMetadata.organizationId === options.organizationId`. Organization B can overwrite Organization A's development artifact. | Make development release ownership an invariant before extraction or update; key dev releases by organization or require a unique development plugin ID per organization. Use a transaction and reject cross-org replacement. |
| 5 | Rejected plugins receive events | **Confirmed P1 🛡️** | `apps/api/src/services/plugin/events.ts:144-151` checks only `subscription.status === 'active'` and `installation.status === 'active'`. It never verifies `installation.orgApprovalStatus === 'approved'` or `plugin.status === 'published'`, delivering webhooks to unapproved or revoked plugins. | Remove outbound plugin events from MVP. If retained, require active **and approved** at registration, selection, delivery, replay, and retry; disable subscriptions when approval is revoked. |
| 6 | Revoked plugins keep access | **Confirmed P1 🛡️** | `apps/api/src/services/plugin/authorization.ts:48-60` (`authorizePluginRequest`) loads only the installation and grants. It never joins or inspects `plugin.status === 'revoked'` or `version.reviewStatus`. Existing installations stay active and functional even after platform-level revocation. | Make one authorization query enforce installation active, org approval approved, plugin not revoked, and approved version. Revoke backend credentials and stop rendering/contributions when a plugin is revoked. |
| 7 | Cleanup breaks server rendering | **Confirmed P1** | `apps/dashboard/src/lib/features/plugins/components/plugin-host-frame.svelte:201` calls `window.removeEventListener('beforeunload', handleBeforeUnload)` inside `onDestroy()`. In SvelteKit, `onDestroy` executes during SSR lifecycle teardown; unguarded `window` access throws `ReferenceError: window is not defined`. | Guard teardown with `if (typeof window !== 'undefined')`, or ensure browser-bound bridge components are mounted purely on the client. |
| 8 | Production frames are blocked | **Confirmed P1** | `apps/dashboard/src/lib/utils/csp.ts:40` constructs `frameSrc` from `serverUrl` and generic external env vars. It never incorporates `PLUGIN_ASSET_ORIGIN` / `PUBLIC_PLUGIN_ASSET_ORIGIN`. Browser CSP blocks plugin iframes when assets are served from the production CDN/R2 domain. | Establish a synchronized deployment contract: inject the validated plugin asset origin into dashboard `frame-src` and fail deployment validation if absent. Do not use a wildcard. |
| 9 | Downloads lose certificate settings | **Deferred Feature Flaw** | `apps/api/src/services/course/certificate.ts:25` (`assembleCertificateRender`) calls `resolveCertificateDesign(courseRow.certificate)`. `packages/certificates/src/render.ts:34-65` coerces the design back to `DEFAULT_CERTIFICATE_DESIGN`, dropping rich V1 custom template layout, typography, and styling properties. | Remove certificate work from this PR; reintroduce it in a separate future PR with an independent data-round-trip test. |
| 10 | Failed changes show success | **Confirmed P1** | `apps/dashboard/src/lib/features/plugins/components/plugin-popover.svelte:138-145,166-174` wraps `pluginsApi.install()` and `pluginsApi.updateStatus()` in `try / catch`. `BaseApiWithErrors.execute()` catches HTTP failures internally and returns `null` without throwing, so failed mutations bypass `catch` and display `snackbar.success()`. | Check `response !== null` or `pluginsApi.errors` before displaying success toasts, or configure API methods to throw on failure. |
| 11 | Certificate package fails to load | **Deferred Feature Flaw** | `packages/certificates/package.json:20` introduces a workspace dependency on `@classroomio/certificate-kit`, tightly coupling core certificate rendering to an unreleased package and creating build/packaging risks. | Remove certificate-kit from this PR. Validate its package build and consumer builds in a future dedicated PR. |
| 12 | SDK requires a private package | **Confirmed Readiness Gap** | The scaffold emits `@classroomio/plugin-sdk`; the PR-first plan requires releasable plugins to resolve dependencies from a public package registry. The package is workspace-only until it is published. Note: `@cio/tsconfig` is in `devDependencies` (ensure it remains strictly in `devDependencies` and not in `dependencies`). | Publish/version `@classroomio/plugin-sdk` before allowing external plugin PRs, pin it in scaffolds, and run the isolation check against a packed/published dependency. Ensure `@cio/tsconfig` is in `devDependencies`. Do not use `workspace:`, `link:`, `file:`, or `portal:` in releasable plugins. |
| 13 | Disabled deliveries clog batches | **Confirmed P1** | `apps/api/src/services/plugin/events.ts:144-151,253-264`: when a subscription or installation is inactive, `deliverEvent()` returns without updating delivery status. The delivery remains `pending`, causing `fetchPendingDeliveries(20)` to retrieve the exact same unprocessable batch on every loop iteration. | Remove events from MVP. If retained, atomically cancel pending deliveries when disabled/unapproved/uninstalled, and make workers select only deliverable rows. |
| 14 | Removed subscriptions stay active | **Confirmed P1** | `apps/api/src/services/plugin/installation.ts:225-233` iterates through new manifest subscriptions on reinstall/upgrade and adds them, but never compares against or deactivates existing subscriptions that were removed in the new manifest version. | Remove events from MVP. If retained, reconcile subscriptions transactionally against the new manifest and disable/delete removed entries. |
| 15 | Frames keep old plugin context | **Confirmed P1** | `apps/dashboard/src/lib/features/plugins/components/plugin-host-frame.svelte:86-103` initializes `bridgeHost` context once in `onMount`. Client-side route changes or prop updates never update the bridge context. Also, `plugin-slot-renderer.svelte:22-30` gates fetching on `listedOrgId` and ignores target/resource updates. | Key fetches and frames by `(installationId, version, target, resourceId)`, and update bridge context reactively on prop changes. |
| 16 | CLI accepts rejected manifests | **Confirmed P2** | `packages/plugin-sdk/bin/cio-plugin.mjs:15-45` allows all 30 capability scopes in `ALLOWED_CAPABILITIES`, whereas host validation in `packages/utils/src/validation/plugin/scopes.ts:263-276` permits only the 11 active scopes. Manifests packaging `planned` scopes pass CLI validation but fail host registration. | Import or synchronize active capability scopes from one source of truth. For MVP, expose only the retained active scopes. |
| 17 | Authentication guide uses a missing route | **Confirmed P2** | `apps/docs/content/docs/developers/plugins/server-sdk.mdx:55` instructs developers to call `POST /plugin-api/v1/auth/token`. The implemented route is `POST /plugins/launch/exchange` in `apps/api/src/routes/plugins/launch.ts`. | Remove the server SDK/auth guide with the deferred backend API, or document exactly the supported launch-code exchange. |
| 18 | Browser template apply is unavailable | **Confirmed P2** | `packages/plugin-sdk/src/client/client.ts:308` exposes `certificateTemplates.apply()`. `packages/plugin-sdk/src/host/bridge-host.ts:236` routes this to `onApplyCertificateTemplate`, but `plugin-host-frame.svelte` supplies no handler, returning `NOT_SUPPORTED`. | Remove the browser method now. If certificate operations return later, use a server-side API or supply and authorize a complete host handler. |
| 19 | Plugin text stays in English | **Confirmed P2** | `apps/dashboard/src/lib/utils/translations/da.json:6440` (and `de.json`, `es.json`, etc.) has untranslated English strings committed directly into non-English locale files. | Prune UI copy for deferred features, then run `pnpm translate` from `apps/dashboard` and verify placeholders. |
| 20 | Objects contain chained calculations | **Confirmed Convention** | `apps/api/src/services/plugin/access-token.ts:95-97` performs inline token signing and ISO formatting inside return object literals, violating repo coding style (`AGENTS.md`). | Assign values to well-named locals before constructing the object literal. |

## 4. Additional confirmed security findings

### A. Plugin API authorization is fail-open for unclassified routes

In `apps/api/src/middlewares/plugin-api-authorization.ts:84-92`, `pluginApiAuthorizationMiddleware` calls `next()` when `routePolicy(c.req.method, c.req.path)` returns `null`. Token authentication has already verified the token signature and claims (`c.get('pluginApiClaims')`), but missing or regex-mismatched route policies allow calls to pass straight through without enforcing scope, role, resource, or surface checks.

**Fix:** make authorization fail closed after token authentication: every Plugin API endpoint must declare a typed policy, and route registration must consume that policy. If `!policy`, throw `new AppError('Route is unclassified or unauthorized', 'FORBIDDEN', 403)`.

### B. Revocation is not a single authoritative gate

In `apps/api/src/services/plugin/authorization.ts:48-60` (`authorizePluginRequest`), installation status and organization approval are checked, but `plugin.status` and `version.reviewStatus` are not loaded. Similar inconsistencies exist across launch (`launch.ts`), event delivery (`events.ts`), contributions, and storage.

**Fix:** centralize a `getRuntimeAuthorizedInstallation` query/service that joins installation, plugin, version, and grants. Its invariant is: organization-owned, active, approved, non-revoked plugin, approved version, and current actor membership. All runtime paths use it.

### C. Remote backends can create an SSRF-capable outbound delivery path

In `apps/api/src/services/plugin/events.ts:177`, manifest-configured `endpoint` URLs (`${runtime.backend.baseUrl}${webhookPath}`) receive automated `POST` requests. While manifests require HTTPS, an HTTPS public-looking hostname can resolve to private, loopback, link-local (e.g. AWS/GCP metadata `169.254.169.254`), or container IP ranges.

**Fix:** defer events. If retained, validate URL shape at registration and resolve/pin outbound DNS at delivery using the existing platform webhook URL guard; deny private, loopback, link-local, multicast, and rebinding targets. Limit redirects to zero and enforce a short timeout in a `finally` block.

### D. Internal release registration has insufficient provenance binding

In `apps/api/src/routes/internal/plugin-releases.ts:17-33`, the internal release route trusts a shared `PLUGIN_RELEASE_DEPLOY_TOKEN`. Any holder can register a valid archive and arbitrary `sourceCommit` / `workflowRunUrl`; those fields are not attested.

**Fix:** use GitHub Actions OIDC or a short-lived, audience-bound credential for the protected release workflow; verify repository (`classroomio/classroomio-plugins`), workflow, ref (`refs/heads/main`), commit SHA, and environment claims. Require the artifact key/digest to be produced by that run, reject replayed registration IDs, and rate-limit/audit denied attempts. Until then, keep the endpoint private and the token in a protected environment with least privilege.

### E. Development release mutation is non-atomic

In `apps/api/src/services/plugin/development.ts:85-106`, archive extraction to `.plugin-artifacts/` occurs before the database row is created/updated, and the subsequent installation can fail. Combined with cross-organization mutation, this leaves durable files and mutable rows in inconsistent states.

**Fix:** authorize ownership first, validate to a temporary directory, commit DB changes in a transaction, atomically promote the artifact directory, and compensate/clean up on failure. Treat development data as local-only and never serve it in production.

### F. Artifact path construction needs one validated source

In `apps/api/src/routes/plugins/assets.ts:79` and launch resolvers, some paths are guarded, but contribution entrypoint URL construction uses hand-rolled `dist/` normalization rather than the manifest's shared safe-relative-path parser.

**Fix:** store parsed manifests and use the shared entrypoint resolver in release registration/contribution resolution. Reject invalid resource paths before they are persisted; never concatenate an unvalidated path into an artifact URL.

### G. Release workflow policy is incomplete in this repository

This repository has `.github/workflows/plugin-isolation-check.yml`, but no trusted, post-merge release workflow that builds artifacts, uploads them to the immutable bucket, and calls the internal registration endpoint. The user-facing plugin repository needs that workflow, but this PR must still specify and enforce the trusted registration boundary.

**Fix:** define the release workflow in `classroomio-plugins`, trigger only on protected `main`, use a protected production environment, build from checkout rather than PR artifact uploads, run package/dependency/isolation checks, upload with conditional create semantics, then register via workload identity.

## 5. Reduction plan: retain, defer, remove

### Retain for the first production release

Keep only the components that directly implement the source-first release model:

- shared manifest schema limited to currently supported UI contributions and active scopes;
- archive/digest validation shared by trusted registration and local development seeding;
- local-only development release/seed endpoint with organization ownership isolation;
- internal trusted release registration endpoint, immutable artifact key convention, catalog records, and install state;
- asset URL generation plus explicit dashboard CSP deployment validation;
- a minimal dashboard catalog/install/manage view and contribution resolver;
- CLI `create`, `validate`, `build`/`pack`, and local `dev`/`seed` only;
- Client SDK bridge only for capabilities actually supplied by `PluginHostFrame` (for example resize, theme, toast, host-relative navigation, and declared storage if retained).

### Defer and remove from this PR

| Slice | Why it should leave this PR | What replaces it now |
| --- | --- | --- |
| Broad Plugin API v1: courses, lessons, exercise metadata, progress, certificates, identity, organization and storage | It multiplies sensitive data access and requires a mature capability model, resource binding, revocation, audit, and learner-access parity. Several defects are already confirmed. | No server API in MVP; add individual vertical slices later with their own threat model. |
| Server SDK and backend launch-code/credential flow | It exists chiefly to serve the broad API and has mismatched target claims/documentation. | Publish only the client SDK/CLI needed by UI plugins. Reintroduce a server SDK when the first backend use case is approved. |
| Plugin event subscriptions, outbox, delivery worker, webhook secrets, delivery UI/routes/tables | Unneeded for PR-first artifact publishing and currently has approval, cancellation, reconciliation, and SSRF defects. | Defer until outbound delivery uses the platform's hardened webhook URL guard and a dedicated threat model. |
| Browser certificate-template bridge method and certificate Plugin API routes | Advertised functionality is not wired end-to-end. | Remove it. A future certificate integration should be a separate, server-authorized feature. |
| `packages/certificate-kit` and changes that make core certificate rendering depend on it | This is certificate product work, not plugin-release infrastructure; it adds package publication and runtime coupling. | Remove from this PR; reintroduce in a future dedicated certificate PR with consumer build verification. |
| `packages/plugin-design` | It is optional ergonomics, not a platform trust boundary. | Keep only if a public release of it is genuinely required by official plugin source; otherwise defer. |
| Broad planned-scope catalogue and speculative public API PRD | It implies support that the host does not safely provide. | Document only supported v1 capabilities and move proposals to a future roadmap. |
| Dashboard reviewer/publisher/quarantine concepts | They contradict the source-first PR review model. | Remove entirely; source review happens in GitHub and production registration happens in trusted CI. |

## 6. Implementation sequence: Single-PR Sequential Commit Model

Given that PR #1402 is already active on `feat/plugin-platform-v2`, we keep this as **one PR on `feat/plugin-platform-v2`** and execute the reduction through a sequence of 6 focused, atomic, and reviewable commits. The PR remains in Draft until all 6 steps are complete, the diff is reduced to the lean PR-first core, and all merge gates pass.

### Sequential Commit Roadmap:

1. `refactor(plugins): remove deferred platform subsystems`
   - Remove broad Plugin API v1 (`apps/api/src/routes/plugin-api/`), server SDK (`packages/plugin-sdk/src/server/`), event outbox & webhooks (`apps/api/src/services/plugin/events.ts`), credentials, storage, certificate-kit (`packages/certificate-kit/`), and plugin-design package (`packages/plugin-design/`).
   - Remove their respective docs and tests.

2. `refactor(db): reduce plugin platform schema`
   - Fold removed tables into the existing branch migration `0039_plugin_platform_complete.sql` (keeping timestamp `1792575299000` > `main`).
   - Update `packages/db/src/schema.ts`, relations, types, query exports, and route registration together.
   - Retain only core catalog and install models: `plugin`, `pluginVersion`, `pluginInstallation`, `pluginGrant`, `pluginPublisher`, and `pluginAuditEvent`.

3. `fix(plugins): harden release and local development flows`
   - Development tenant isolation and atomicity in `apps/api/src/services/plugin/development.ts`.
   - Runtime revocation and approval enforcement in `apps/api/src/services/plugin/authorization.ts`.
   - Release registration provenance boundary in `apps/api/src/routes/internal/plugin-releases.ts`.
   - CDN/CSP synchronization in `apps/dashboard/src/lib/utils/csp.ts` and SSR teardown window guard in `apps/dashboard/src/lib/features/plugins/components/plugin-host-frame.svelte`.
   - UI popover error handling in `plugin-popover.svelte`.

4. `fix(plugin-sdk): align supported CLI and bridge contract`
   - Keep only supported CLI commands (`create`, `build`, `pack`, `seed`, `validate`) and bridge methods (resize, theme, toast, navigate).
   - Synchronize CLI manifest capability validation in `bin/cio-plugin.mjs` to match host validation in `@cio/utils`.
   - Ensure `@cio/tsconfig` remains strictly in `devDependencies`.

5. `docs(plugins): document the supported PR-first workflow`
   - Delete unsupported server/API and storage docs (`server-sdk.mdx`, `storage.mdx`).
   - Retain and update only scaffold, local seed, packaging/contributing, manifest, and client bridge docs.

6. `test(plugins): retain release security regression coverage`
   - Delete tests belonging to deleted systems (~5,800 LOC across route tests, events, server SDK, and certificate kit).
   - Keep and verify the small archive, tenant-isolation, registration, lifecycle, CSP, and CLI-parity suite (~1,600 LOC).

## 7. Test reduction policy

Do **not** delete every test merely because this branch has too many tests. That would remove the only regressions guarding the exact authorization failures Greptile found. Instead:

- **Delete tests and fixtures for deferred/deleted subsystems (~5,800 LOC):**
  - Broad Plugin API route tests: `apps/api/src/__tests__/plugin-api-*.test.ts` (8 route files: courses, lessons, exercises, identity, organization, certificates, storage, access-token)
  - Event delivery & outbox tests: `apps/api/src/__tests__/plugin-events.test.ts` and `plugin-delivery.test.ts`
  - Deferred service & route tests: `apps/api/src/__tests__/plugin-credentials.test.ts`, `plugin-storage.test.ts`, `plugin-content.test.ts`, `plugin-progress.test.ts`, `plugin-slices-services.test.ts`, `plugin-identity-service.test.ts`, `plugin-bridge-apis.test.ts`, and `plugin-launch-hardened.test.ts`
  - Certificate kit tests: `packages/certificate-kit/tests/certificate-kit.test.ts`
  - Server SDK tests: `packages/plugin-sdk/src/server/client.test.ts`
  - Deferred UI utility tests: `apps/dashboard/src/lib/features/plugins/utils/permissions.test.ts` and `plugin-actions.test.ts`
  - Fixtures for deferred plugins: `packages/utils/tests/fixtures/plugins/certificate-studio.json`. **Do not delete fixtures required by retained tests**: `reading-time.json`, `lesson-acknowledgment.json`, `linkedin-sharing.json`, and `announcement-banner.json` under `packages/utils/tests/fixtures/plugins/` and `apps/api/src/__tests__/fixtures/plugins/` must be retained because `plugin-manifest.test.ts` and `plugin-installation.test.ts` load and validate them directly.
- **Delete duplicate mock-heavy tests** that assert implementation details rather than release/security outcomes.
- **Retain or rewrite a compact, integration-oriented suite for the retained system (~1,600 LOC):**

| Required retained test | Target file | Security/product invariant |
|---|---|---|
| Manifest/archive validation | `packages/utils/tests/plugin-manifest.test.ts` | Path traversal, malformed archive, digest mismatch, undeclared entrypoint, and unsupported scope fail before persistence. |
| Installation lifecycle & permissions | `apps/api/src/__tests__/plugin-installation.test.ts` | Installing a release maps requested permissions to active grants; `resolveOrgContributions` returns only authorized UI slots. |
| Development seeding isolation | `apps/api/src/__tests__/plugin-development.test.ts` | An API key from organization A cannot create, update, install, or overwrite organization B's development release; enforces atomic extraction. |
| Trusted release registration | `apps/api/src/__tests__/plugin-release.test.ts` | Valid immutable artifact registers once; mismatched manifest/digest/object key, duplicate version with a new digest, and untrusted caller fail. |
| Authorization & runtime revocation | `apps/api/src/__tests__/plugin-authorization.test.ts` | Disabled, unapproved, uninstalled, and revoked releases neither render nor receive retained bridge/service access. |
| CSP/artifact integration | `apps/api/src/__tests__/plugin-csp.test.ts` | The configured artifact origin is permitted by `frame-src`; a foreign origin is not. |
| CLI parity & deterministic pack | `packages/plugin-sdk/tests/cli.test.ts` & `packages/plugin-sdk/tests/conformance/*.test.ts` | Scaffolded manifest validates under active scope rules; tampering is detected; deterministic archives match digests. |
| Client bridge protocol | `packages/plugin-sdk/tests/bridge-rpc.test.ts` | PostMessage bridge handles requests, responses, timeouts, and error framing reliably without window leaks. |

The likely end state is fewer, higher-value tests—not zero tests. A security-sensitive release system without these tests will regress as soon as the next capability is added.

## 8. Documentation reduction

Ship only documentation that describes a real supported path:

1. **Get started:** scaffold, normal frontend `npm run dev` and `npm run build`, then `npm run pack` / `npm run seed` for ClassroomIO-specific local work.
2. **Manifest reference:** every supported field, allowed contribution surface, entrypoint rule, asset path rule, and currently active permission.
3. **Packaging and contributing:** PR workflow, required checks, immutable version policy, trusted post-merge release, and what contributors never do (no upload, publish token, bucket credential, or direct production registration).
4. **Client SDK reference:** only bridge methods the host implements.
5. **Local development:** `CLASSROOMIO_API_URL`, `CLASSROOMIO_DEV_TOKEN`, and optional `CLASSROOMIO_ORG_ID`, including the exact behavior when the organization ID is omitted.

Remove or mark as future design—not developer documentation—any server SDK/authentication flow, planned scope, certificate template bridge, webhook subscription, reviewer dashboard, or public publish workflow that is not shipped.

## 9. Merge gates

The reduced implementation is eligible for review only when all of these are true:

- [ ] The diff contains only the retained MVP surfaces.
- [ ] No public submission/quarantine/publisher-token path remains.
- [ ] No server API endpoint is reachable without a route-owned, fail-closed authorization policy.
- [ ] Development releases are ownership-isolated and transaction-safe.
- [ ] Runtime revocation/approval/disable state is enforced everywhere a retained plugin can execute.
- [ ] Production artifact origin and dashboard CSP are configured from one validated deployment contract.
- [ ] Trusted CI provenance is bound to the protected repository/ref/workflow/commit.
- [ ] Releasable plugins use published, pinned dependencies only.
- [ ] The compact regression suite above passes, alongside API/dashboard/package builds relevant to the reduced diff.
- [ ] Docs describe only supported commands, environment variables, and runtime capabilities.

## 10. Final recommendation

Execute this reduction as a single PR on `feat/plugin-platform-v2`. Keep the PR in draft while applying the 6 sequential, reviewable commits:
1. `refactor(plugins): remove deferred platform subsystems`
2. `refactor(db): reduce plugin platform schema`
3. `fix(plugins): harden release and local development flows`
4. `fix(plugin-sdk): align supported CLI and bridge contract`
5. `docs(plugins): document the supported PR-first workflow`
6. `test(plugins): retain release security regression coverage`

Fold the database schema changes into the existing `0039_plugin_platform_complete.sql` migration in place (keeping timestamp `1792575299000` > `main`), verify all build and security gates, and mark the PR ready for review only after the entire reduced diff is coherent. That delivers the practical reviewability of atomic steps within a single PR without trying to review one enormous mixed implementation.
