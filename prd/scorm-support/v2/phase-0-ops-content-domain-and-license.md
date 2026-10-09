# Phase 0 ops: content domain, DNS, and license-server change

Scope: [`implementation-plan.md`](./implementation-plan.md) Phase 0, second bullet
(“Register the content domain and add it to Cloudflare with a wildcard record”)
and third bullet (“Confirm with whoever owns `enterprise-api.classroomio.dev` how
a license gains the `scorm` feature, and schedule that change before the
self-hosted release”).

Authority: [`README.md`](./README.md) decision 1 (content origin), decision 3
(plans and licensing), decision 14 (package storage and delivery).
Code changes for these domains land in PR 6–PR 9 and PR 15. This record makes
no code change, by design.

Status: spec complete, awaiting human with registrar, Cloudflare, and
license-server access. Verified against the codebase on 9 October 2026.

## A. Content domain and DNS

### Locked choice

- Cloud content domain: `classroomio-content.com`.
- Per-organization host: `{orgKey}.classroomio-content.com`, where `orgKey`
  is a stable short id derived from the organization id, not the editable
  site name (`README.md` decision 1).
- Current state, verified 9 October 2026: `classroomio-content.com` returns
  `NXDOMAIN`. No code references `classroomio-content`, `SCORM_CONTENT_*`,
  or `ACTIVITY_SIGNING_SECRET` yet; current edge hosts are
  `*.myclassroomio.com`, `app.classroomio.com`, and `embed.classroomio.com`
  (`apps/tenant-router/wrangler.toml:9-14`,
  `apps/tenant-router/README.md:54-65`).

### Why this name

- `README.md` decision 1 requires a dedicated registrable domain for cloud,
  following the `googleusercontent.com` model, because ClassroomIO is
  multi-tenant and one person can administer several organizations.
- A subdomain of `classroomio.com` (for example `scorm.classroomio.com`)
  is rejected for cloud: it is the same site as the app, so package code
  could set parent-domain cookies the app would receive
  (`README.md` Architecture overview).
- Self-hosted uses one hostname under the operator’s existing domain, for
  example `content.yourdomain.com` set with `SCORM_CONTENT_ORIGIN`. That is
  one DNS record and no second domain purchase (`README.md` decision 1,
  `implementation-plan.md` PR 8 and PR 15).

### Cloudflare spec (human with Cloudflare access runs this)

1. Register `classroomio-content.com` once. ClassroomIO buys the domain once;
   customers buy nothing (`README.md` decision 1).
2. Create a new Cloudflare zone for `classroomio-content.com`.
3. Add a wildcard record, mirroring the existing tenant-zone pattern
   (`apps/tenant-router/README.md:54-65`):
   - `*` CNAME → Worker target, **Proxied** (orange cloud).
   - Do not add an apex serving record; only `*.classroomio-content.com`
     serves content.
4. Bind the zone to the tenant-router Worker. Code change owned by PR 9
   (`apps/tenant-router/wrangler.toml`, `apps/tenant-router/src/activity-content.ts`):
   - Route `*.classroomio-content.com/*` with
     `zone_name = "classroomio-content.com"`.
   - R2 binding for the private `scorm` bucket (created in PR 6).
   - Secret `ACTIVITY_SIGNING_SECRET` via
     `wrangler secret put ACTIVITY_SIGNING_SECRET`, matching the API env.
5. Deploy by hand with `wrangler deploy` before the cloud beta
   (`implementation-plan.md` PR 9 release note).

### Self-hosted (no registrar action)

- Operator adds one DNS record for `content.yourdomain.com` pointing at
  their stack, and sets `SCORM_CONTENT_ORIGIN`.
- The self-hosted guide states the same-site trade-off and supports a
  separate domain for operators who want full isolation (`README.md`
  decision 1, Architecture overview). Docs owned by PR 15
  (`apps/docs/content/docs/self-hosted/scorm.mdx`, `docker/docs/SELF_HOST.md`).

### Verification

```bash
dig +short anything.classroomio-content.com
curl -sS -o /dev/null -w '%{http_code}\n' https://<orgKey>.classroomio-content.com/activity/content/<token>/v1.index.json
pnpm --filter @cio/tenant-router deploy
```

- Wildcard resolves and serves through the Worker.
- Second request for the same immutable file returns
  `cf-cache-status: HIT` on the supported Cloudflare plan
  (`README.md` Content Serving, Caching and Headers; Phase 0 spike
  question 9).
- Without `SCORM_CONTENT_ORIGIN`, self-hosted keeps the feature off with
  an admin explanation (`README.md` acceptance criterion 35).

### Exit criteria

- [ ] `classroomio-content.com` registered.
- [ ] Cloudflare zone live with proxied wildcard record.
- [ ] Worker route deployed and serving a probe path.
- [ ] Self-hosted hostname pattern documented (PR 15), no purchase needed.

## B. License-server change request

### What the repo does today (verified)

- License features: `sso`, `token-auth`, `no-tracking`, `custom-domain`,
  `custom-branding`
  (`packages/utils/src/license/constants.ts:7-13`).
- Cloud plan mapping: Free gets none; Early Adopter gets custom domain and
  branding; Enterprise gets all
  (`packages/utils/src/license/plan-features.ts:19-33`).
- API validates `LICENSE_KEY` against `POST
  https://enterprise-api.classroomio.dev` with body `{ licenseKey }`,
  expects `{ valid, features?, expiresAt? }`, caches for one hour
  (`apps/api/src/services/license.ts:27-79`).
- `README.md` decision 3 requires: new feature `scorm`; cloud includes it
  in every paid plan (Early Adopter and Enterprise); self-hosted needs
  `LICENSE_KEY` with the `scorm` feature; only authoring is gated
  (playback, review, results, export, reset, delete keep working); a lapsed
  plan, missing license, or license server unreachable for an hour must
  never block learners or hide records.

### Request to the license-server owner

> Subject: SCORM support (v2): issue `scorm` license feature before
> self-hosted release
>
> The SCORM v2 PRD (`prd/scorm-support/v2/README.md` decision 3,
> `implementation-plan.md` PR 6, PR 7, PR 15) needs
> `enterprise-api.classroomio.dev` to return `scorm` in `features[]`
> for licenses that include SCORM, using the existing response shape
> `{ valid: boolean, features: string[], expiresAt?: string }`.
> No API change on our side: `isFeatureLicensed('scorm')` already reads
> `features[]` and caches for one hour
> (`apps/api/src/services/license.ts:86-94`). Code that mints the
> `scorm` check (`LICENSE_FEATURE.SCORM`, Early Adopter mapping,
> `assertActivityKindAllowed`) lands in PR 6 and PR 7.
> Please confirm how a license gains the feature and schedule issuance
> before the self-hosted release (PR 15 release checklist). Cloud needs
> no server change: Early Adopter and Enterprise map to it in
> `getLicenseFeaturesForPlan`.

### Verification

```bash
curl -sS -X POST https://enterprise-api.classroomio.dev \
  -H 'Content-Type: application/json' \
  -d '{"licenseKey":"<staging-key-with-scorm>"}'
```

- Response contains `"features": [..., "scorm"]`.
- Staging self-hosted instance with that key passes
  `isFeatureLicensed('scorm')`; a key without it fails authoring with
  `FEATURE_REQUIRES_LICENSE` while launch, results, and reset keep working
  (`README.md` acceptance criteria 12–13; `implementation-plan.md` PR 7
  tests).
- Docs list SCORM as enterprise-gated (`apps/docs/content/docs/self-hosted/101.mdx`,
  `enterprise.mdx`, PR 15).

### Exit criteria

- [ ] Owner confirmed how a license gains `scorm`.
- [ ] Staging key with `scorm` verified through the response shape above.
- [ ] Issuance scheduled before the self-hosted release.

## Non-changes in this item

- No `LICENSE_FEATURE.SCORM` constant (PR 7).
- No `SCORM_CONTENT_ORIGIN`, `SCORM_CONTENT_DOMAIN`, or
  `ACTIVITY_SIGNING_SECRET` env vars (PR 8).
- No Worker route, R2 binding, or content-serving code (PR 8, PR 9).
- No docs pages (PR 15).
