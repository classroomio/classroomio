# Forms Product PRD

## Status

- Draft

## Date

- March 22, 2026

## Implementation Plan

- See [implementation-plan.md](./implementation-plan.md) for phased delivery, ticket breakdown, and recommended sprint sequencing.

## Purpose

Build a standalone Forms product for schools and education teams to collect structured responses such as student feedback, course reviews, enrollment requests, parent intake, event registrations, and internal staff forms, while reusing as much of the existing exercise question engine as possible.

## Executive Summary

ClassroomIO already has a strong reusable question engine:

- `@cio/question-types` already centralizes question contracts, answer serialization, renderer contracts, and form-state helpers, and explicitly calls out reuse for future products such as forms/assessments.
- `@cio/ui/custom/exercise-question` already supports question rendering in `edit`, `take`, `preview`, `review`, and `submission` modes across 12 question types.
- The current exercise stack already handles templates, file upload answers, submission storage, and submission summary visualizations.

The main constraint is that the current product is still deeply shaped around courses, lessons, grading, and enrolled students. That makes it a poor fit for Google Forms / Typeform style workflows if we try to ship Forms by directly reusing the `exercise` and `submission` entities as-is.

### Recommendation

Build Forms as a new top-level product domain, but reuse the existing question engine and renderer stack aggressively.

### Reuse Estimate

- **High reuse (60-70%)**: question types, renderer contracts, answer payloads, file upload answer model, template structure, summary visualization patterns.
- **Medium reuse (20-30%)**: builder UI shell, preview flow, submission list components, analytics presentation patterns.
- **Low reuse (0-15%)**: database entities, API routes, auth model, response ownership, publishing/sharing model, grading workflow.

## Problem Statement

Today, exercises can technically ask many of the same questions that a form would ask, but they are optimized for assessment, not response collection.

That creates hard product limits for schools and organizations that want to collect:

1. Student feedback after a course or session.
2. School review forms and satisfaction surveys.
3. Enrollment and application forms.
4. Parent intake and consent forms.
5. Staff requests and internal administrative forms.
6. Event registration forms.

The current exercise product does not map cleanly to these workflows because:

1. Exercises are attached to a `course`, often also a `lesson` and `section`.
2. Exercise access is enforced through course membership middleware.
3. Submissions are tied to `groupmember` and carry grading state, total score, reviewer, and feedback fields.
4. The UX assumes students, instructors, grading, due dates, and completion rather than respondents, publish/share, response settings, and collection workflows.
5. There is no public share-link, embeddable form, thank-you page, response export, response caps, or form lifecycle model.

## Product Thesis

If ClassroomIO turns the current exercise question engine into a standalone Forms product, the platform gets a second major content primitive:

- `Learning content` for teaching and assessment.
- `Response collection` for school operations and feedback.

This expands ClassroomIO from LMS-only workflows into school operations workflows without throwing away the investment already made in the exercise system.

## Current-State Audit

| Area | Current State | Reuse Value | Forms Gap |
| --- | --- | --- | --- |
| `@cio/question-types` | Shared package for question keys, answer payloads, render contracts, serializer, form state | High | Naming is exercise-centric, but architecture is already reusable |
| `@cio/ui/custom/exercise-question` | Full renderers for `edit`, `take`, `preview`, `review`, `submission` | High | Needs forms shell, branding, page layout, respondent UX |
| Question type coverage | 12 types: radio, checkbox, textarea, true/false, short answer, numeric, fill blank, file upload, matching, ordering, hotspot, link | High | Some types are assessment-first; forms also need presentational blocks and contact fields |
| Exercise builder UI | Existing authoring flow with question reorder, media, templates, preview | Medium | Assumes course exercise editing and points/correctness |
| Submission summary UI | Already shows aggregated response charts and individual response replay | Medium | Needs forms response inbox, filters, export, respondent metadata |
| `exercise` table | Has `courseId`, `lessonId`, `sectionId`, `isUnlocked`, `dueBy` | Low | Needs standalone `form` ownership and publish lifecycle |
| `question` table | Bound to `exerciseId` only | Low | Needs form-owned question model or generalized questionnaire ownership |
| `submission` table | Has `exerciseId`, `courseId`, `submittedBy`, grading fields, feedback | Low | Needs form response model without grading assumptions |
| `question_answer` table | Stores `answerData` JSON and file-upload compatible payloads | Medium | Tied to `groupMemberId`; needs respondent abstraction |
| Course exercise routes | Course-member-only access and course-scoped RPC surface | Low | Needs public/authenticated share flows and org-level management |
| Exercise templates | Existing template metadata and questionnaire payload | Medium | Needs form template gallery and form-specific defaults |

## Data Sources Checked

- `packages/question-types/README.md`
- `packages/question-types/src/exercise-types.ts`
- `packages/question-types/src/render-contract.ts`
- `packages/question-types/src/form-state.ts`
- `packages/question-types/src/question-type-capabilities.ts`
- `packages/question-types/tests/form-and-render-contract.test.ts`
- `packages/ui/src/custom/exercise-question/question-renderer.svelte`
- `packages/ui/src/custom/exercise-question/question-list.svelte`
- `packages/ui/src/custom/exercise-question/question-form-root.svelte`
- `apps/api/src/routes/course/exercise.ts`
- `apps/api/src/routes/course/submission.ts`
- `apps/api/src/services/exercise/exercise.ts`
- `apps/api/src/services/submission/submission.ts`
- `packages/utils/src/validation/exercise/exercise.ts`
- `packages/utils/src/validation/submission/submission.ts`
- `packages/db/src/schema.ts`
- `apps/dashboard/src/lib/features/course/api/exercise.svelte.ts`
- `apps/dashboard/src/lib/features/course/components/exercise/edit-mode.svelte`
- `apps/dashboard/src/lib/features/course/components/exercise/submissions/summary.svelte`
- `apps/dashboard/src/lib/features/course/components/exercise/submissions/individual.svelte`

## Primary Users

- **School operators** collecting enrollment, consent, and intake data.
- **Teachers and tutors** collecting student feedback and course reviews.
- **Administrators** running internal requests, surveys, and registration forms.
- **Parents and students** responding through public or authenticated form flows.

## Goals

1. Launch a standalone Forms product without rebuilding the question engine from scratch.
2. Reuse the existing question type system and UI renderer stack as the shared questionnaire layer.
3. Support the highest-value school use cases first: feedback, review, enrollment, registration, and intake forms.
4. Support both internal authenticated forms and public shareable forms.
5. Ship response collection, response review, and export as first-class workflows.
6. Keep the exercise product working unchanged.

## Non-Goals (v1)

- Full Typeform-style branching at question level.
- Payments inside forms.
- Complex computed fields or spreadsheet formulas.
- Workflow automation builder for multi-step approvals.
- E-signatures with legal compliance guarantees.
- PDF-to-form conversion.
- External app integrations beyond CSV export and email notifications.

## Confirmed Product Decisions

1. Forms will be a **new top-level product**, not a hidden exercise mode inside courses.
2. The shared question engine remains the foundation for both Exercises and Forms.
3. Forms v1 will support **draft**, **published**, **closed**, and **archived** lifecycle states.
4. Forms responses are **never graded**. Points, correctness, grading state, and reviewer workflow do not belong in the forms domain.
5. Forms v1 will support **one-page** and **multi-step/page** presentation modes.
6. Public forms are required for enrollment and feedback use cases, but must include abuse protection.
7. Authenticated internal forms are also required for staff and student-only workflows.
8. File upload is supported in Forms, but public file upload must be guarded with rate limits and storage controls.
9. Existing exercise question types are reused first; new form-only block types can be added later.
10. The first implementation prioritizes reuse over perfect naming cleanup. Renaming `exercise-question` to a broader package is optional follow-up, not a blocker.

## Core Use Cases

### UC-1: Student Feedback Form

- A school admin creates a feedback form.
- Shares a link after a course/session.
- Students submit ratings, free text, and optional anonymous feedback.
- Admin reviews aggregate charts and individual comments.

### UC-2: Enrollment Form

- A school publishes an enrollment form publicly.
- Parent or student fills out personal data, preferences, and file uploads.
- Staff exports responses or reviews them inside the dashboard.

### UC-3: Internal Review Form

- A school shares a private authenticated form with teachers or staff.
- Respondents can submit once or multiple times depending on settings.
- Admin sees response metadata, completion times, and exports data.

### UC-4: Event Registration

- A team creates a registration form with attendance preferences and contact details.
- Form can close automatically at end date or after a response limit.
- Staff monitors response counts in real time.

## Functional Requirements

### FR-1: Form Lifecycle and Management

Admins can:

1. Create a new form from scratch or from a template.
2. Save a form as draft.
3. Publish a form and generate a shareable URL.
4. Close a form manually or automatically by schedule/limit.
5. Archive a form without deleting responses.
6. Duplicate an existing form.

Each form must support:

- Title
- Description
- Organization ownership
- Status: `DRAFT | PUBLISHED | CLOSED | ARCHIVED`
- Slug/share URL
- Optional start date
- Optional end date
- Optional response limit
- Optional success/thank-you message

### FR-2: Form Builder

Reuse the existing exercise question builder patterns for:

1. Add question
2. Edit question
3. Reorder questions
4. Delete questions
5. Add images and videos to questions
6. Preview form
7. Save changes

Forms-specific builder additions:

1. Mark question as required/optional.
2. Toggle anonymous collection.
3. Choose response mode:
- one page
- one question/page
4. Configure respondent fields:
- collect name
- collect email
- authenticated respondent only
- anonymous allowed
5. Configure submission rules:
- one response per respondent
- multiple responses allowed
- save and continue later (optional)

### FR-3: Sharing and Access

Forms v1 must support two access models:

1. **Public link**
- Anyone with the link can respond.
- Optional CAPTCHA / anti-bot protection.

2. **Authenticated organization form**
- User must sign in.
- Access may be limited to organization members.

Phase 2 access model:

3. **Targeted private form**
- User must sign in and be explicitly assigned or invited.
- Best fit for internal staff/student workflows.

### FR-4: Respondent Experience

Respondents can:

1. Open the form through a share link or internal dashboard link.
2. See form title, description, branding, and instructions.
3. Complete questions across supported question types.
4. Upload files when allowed.
5. Submit the form.
6. See a thank-you screen after successful submission.

Optional v1 capabilities:

- Save draft and resume later for authenticated respondents.
- Edit own response when form setting allows it.

### FR-5: Response Management

Admins can:

1. View all responses for a form.
2. Filter responses by date, completion status, and respondent metadata.
3. Open a single response and inspect answers question-by-question.
4. Export responses to CSV.
5. Delete a response when policy allows it.
6. Close the form to stop new responses while preserving existing ones.

### FR-6: Response Analytics

Reuse and extend the current submission summary patterns to provide:

1. Total responses
2. Response completion rate
3. Response trend over time
4. Per-question aggregates for structured questions
5. Individual response replay for qualitative review

Out of scope for v1:

- AI summarization of comments
- Sentiment analysis
- Cross-form benchmarking

### FR-7: Templates

Forms can be created from templates for common education use cases:

- student feedback
- course review
- enrollment
- parent intake
- event RSVP
- staff request

The existing template machinery should be reused where practical, but forms need their own template taxonomy and defaults.

## Recommended Architecture

### Principle

Reuse the question engine, not the course-bound entities.

### Why not reuse `exercise` and `submission` directly?

Because the current schema and route model are tightly coupled to:

- `courseId`
- `lessonId`
- `sectionId`
- `submittedBy -> groupmember`
- grading state
- score totals
- instructor review workflow
- course membership authorization

Trying to bend those entities into a general forms product will create permanent product and technical debt.

## Technical Design

### 1. Shared Layer to Reuse

These assets should remain shared across Exercises and Forms:

1. `@cio/question-types`
2. `@cio/ui/custom/exercise-question`
3. Answer payload serialization and codecs
4. File-upload answer payload model
5. Question renderer registry
6. Template questionnaire JSON shape
7. Submission summary chart primitives

### 2. New Domain Model

#### 2.1 New `form` table

```sql
CREATE TABLE form (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR NOT NULL DEFAULT 'DRAFT',
  slug VARCHAR NOT NULL,
  access_mode VARCHAR NOT NULL DEFAULT 'PUBLIC',
  response_mode VARCHAR NOT NULL DEFAULT 'ONE_PAGE',
  collect_name BOOLEAN NOT NULL DEFAULT false,
  collect_email BOOLEAN NOT NULL DEFAULT false,
  allow_anonymous BOOLEAN NOT NULL DEFAULT true,
  allow_multiple_responses BOOLEAN NOT NULL DEFAULT true,
  allow_edit_response BOOLEAN NOT NULL DEFAULT false,
  allow_save_draft BOOLEAN NOT NULL DEFAULT false,
  response_limit INTEGER,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  success_message TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  created_by_profile_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, slug)
);
```

#### 2.2 Form questions and options

Recommended v1 approach:

- Create `form_question` and `form_question_option` tables mirroring the current exercise question structure.
- Keep the payload shape aligned with the shared question contracts.
- Do **not** attempt a risky generic cross-product table migration in v1.

Reason:

- It ships faster.
- It avoids destabilizing the existing exercise product.
- It still preserves maximum code reuse at the question-engine layer.

Longer-term option:

- Introduce a generalized `questionnaire`, `questionnaire_question`, and `questionnaire_response` model that both Exercises and Forms can use.

#### 2.3 New `form_response` table

```sql
CREATE TABLE form_response (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES form(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  respondent_profile_id UUID,
  respondent_email VARCHAR,
  respondent_name VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'SUBMITTED',
  source VARCHAR DEFAULT 'link',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'
);
```

#### 2.4 New `form_response_answer` table

```sql
CREATE TABLE form_response_answer (
  id BIGSERIAL PRIMARY KEY,
  form_response_id UUID NOT NULL REFERENCES form_response(id) ON DELETE CASCADE,
  form_question_id BIGINT NOT NULL REFERENCES form_question(id) ON DELETE CASCADE,
  answer_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3. API Surface

New org-level routes should be introduced rather than extending course exercise routes:

- `GET /organization/:orgId/forms`
- `POST /organization/:orgId/forms`
- `GET /organization/:orgId/forms/:formId`
- `PUT /organization/:orgId/forms/:formId`
- `POST /organization/:orgId/forms/:formId/publish`
- `POST /organization/:orgId/forms/:formId/close`
- `GET /organization/:orgId/forms/:formId/responses`
- `GET /organization/:orgId/forms/:formId/responses/:responseId`
- `GET /forms/:slug`
- `POST /forms/:slug/respond`

Optional authenticated draft routes:

- `POST /forms/:slug/draft`
- `PUT /forms/:slug/draft/:draftId`

### 4. Dashboard Experience

#### 4.1 Admin UI

New dashboard areas:

1. Forms list page
2. Form builder page
3. Form response inbox
4. Form analytics page
5. Form settings/share page

#### 4.2 Respondent UI

New public/internal form runner:

1. Load form by slug or secure token
2. Render via shared question components in `take` mode
3. Submit to forms response endpoint
4. Show thank-you state

### 5. Security and Abuse Controls

Public forms introduce risks the exercise system does not currently have.

Forms v1 must include:

1. Rate limiting on public submit endpoints.
2. Bot protection on public forms.
3. File upload limits by size/type/count.
4. Optional authenticated-only setting.
5. Slug collision prevention.
6. Safe export permissions restricted to authorized org users.

### 6. Reporting and Export

CSV export must include:

- response id
- submitted at
- respondent metadata
- one column per question
- file upload URLs or file identifiers

The dashboard must also support:

- total responses
- incomplete vs submitted
- per-question breakdown
- individual response view

## Migration and Reuse Strategy

### Phase 0: Shared Abstractions Cleanup

Low-risk cleanup before or during build:

1. Confirm shared packages remain exercise-agnostic in behavior.
2. Remove assumptions that all respondents are students.
3. Allow shared labels to accept forms-specific copy.
4. Extract any builder logic that currently depends on course page state.

### Phase 1: Forms MVP

Ship:

1. Form CRUD
2. Draft/publish/close lifecycle
3. Public and authenticated forms
4. Shared question renderer reuse
5. Response collection
6. Response inbox
7. CSV export
8. Basic analytics

### Phase 2: Education Workflow Expansion

Add:

1. Templates for common school forms
2. Save-and-resume drafts
3. Edit submitted response
4. Section/page builder
5. Invite-only forms
6. Better branding and embed support

### Phase 3: Advanced Forms

Add:

1. Conditional logic
2. Hidden fields and prefill
3. Webhooks/integrations
4. AI summaries
5. Approval workflows

## Delivery Estimate

### Team Assumption

- 2 full-stack engineers
- 1 product designer shared part-time
- QA support during stabilization

### Rough Timeline

1. **Foundation and schema**: 1-2 weeks
2. **Builder and shared renderer integration**: 2-3 weeks
3. **Public/internal form runner and submission flow**: 2 weeks
4. **Response inbox, analytics, export**: 2 weeks
5. **Polish, abuse controls, QA, rollout**: 1-2 weeks

### Total

- **8-11 weeks** for a strong MVP
- **12-16 weeks** if v1 also includes save/resume, response editing, sections, and invite-only targeting

## Key Risks

1. **Direct schema reuse temptation**
- Reusing `exercise` and `submission` directly will look faster initially but create major long-term coupling and UX compromises.

2. **Public file upload abuse**
- This needs careful limits and monitoring from day one.

3. **Shared package naming drift**
- The code can stay shared even if names remain exercise-centric for now, but this will become awkward if Forms grows quickly.

4. **Builder assumptions**
- Some existing builder state is currently tied to course/exercise pages and will need extraction.

5. **Reporting expectations**
- Users comparing the product to Google Forms or Typeform will expect polished analytics and exports even in early versions.

## Open Questions

1. Should public forms support anonymous file uploads in v1, or should file upload require authentication first?
2. Do schools need one-response-per-email enforcement for public forms?
3. Should forms live only under organizations, or also under public site/subdomain contexts?
4. Is section/page support mandatory for MVP, or acceptable in phase 2?
5. Do we need respondent notification emails on submit in v1?
6. Do we need staff assignment/routing after submission, or is inbox + export enough for MVP?

## Success Metrics

1. At least 3 high-value school workflows can be completed without abusing exercises as forms.
2. Form creation to publish time is under 10 minutes for common templates.
3. Public form submission success rate stays above 98%.
4. At least 70% of question rendering code is shared with the exercise product.
5. Zero regressions in exercise creation, submission, and grading flows.

## Bottom Line

It is realistic to build a strong Forms product on top of the current exercise implementation, but only if the reuse happens at the **question engine layer**, not by forcing form workflows into the existing course exercise and grading model.

The existing investment already removed the hardest part, which is rich question rendering and answer modeling. What remains is the product work that makes something feel like Google Forms or Typeform: publishing, sharing, respondent identity, response management, analytics, and public-safe submission infrastructure.
