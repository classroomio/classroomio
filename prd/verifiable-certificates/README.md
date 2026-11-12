# Verifiable Certificates PRD

## Prototype and demo

- **Prototype (UX source of truth):** [`prototypes/verifiable-certificates/`](../../prototypes/verifiable-certificates/), start at [`index.html`](../../prototypes/verifiable-certificates/index.html). Open it with `open prototypes/verifiable-certificates/index.html` to click through the flow end to end.
- **Demo walkthrough (video):** [Verifiable certificates demo](https://www.awesomescreenshot.com/video/58179401?key=734c1fd444b7abb0250f2cfa7d920c33)

**The UX of this feature must be taken from the prototype folder.** It is the approved design reference for layout, states and copy. When this document and a prototype disagree on a UI detail, the prototype wins.

| Surface | File |
| --- | --- |
| Public | `verify-valid.html`, `verify-expired.html`, `verify-revoked.html`, `verify-not-found.html`, `verify-lookup.html`. They render inside the org's landing page theme (same nav, hero strip and footer), with no verify link in the nav. |
| Learner | `certificate-card.html` (code, QR, copy link, status) |
| Teacher | `course-certificate-settings.html` (Design tab with the Classique preview and the **Customize Design** button; Settings tab with validity and a read-only public verification address derived from the verified custom domain), `certificate-studio.html` (the Customize Design editor, click-to-edit on the preview, with a Valid / Expired / Revoked "Preview as" bar), `course-people-certificate.html` (People page with a Certificate column, a certificate status filter, a per-learner drawer and a revoke modal with a live preview of the revoked public page) |

The prototypes use the real design tokens (`app-theme.css` for dashboard pages, the `minimal` org-landing theme in `landing-theme.css` and `org-shell.css` for public pages). QR codes in them are placeholders and are not scannable.

## Purpose

Make every ClassroomIO certificate checkable by a third party. An employer, regulator or auditor scans the QR code or types the printed code, lands on a public page on the customer's own brand, and sees whether the certificate is valid, expired or revoked. Reference experiences: Credly and Accredible verification pages, scoped to what a course platform needs.

## Problem Statement

- The certificate ID printed today is not verifiable. `formatCertificateId(design.idFormat, profileId, issuedAt)` derives a display string from the learner id (or a timestamp fallback) and the date. Nothing stores it and nothing resolves it, so it proves nothing.
- Standard (non-compliance) courses store **no certificate row at all**. Only compliance courses write `course_certificate_issue`, so there is no record to verify against for most certificates.
- There is no public page, no QR code, and no way to revoke a certificate.
- Expiry exists only for compliance courses (`expiresAt`, flipped by the compliance job). Other courses cannot expire a certificate.
- Custom fields are promised in the marketing pillar, but nothing lets a teacher define or fill extra certificate fields.
- A Growth customer without a custom domain would get a certificate whose verification URL is broken.

## Corrections to the source spec

The technical spec (document 7, Phases 1 to 5) is not in the repo, so this PRD rebuilds it from the brief and the code. Two arithmetic errors in that spec are corrected here and must not be carried forward:

- The verify-code alphabet has **31** characters, not 30.
- The code space is **31^8 = 852,891,037,441 (about 853 billion)**. Even the 30-character figure was misquoted: 30^8 is about 656 billion, not 65 billion. The design is sound; only the arithmetic was wrong.

The alphabet used here is `23456789ABCDEFGHJKMNPQRSTUVWXYZ`: digits 2 to 9 (8) plus A to Z without `I`, `L`, `O` (23) = 31 characters. If the original spec listed a different 31-character alphabet, keep the original and keep the corrected arithmetic.

## Confirmed Decisions

1. **Paid plans only.** The public verification page, QR code and verify code are available to paid plans (the same `!isFreePlan` gate as certificate customization today; marketing name Growth and above). Free-plan certificates are unchanged: no code, no QR, no public page. The "Powered by ClassroomIO" footer on a Starter verification page is **removed from the spec**; pricing is the source of truth. Opening verification to Starter with our footer is a pricing decision and is not made here.
2. **Fallback host when there is no custom domain.** The page always resolves on a ClassroomIO-hosted tenant URL, `https://<siteName>.<platform host>/verify/<code>`. Once the org has a verified custom domain, that URL permanently 301-redirects to `https://<customDomain>/verify/<code>`. The QR encodes the canonical URL at render time; old PDFs keep working because the fallback host never stops redirecting.
3. **Custom fields get an authoring interface** (teacher-defined fields on the course certificate, values per learner). See [Custom fields](#custom-fields).
4. **Multi-course certification tracks are out of scope.** They depend on Learning Paths ([`prd/learning-paths`](../learning-paths/README.md)), which owns path certificates. This PRD only requires that the verify page, code and revocation work for any certificate record, so a path certificate can plug in without rework. No path columns are added here.
5. **Status is derived at read time.** `revoked` if `revokedAt` is set, else `expired` if `expiresAt` is in the past, else `valid`. Expiry therefore flips the status the moment it passes, with no cron lag. The stored `status` column stays only because the compliance job writes it; it is never read for verification.
6. **A certificate record exists for every issued certificate on a paid plan**, not just compliance courses. It is created on first eligibility or first download, idempotently.
7. **The verify code is random, not derived.** 8 characters from the 31-character alphabet, shown as `XXXX-XXXX`, unique in the database, case-insensitive on lookup. The alphabet excludes `0`, `1`, `I`, `L` and `O`, so look-alike characters cannot be mistyped for each other.
8. **Revocation is reversible and audited.** A reason is required and is visible to teachers only. The public page shows "Revoked" and the date, never the reason.
9. **Verification survives a downgrade.** A certificate issued on a paid plan keeps resolving after the org downgrades, because a printed credential must not die with a subscription. The gate applies to issuing new verifiable certificates and to custom-field authoring. Revocation is never gated.
10. **Expiry is optional per course.** Standard courses gain an optional validity period. Compliance courses keep `retakeIntervalMonths` as their validity and renewal cycle.
11. **Verification is issuer attestation, not accreditation.** No external authority or standard is required for a certificate to be verifiable: the issuing organization vouches for its own certificate, and trust comes from the verify page living on the issuer's own domain. This is how Coursera (`coursera.org/verify/<code>`), Moodle's Custom certificate plugin (unique code, QR code, verification page) and Credly or Accredible (public credential URL with revoke and expiry) work. Whether a course is recognised by a regulator or professional body is the customer's business and is never claimed by ClassroomIO. The public page says so in plain words (see [Public verification page](#public-verification-page)). Customers who need to show an accreditation number can add it as a custom field.

## Current-State Audit

| Capability | Current state | Notes |
| --- | --- | --- |
| Certificate rendering | `packages/certificates` renders 5 templates to PDF/PNG via `apps/api/src/utils/certificate.ts` | `CertificateRenderData` has no verify code, QR, or custom fields |
| Printed ID | `formatCertificateId(design.idFormat, …)` in `apps/api/src/services/course/certificate.ts`, `completion.ts` | Derived from profile and date; not stored, not resolvable |
| Certificate record | `course_certificate_issue` (compliance only): `expiresAt` not null, `status`, `courseCompletionRecordId` not null and unique | Needs to become the general record |
| Expiry | Compliance job sets `expiredAt` and issue `status = 'expired'` (`services/course/compliance.ts`) | Stored flip; verification must not depend on job timing |
| Design settings | `course.certificate` jsonb: `isDownloadable`, `design` (template, accent, subtitle, signatories, `idFormat`), `deadline`, `emailMessage` | Custom field definitions and validity fit here |
| Plan gate | Certificate customization gated by `isFreePlan` (`prd/pricing-improvements`) | Reuse the `isOrgOnFreePlan` predicate. Self-hosted installs count as paid, so they get verification. Today the gate is enforced only in the dashboard UI; the API check is new work |
| Custom domain | `organization.customDomain`, Cloudflare flow (`custom-domain-cloudflare`) | Source for the redirect target |
| Tenant routing | `apps/tenant-router` and `?org=<siteName>` locally | Resolves the fallback host |
| Webhooks | `course.certificate.issued` carries `displayId` | Add `verifyCode` and `verifyUrl`; `id` becomes non-null for paid orgs. Update the zod schema and `apps/docs/content/docs/developers/webhooks.mdx` |
| Path certificates | Not built; specified in `prd/learning-paths` | Dependency, not this PRD |

## Product Goals

- A certificate carries a visible verify code and a QR code.
- The public page resolves on the customer's brand, with or without a custom domain.
- Expiry flips the status automatically.
- Revocation works from the admin interface.
- Teachers can add custom fields to a certificate and fill them per learner.

## Non-Goals (v1)

- Multi-course tracks and path certificates (Learning Paths owns them).
- Opening verification to the free plan.
- Verifying certificates already issued before this ships. They carry no code; only newly rendered certificates do.
- A public third-party verification API (the page's data route is internal in v1).
- Digital signatures, blockchain anchoring, Open Badges export, LinkedIn "Add to profile". Signed credentials (Open Badges 3.0, which builds on W3C Verifiable Credentials) are a possible later phase so wallets and other platforms can check a credential without calling us. The 1EdTech certification covers issuing software, not individual badges, and is not needed for v1.
- Claiming or checking accreditation, CPD recognition or regulator approval of any course.
- Learner-controlled privacy toggles on the verify page.

## Functional Requirements

### Certificate face (learner and teacher PDF/PNG)

- Shows the verify code (`XXXX-XXXX`) and a QR code that encodes the canonical verify URL, on all five templates.
- Free-plan certificates render exactly as today.
- Prints the course's custom fields as one details line (for example `Employee ID EMP-20418 · Site Lagos Central Kitchen`), shown under the description on all five templates. Fields with no value for that learner are left off. Up to 5 fields, sized through `FIELDS` so long values shrink or wrap and never clip.
- New elements follow the `packages/certificates` rules in `CLAUDE.md`: layout factors in named constants, subtracted from `FIELDS` before font sizing, `escapeHtml` on interpolated strings, typography kept in sync between CSS and `FIELDS`.

### Public verification page

Route `/verify/<code>` on the org's host. Branded with the org logo, name and accent color. No login.

| State | Shows |
| --- | --- |
| Valid | Green status, recipient name, course title, org name, issue date, expiry date (if any), custom fields, certificate code |
| Expired | Muted status, "Expired on <date>", same details |
| Revoked | Red status, "Revoked on <date>", recipient and course shown, no reason |
| Not found | Neutral message, code input to try again, no hint whether the code ever existed |
| Free-plan org | Same as not found |

- Never shows the learner's email, progress or grades.
- Carries one line stating what the page proves: "This page confirms that <organization> issued this certificate. It does not say whether the course is accredited by any outside body." Translated like all copy.
- `noindex`, no robots indexing of any `/verify/*` page.
- Code lookup is normalised (case, hyphen, spaces).
- `/verify` with no code shows the lookup input only.

### Fallback and redirect

| Org state | Request host | Result |
| --- | --- | --- |
| No custom domain | `<siteName>.<platform host>/verify/<code>` | Page served |
| Verified custom domain | custom domain | Page served |
| Verified custom domain | `<siteName>.<platform host>/verify/<code>` | 301 to the custom domain |
| Custom domain removed later | custom domain | Host no longer routes; the fallback host serves the page again |

### Learner

- The certificate card on the Certificates page shows the code, a copy-link action, a QR preview and the current status (Valid, Expired, Revoked).
- A revoked certificate disables PDF download and shows a short "this certificate was revoked" note.
- An expired certificate stays downloadable and shows "Expired" on the card; compliance renewal creates a new certificate with a new code.

### Teacher / admin

**Course > Certificate settings**

- Existing: template, accent color, subtitle, signatories, ID format. Admins edit all of these, plus the description, in **Customize design** with a live preview.
- New: a **Details on the certificate** section in the same editor, where admins add, rename, remove and set the value of each custom field. The value is the default new certificates start with. This edits the same course-level field definitions as the Settings tab, so the limit of 5 is shared. The description, if left blank, falls back to the course description as today.
- New: **Certificate title** and **Issued by** overrides, edited in **Customize design** with a live preview. Blank means the course title and the organization name, as today. Stored as `titleOverride` and `orgNameOverride` on `course.certificate.design`, rendered through `FIELDS` sizing like every other dynamic field.
- New: **Expires after** (None, or N months) for standard courses. Hidden for compliance courses, which use their retake interval.
- New: **Custom fields** editor (see below).

**Course > People**

- A certificate drawer per learner: code, issue and expiry dates, status, custom field values (editable), **Revoke** and **Reinstate** actions.
- Revoke requires a reason; reinstate asks for confirmation. Both are audited (actor, time).
- Roles allowed: org admins and the course's tutors.

### Custom fields

- Definitions live on the course (`course.certificate.design.customFields`): `{ key, label, type: 'text' | 'date', required }`, maximum 5 per course, labels up to 40 characters, `key` generated from the label and stable after creation.
- Values live per certificate in `metadata`, keyed by field `key`. Values are the author's own text, with no markup and no localized copy.
- A field with `required` blocks issuance until a value exists, and the course owner is prompted in the People drawer. Field values are never set in the course design. They are entered per learner in the People drawer.
- Values are editable until revocation, and edits show on the verify page immediately.
- Values can be set through the public API certificate endpoints (metadata object); the public-api-review checklist applies.

## Technical Design

### Data model

Extend `course_certificate_issue` into the general certificate record. One migration for the whole branch.

```ts
courseCertificateIssue:
  verifyCode       varchar(8) not null unique   // stored uppercase, no hyphen
  expiresAt        timestamptz nullable         // was not null; null = never expires
  courseCompletionRecordId uuid nullable        // was not null; null for standard courses
  revokedAt        timestamptz nullable
  revokedBy        uuid nullable → profile.id
  revokeReason     text nullable
  metadata         jsonb default {}             // custom field values keyed by field key
  unique (courseId, profileId, cycleNumber)     // cycleNumber = 1 for standard courses; check existing compliance rows and decide the fate of course_certificate_issue_record_id_key
```

- `status` is retained for the compliance job but is not an input to verification.
- Verification status is computed in one pure function, `resolveCertificateStatus({ revokedAt, expiresAt }, now)`, shared by the page route, the learner card and the admin drawer.
- Indexes: unique on `verifyCode`; existing indexes on course, profile and status stay.
- Org lookup for the verify route goes through `course.organizationId`; no org column is duplicated onto the issue row.

### Code generation

```ts
const VERIFY_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // 31 chars
const VERIFY_CODE_LENGTH = 8;                               // 31^8 = 852,891,037,441

function generateVerifyCode() {
  // rejection-sample crypto.getRandomValues so each character is uniform over 31
}
```

- Insert with the unique constraint as the guard and retry on collision (up to 5 attempts, then fail loudly).
- Lookups normalise input: uppercase, strip `-` and whitespace, reject anything outside the alphabet before touching the database.
- Brute force: 853 billion codes, plus per-IP rate limiting on the verify route, makes enumeration impractical.

### Issuance

```text
evaluateCourseCertification / certificate download:
  if org is free plan → legacy behavior, no record
  upsert issue row on (courseId, profileId, cycleNumber)
    → generate verifyCode on insert only
    → expiresAt = issuedAt + course validity (or compliance validUntil)
  render certificate with verifyCode + verifyUrl + QR
```

- Idempotent: repeated downloads return the same code.
- Lazy creation for learners who earned a certificate before launch: first download after launch creates the row.

### Verify URL

```text
getVerifyBaseUrl(org):
  verified customDomain → https://<customDomain>
  otherwise            → https://<siteName>.<platform host>
verifyUrl = <base>/verify/<verifyCode>
```

Implement it by reusing `getDashboardBaseUrl(org)` in `@cio/core/config/dashboard-url`, which already handles the verified custom domain, the `DASHBOARD_ORIGIN` self-host override, local development and the `TENANT_ROOT_DOMAIN` tenant host. The redirect rule is handled where the tenant host is resolved.

### API

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/verify/:code` | Public, rate limited | Resolve a code to the public view model (status, recipient name, course, org brand, dates, custom fields) |
| GET | `/course/:courseId/certificates/:memberId` | Course team | Certificate details for the People drawer |
| PUT | `/course/:courseId/certificates/:certificateId/metadata` | Course team | Set custom field values |
| POST | `/course/:courseId/certificates/:certificateId/revoke` | Course team | Revoke with required reason |
| POST | `/course/:courseId/certificates/:certificateId/reinstate` | Course team | Clear revocation |

Routes follow the standard layering: Zod schema in `packages/utils/src/validation/`, pure queries in `packages/db/src/queries/`, orchestration and plan gate in `apps/api/src/services/`, thin Hono routes. The public view model returns a single shape per endpoint and never includes email, profile id or the revoke reason.

### Frontend

- Dashboard public route group for `/verify` and `/verify/[code]` (confirm the exact directory next to the public course pages).
- Feature folder `apps/dashboard/src/lib/features/certificate/` with `api/certificate.svelte.ts`, `utils/types.ts` (types inferred from the RPC client), and a pure `utils/verify-utils.ts`.
- Teacher UI: extend the course certificate settings tab and the People drawer; use `Field.*` primitives and `Page.SettingsActions` for the save bar.
- QR rendering: server-side SVG data URI inside the certificate HTML, so PDF and PNG exports need no client code.
- All copy through translation keys in `en.json`, then `pnpm translate`.
- Add a `ui:`-prefixed component and Storybook story only if a new shared component is created (status badge).

## Implementation Order

1. **Schema and codes.** Migration (single file, restamp `when` per the migrations rule), code generator, `resolveCertificateStatus`, unit tests for alphabet, collision retry and normalisation.
2. **Issuance.** Upsert issue row on eligibility and download, validity period, plan gate, backfill-on-download.
3. **Certificate render.** Verify code and QR in all five templates with `FIELDS` sizing; `pnpm --filter @cio/certificates build`.
4. **Verify route and page.** Public API route, rate limiting, public page states, tenant fallback and custom-domain redirect, `noindex`.
5. **Revocation and expiry UI.** People drawer, revoke and reinstate, learner card states, validity setting.
6. **Custom fields.** Definition editor, per-learner values, verify page rendering, public API metadata.
7. **Webhooks and docs.** Add `verifyCode` and `verifyUrl` to `course.certificate.issued`; help center article and screenshots per `skills/add-docs-image`.

Build checks: `pnpm --filter @cio/certificates build`, `pnpm --filter @cio/api^... build && pnpm --filter @cio/api build`, dashboard build, `pnpm format:check`.

## Acceptance Criteria

1. A certificate issued to an org on a paid plan shows a verify code and a scannable QR on all five templates, with no text clipping for long names and titles.
2. The QR and code open `/verify/<code>` and show Valid, with recipient, course, org branding and dates.
3. An org with no custom domain gets a working verify URL on its tenant host.
4. After the org verifies a custom domain, the tenant-host URL 301-redirects to it, and previously printed QR codes still resolve.
5. When `expiresAt` passes, the page shows Expired on the next request with no job having run.
6. A revoked certificate shows Revoked on the public page without the reason, and PDF download is disabled for the learner.
7. Reinstating a revoked certificate restores Valid or Expired as computed, and both actions are audited.
8. Custom fields defined on a course appear on that course's certificates' verify pages with the values the teacher entered; editing a value updates the page immediately.
9. A code that does not exist, is malformed, or belongs to a free-plan org returns the same not-found page.
10. Generated codes use only the 31-character alphabet and no code is ever issued twice.
11. `/verify/*` pages are `noindex` and the route is rate limited.
12. An org that downgrades keeps resolving previously issued certificates.
13. Free-plan certificates are byte-for-byte unchanged.
14. Zero regression on existing features: compliance renewals, certificate emails, webhooks and the public API certificate endpoints still pass their tests.
15. All copy uses translation keys across every dashboard locale.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Standard courses have no certificate row, so existing certificates cannot be verified | Create rows lazily on first download; state plainly that pre-launch PDFs carry no code |
| Dropping `NOT NULL` on `expiresAt` and `courseCompletionRecordId` breaks compliance code that assumes them | Audit `queries/course/compliance.ts`, `queries/course/reset-progress.ts` and `queries/webhook/payload-details.ts` before the migration; add tests for both course types |
| Stored `status` and derived status disagree | Verification reads only the derived value; the stored column is documented as compliance bookkeeping |
| Custom domain removed, QR breaks | The fallback host never stops serving the page, and the redirect only ever points to a verified domain |
| Code enumeration or scraping of learner names | 853-billion code space, per-IP rate limits, identical not-found responses, `noindex` |
| Long custom field values break the certificate or verify layout | Length caps on definitions and values; verify-page-only in v1 |
| Pricing contradicts the website if the "Starter with footer" idea resurfaces | Decision 1 records the choice; a change goes through pricing, not this spec |
| Employers read "verified" as "accredited" | Decision 11 and the one-line statement on the verify page; marketing copy says "verify authenticity", never "accredited" |
| Learners object to a public page showing their name | Recipient name is the point of verification; revisit a per-learner toggle if support signals demand it |

## Open Questions

1. Does Growth map to `EARLY_ADOPTER` in code (marketing Growth versus `BASIC`, `EARLY_ADOPTER`, `ENTERPRISE`)? Confirm before wiring the gate.
2. Resolved: custom fields print on the certificate face as one details line (see Certificate face) and also show on the verify page. Remaining question: should a learner-specific description override exist on the People drawer, or is the course-level description enough? Recommendation: course-level only for v1.
3. Add a `course.certificate.revoked` webhook now, or defer? Recommendation: defer to a follow-up.
4. Should a downgraded org's certificates keep resolving indefinitely (Decision 9), or for a fixed window?
5. The original document 7: please paste it so the phase list and alphabet can be reconciled line by line.
6. Should an org be able to keep verification private per course (Moodle offers login-only verification)? Recommendation: no for v1, because a certificate nobody can check defeats the purpose. Revisit if a customer in a regulated sector asks.
7. Do we want signed credentials (Open Badges 3.0) as the follow-up after v1, or only LinkedIn "Add to profile"? Confirm against the official 1EdTech specification before scoping, since most sources found were vendor blogs.
