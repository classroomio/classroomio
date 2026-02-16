# Email Template Customization and Translation PRD

## Purpose
Enable organization admins to manage outbound email templates without code changes by editing:
- Email logo
- Email content
- Whether each email should be sent

This also introduces localization so email content is not hardcoded to English only.

## Problem Statement
Today, all templates in `packages/email/src/emails/*.ts` are:
- Hardcoded in English
- Hardcoded in code (no admin editing surface)
- Always sent when the related business event occurs
- Coupled to a static ClassroomIO logo in `getDefaultTemplate(...)`

This limits localization, white-labeling, and product control.

## Decision Summary
- v1 allows editing system-managed email template IDs only.
- Org admins cannot create new email event types or custom triggers from the UI.
- Engineering can add new system email IDs where legacy raw emails still exist.
- v1 supports per-template:
  - `logo`
  - `content`
  - `isEnabled` (send toggle)
- v1 supports locale variants with fallback behavior.

## Current-State Audit

Legend: `available now`, `partial`, `missing`

| Capability | Availability | Current State | Effort | Should Implement |
| --- | --- | --- | --- | --- |
| Edit logo per template | missing | Static logo URL in default wrapper | Medium | [x] |
| Edit content per template | missing | HTML strings are hardcoded in TS files | Medium | [x] |
| Per-email send toggle | missing | Email sends are trigger-based only | Medium | [x] |
| Multi-language email content | missing | English-only template copy | Medium | [x] |
| Create new email types | missing | Requires code updates in registry/constants | High | [ ] (v1 non-goal) |
| Template preview before save | missing | No preview API/UI | Low | [x] |
| Audit trail for template changes | missing | No history | Medium | [x] |

## Existing Email IDs (Current Catalog)
From `packages/email/src/utils/constants.ts`:
- `forgotPassword`
- `welcome`
- `verifyEmail`
- `onPasswordReset`
- `inviteTeacher`
- `newsfeedPost`
- `newsfeedComment`
- `studentCourseWelcome`
- `studentCourseInvite`
- `teacherStudentJoined`
- `teacherStudentBuyRequest`
- `studentProvePayment`
- `teacherCourseWelcome`

## Goals
1. Organization admins can configure logo, content, and send toggle for each existing email ID.
2. Admins can manage localized content using supported locales (`en`, `hi`, `fr`, `pt`, `de`, `vi`, `ru`, `es`, `pl`, `da`).
3. Send pipeline resolves the best template by organization + locale with safe fallback.
4. Template resolution should not break existing `sendEmail(...)` call sites.
5. Keep type-safe Zod field validation already provided by `@cio/email`.
6. Migrate raw `deliverEmail(...)` product notifications into managed template IDs.

## Non-Goals (v1)
- Letting admins create brand new email types, custom event triggers, or campaign flows.
- Editing `subject`, `from`, or `replyTo` in dashboard.
- Drag-and-drop email builder.
- Advanced analytics (open rate, click rate).
- Attachments.

## Legacy Raw Emails to Standardize
Current product emails bypassing template registry:
- `apps/api/src/services/submission/submission.ts`:
  - student submission status update email
  - teacher notification on new student submission

Plan:
- Create system-managed IDs for these flows.
- Move content to template registry + editable overrides.
- Keep behavior compatible while migrating call sites.

## Functional Requirements

### Template Editing
Per existing email ID, admins can:
- Upload/select logo URL
- Edit localized HTML content
- Enable or disable sending

### Localization
- Template content is saved per locale.
- Fallback order at send time:
1. Org + emailId + requested locale
2. Org + emailId + `en`
3. Code default template renderer (current hardcoded fallback)

### Send Toggle
- If template for an email ID is disabled, send is skipped and logged.
- Skip must not fail business actions (invites, onboarding, etc.).
- `required` email IDs can be protected from disabling (recommendation below).

### Placeholder Safety
- Content can use variable placeholders from each template schema (for example `{{inviteLink}}`, `{{studentName}}`).
- Save validation rejects unknown placeholders for the selected email ID.
- Render-time validation continues using existing Zod schema.

## Product Rules (Recommended)
1. Email IDs classified as:
   - `required`: `forgotPassword`, `verifyEmail`, `onPasswordReset`
   - `optional`: all remaining IDs
2. `required` IDs cannot be disabled in UI/API.
3. Missing localized content shows explicit fallback badge (`Using English fallback`).

## Proposed Architecture

### Data Model (New)

#### `organization_email_template`
Organization-scoped override rows for existing email IDs.

Suggested fields:
- `id` (uuid, pk)
- `organization_id` (uuid, fk -> `organization.id`, indexed)
- `email_id` (text, constrained to known email IDs)
- `locale` (`LOCALE`, default `en`)
- `is_enabled` (boolean, default `true`)
- `logo_url` (text, nullable)
- `content` (text, nullable; null means fallback to code default content)
- `updated_by_profile_id` (uuid, fk -> `profile.id`)
- `created_at`, `updated_at`

Constraints:
- unique `(organization_id, email_id, locale)`
- index `(organization_id, email_id)`
- index `(organization_id, locale)`

Notes:
- Row presence means override intent.
- `content = null` allows logo/toggle-only overrides.

#### `organization_email_template_audit`
Append-only audit trail of changes.

Suggested fields:
- `id` (uuid, pk)
- `organization_id` (uuid, indexed)
- `email_template_id` (uuid, fk -> `organization_email_template.id`)
- `action` (`CREATED` | `UPDATED` | `DELETED` | `ENABLED` | `DISABLED`)
- `before` (jsonb)
- `after` (jsonb)
- `actor_profile_id` (uuid)
- `created_at`

## Backend Plan

### Validation (`packages/utils/src/validation/email-template/`)
- `ZListEmailTemplatesQuery`
- `ZGetEmailTemplateParams`
- `ZUpsertEmailTemplate`
- `ZDeleteEmailTemplate`
- `ZPreviewEmailTemplate`

`ZUpsertEmailTemplate` (v1):
- `emailId: EmailId`
- `locale: TLocale`
- `isEnabled?: boolean`
- `logoUrl?: string | null`
- `content?: string | null`

### Queries (`packages/db/src/queries/email-template/`)
- `listOrganizationEmailTemplates`
- `getOrganizationEmailTemplate`
- `upsertOrganizationEmailTemplate`
- `deleteOrganizationEmailTemplate`
- `createOrganizationEmailTemplateAudit`
- `getResolvedOrganizationEmailTemplate` (with fallback)

### Services (`apps/api/src/services/email-template/`)
- `listEmailTemplatesService`
- `getEmailTemplateService`
- `upsertEmailTemplateService`
- `deleteEmailTemplateService`
- `previewEmailTemplateService`
- `resolveEmailTemplateForSendService`

### Routes (`apps/api/src/routes/email-template/`)
Mounted under organization context:
- `GET /organization/email-templates`
- `GET /organization/email-templates/:emailId`
- `PUT /organization/email-templates/:emailId`
- `DELETE /organization/email-templates/:emailId`
- `POST /organization/email-templates/:emailId/preview`

All routes: `authMiddleware` + `orgAdminMiddleware`.

## Send Pipeline Integration

### Current
`sendEmail(emailId, { to, fields, ... })` renders from registered code template directly.

### Proposed
Add optional send context:
- `organizationId?: string`
- `locale?: TLocale`

Flow:
1. Existing template schema validation remains unchanged.
2. If `organizationId` exists, resolve override with locale fallback.
3. Determine final `isEnabled`.
4. If disabled, return skipped result `{ success: true, skipped: true, reason: 'TEMPLATE_DISABLED' }`.
5. Render final email wrapper with resolved `logoUrl` and `content` (or default fallback).

Implementation note:
- Keep backward compatibility by making new context optional.
- Existing call sites without org context continue to use default code templates.

## Frontend Plan (Dashboard)

### Route
- `apps/dashboard/src/routes/org/[slug]/settings/emails/+page.svelte`

### Navigation
Add settings tab item under org settings:
- title: `Emails`
- path: `/settings/emails`

### Feature Module
`apps/dashboard/src/lib/features/email-template/`
- `api/email-template.svelte.ts`
- `utils/types.ts`
- `utils/email-template-utils.ts`
- `components/email-template-list.svelte`
- `components/email-template-editor.svelte`
- `components/email-template-preview.svelte`
- `pages/email-template-settings.svelte`

### UX (v1)
- Left panel: list of existing email IDs + enabled status.
- Top controls: locale selector + fallback indicator.
- Editor:
  - logo upload/URL
  - content editor (HTML)
  - placeholder helper for selected email ID
  - enable/disable switch
- Preview pane renders current locale result.
- Save + Reset actions.

### Copy and Translations
- No hardcoded UI strings.
- Add keys in `apps/dashboard/src/lib/utils/translations/en.json` and other locales as needed.

## Phased Rollout

### Phase 0: Foundation
1. DB tables + migration.
2. Validation + queries + services + routes.
3. Add metadata catalog for email IDs and allowed placeholders.
4. Add system-managed IDs for legacy raw submission emails.

### Phase 1: Dashboard Management
1. Add org settings email page.
2. List, edit, save, reset template overrides.
3. Preview endpoint + preview UI.

### Phase 2: Send Pipeline Adoption
1. Add optional `organizationId`/`locale` context in send flow.
2. Update org-scoped call sites to pass context.
3. Add skip logging for disabled templates.

### Phase 3: Hardening
1. Audit logs UI/read endpoint.
2. Placeholder validation improvements and warnings.
3. Performance optimizations and caching.

## Migration Plan
No hard data migration is required for v1 because defaults already exist in code.

Rollout strategy:
1. Ship schema and API with no behavioral change.
2. Ship UI and allow override creation.
3. Enable send-time override resolution.
4. Incrementally update send call sites to pass org/locale context.

## Risks and Mitigations
- Risk: Admin enters broken HTML.
  - Mitigation: sanitize on save + render preview with warnings.
- Risk: Required variables removed from content.
  - Mitigation: placeholder validation against schema keys.
- Risk: Disabling critical auth emails blocks account flows.
  - Mitigation: `required` email IDs are non-disableable.
- Risk: Missing org context in some send call sites.
  - Mitigation: safe fallback to existing code templates until upgraded.
- Risk: Large refactor footprint across services.
  - Mitigation: optional send context and gradual adoption by domain.

## Success Metrics
- At least 80% of active organizations with non-default email templates in first 60 days.
- At least 90% of org-scoped email sends resolved through template override service.
- Zero critical auth incidents caused by template disable misconfiguration.
- Reduction in support requests about email branding/language by at least 50%.

## Open Questions
1. Should `welcome` email be org-customizable or remain global/system-owned?
2. Do we allow plain-text editor mode in addition to HTML mode?
3. Should logo override be per-template or org-global default with optional per-template override?
4. Should locale resolution use recipient profile locale automatically when context locale is omitted?
5. Do we need test-send endpoint in v1 or can preview-only ship first?

## Kanban Board (Ideation Phase)

| Ticket | Title | Todo | In Progress | Verification | Done |
| --- | --- | --- | --- | --- | --- |
| ET-1 | DB: add `organization_email_template` table | [ ] | [ ] | [ ] | [ ] |
| ET-2 | DB: add `organization_email_template_audit` table | [ ] | [ ] | [ ] | [ ] |
| ET-3 | Validation schemas for email-template APIs | [ ] | [ ] | [ ] | [ ] |
| ET-4 | Queries for template CRUD + resolve fallback | [ ] | [ ] | [ ] | [ ] |
| ET-5 | Service layer for list/get/upsert/delete/preview | [ ] | [ ] | [ ] | [ ] |
| ET-6 | Organization routes `/email-templates` | [ ] | [ ] | [ ] | [ ] |
| ET-7 | Dashboard settings page for templates | [ ] | [ ] | [ ] | [ ] |
| ET-8 | Locale-aware editor and fallback indicators | [ ] | [ ] | [ ] | [ ] |
| ET-9 | Preview rendering endpoint + UI pane | [ ] | [ ] | [ ] | [ ] |
| ET-10 | Send pipeline context and override resolution | [ ] | [ ] | [ ] | [ ] |
| ET-11 | Update org-scoped send call sites | [ ] | [ ] | [ ] | [ ] |
| ET-12 | Required-email toggle guardrails | [ ] | [ ] | [ ] | [ ] |
| ET-13 | Audit log write/read integration | [ ] | [ ] | [ ] | [ ] |
| ET-14 | Caching/performance pass | [ ] | [ ] | [ ] | [ ] |
| ET-15 | Migrate raw submission emails to managed template IDs | [ ] | [ ] | [ ] | [ ] |

## Verification Checklist
- [ ] `pnpm --filter @cio/db build`
- [ ] `pnpm --filter @cio/utils build`
- [ ] `pnpm --filter @cio/email build`
- [ ] `pnpm --filter @cio/api build`
- [ ] `pnpm --filter @cio/dashboard build`
- [ ] Manual: edit template logo + save + preview
- [ ] Manual: edit localized content + locale fallback behavior
- [ ] Manual: disable optional email and verify skip behavior
- [ ] Manual: ensure required emails cannot be disabled
- [ ] Manual: send flow still works for routes not yet migrated to org context
