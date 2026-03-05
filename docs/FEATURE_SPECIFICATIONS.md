# ClassroomIO: Deep Feature Specifications (Non-Payment)

This document provides detailed specifications for features needed to compete with Teachable and Thinkific. **Payment processing is explicitly out of scope**—these features work with your existing external payment links and invite flows.

---

## Table of Contents

1. [Drip Content / Scheduled Release](#1-drip-content--scheduled-release)
2. [Coupon Codes](#2-coupon-codes)
3. [Course Bundles](#3-course-bundles)
4. [Forms (Pre-Enrollment)](#4-forms-pre-enrollment)
5. [Course Templates / Cloning](#5-course-templates--cloning)
6. [Affiliate Program](#6-affiliate-program)
7. [Analytics Dashboard Expansion](#7-analytics-dashboard-expansion)
8. [Live Lessons / Webinars](#8-live-lessons--webinars)
9. [Messenger Delivery](#9-messenger-delivery)
10. [Course Batches (Cohorts)](#10-course-batches-cohorts)
11. [Pathways](#11-pathways)
12. [Tags & Organization](#12-tags--organization)

---

## 1. Drip Content / Scheduled Release

### Why It Matters

Teachable and Thinkific both offer drip content. For cohort-style courses, bootcamps, and evergreen courses, educators need to control *when* students see content—not everything at once.

### Use Cases

- **Cohort course:** Week 1 = Module 1, Week 2 = Module 2, etc.
- **Evergreen:** Unlock Lesson 2 only after completing Lesson 1.
- **Scheduled:** "This lesson goes live on March 15th."
- **Days from enroll:** "Unlock 3 days after enrollment."

### Current State

- `lesson.isUnlocked` (boolean) exists but is static—no dynamic logic.
- `exercise.isUnlocked` exists, `exercise.dueBy` exists.
- `getCourseContentItems` in `packages/db/src/queries/course/content.ts` returns `isUnlocked` from DB.
- `groupmember.createdAt` = enrollment date (when student joined group).

### Data Model Changes

**Option A: Lesson-level metadata (simplest)**

Add to `lesson` table or `course.metadata`:

```sql
-- Add to lesson table
unlock_rule TEXT DEFAULT 'IMMEDIATE',  -- IMMEDIATE | AFTER_PREVIOUS | AFTER_DATE | AFTER_DAYS_ENROLL
unlock_after_lesson_id UUID REFERENCES lesson(id),  -- for AFTER_PREVIOUS
unlock_at TIMESTAMPTZ,  -- for AFTER_DATE
unlock_after_days INTEGER  -- for AFTER_DAYS_ENROLL
```

**Option B: Course-level config + lesson overrides**

Store in `course.metadata`:

```json
{
  "dripConfig": {
    "defaultRule": "IMMEDIATE",
    "lessons": {
      "<lessonId>": {
        "rule": "AFTER_PREVIOUS",
        "unlockAt": "2025-03-15T00:00:00Z",
        "unlockAfterDays": 3
      }
    }
  }
}
```

### Logic Flow

1. **IMMEDIATE:** Always unlocked (default).
2. **AFTER_PREVIOUS:** Unlock when previous lesson (or section) is completed. Use `lessonCompletion` + `lesson.order` to determine "previous."
3. **AFTER_DATE:** Unlock when `now() >= unlockAt` (timezone-aware).
4. **AFTER_DAYS_ENROLL:** Unlock when `groupmember.createdAt + N days <= now()`.

### Implementation Points

| Layer | File / Location | Change |
|-------|-----------------|--------|
| Schema | `packages/db/src/schema.ts` | Add columns to `lesson` or extend `course.metadata` |
| Migration | `packages/db/src/migrations/` | New migration |
| Query | `packages/db/src/queries/course/content.ts` | Replace static `is_unlocked` with computed `isUnlocked` based on rule + profileId |
| Service | `apps/api/src/services/lesson/` | Add `computeLessonUnlockStatus(courseId, lessonId, profileId)` |
| Dashboard | Lesson settings UI | Add unlock rule selector (dropdown + date picker / days input) |
| Course-app | Lesson render | Already uses `isUnlocked`; ensure locked lessons show "Available on X" or "Complete previous lesson" |

### UI for Educators

- In lesson edit: "Unlock rule" dropdown: Immediate | After previous lesson | On date | X days after enrollment.
- If "On date": date/time picker.
- If "X days after enrollment": number input.

### Edge Cases

- Section-level unlock: Unlock entire section when previous section is complete. Could add `course_section.unlock_rule` later.
- Exercises: Same rules could apply—reuse logic.

---

## 2. Coupon Codes

### Why It Matters

Educators run launches, early-bird discounts, partner deals. Code-based coupons (e.g. `LAUNCH50`, `PARTNER20`) are standard. You already have percentage discount in pricing form—coupons add codes and finer control.

### Use Cases

- Launch: `EARLYBIRD` = 50% off, expires in 7 days.
- Partner: `ACME20` = 20% off, max 100 uses.
- Single-use: Unique code per student (e.g. scholarship).

### Current State

- `course.metadata.discount` + `showDiscount` = global % discount.
- No per-code tracking; payment happens externally. Coupon validation would need to happen at enrollment time: **apply code → get discounted enrollment or auto-enroll if code grants access**.

### How Coupons Work Without Payment Processing

**Flow:** Student enters code on enrollment page → validate code → if valid, either:
- Generate a special invite link that auto-enrolls them, or
- Show discounted price + custom payment link (you’d pass code to external system), or
- For 100% off: auto-enroll immediately (no payment).

So you can support:
1. **100% discount codes** → auto-enroll (no payment).
2. **Partial discount codes** → store code with enrollment, educator uses it in external payment flow (Stripe/LS coupon), or you show custom link.
3. **Usage tracking** → increment `usedCount` when code is applied.

### Data Model

```sql
CREATE TABLE coupon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organization(id),
  code VARCHAR(50) NOT NULL,  -- e.g. LAUNCH50
  discount_type VARCHAR(20) NOT NULL,  -- PERCENT | FIXED
  discount_value NUMERIC NOT NULL,  -- 50 or 25.00
  max_uses INTEGER,  -- NULL = unlimited
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by_profile_id UUID REFERENCES profile(id),
  UNIQUE(course_id, code)
);
```

Or store in `course.metadata.coupons` as array if you prefer schema-less.

### API / Service

- `POST /course/:courseId/coupon` – create coupon.
- `GET /course/:courseId/coupons` – list coupons.
- `POST /course/:courseId/validate-coupon` – validate code, return `{ valid, discountType, discountValue }` (and optionally create invite for 100% off).
- On enrollment with valid 100% coupon: create groupmember, increment `used_count`.

### UI

- **Dashboard:** Course settings → Coupons tab. Table of codes, discount, uses, expiry. Add/edit/revoke.
- **Enrollment page:** Code input field. On blur or submit, call validate; show discount or "Invalid/expired."

### Implementation Order

1. Schema (table or metadata).
2. Validate endpoint + service.
3. Enrollment flow: accept code param, validate, apply 100% → auto-enroll.
4. Dashboard CRUD for coupons.
5. Partial discount: show adjusted price + pass code to payment link (e.g. as query param for Stripe).

---

## 3. Course Bundles

### Why It Matters

Selling multiple courses as one package (e.g. "Full Stack Bootcamp" = Course A + B + C) is common. Access control is the main piece; pricing can stay external.

### Use Cases

- Bundle "Intro + Advanced" at a single price.
- Student buys bundle externally → gets access to all courses.
- Enroll in bundle = add to all course groups.

### Data Model

```sql
CREATE TABLE course_bundle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id),
  title VARCHAR NOT NULL,
  slug VARCHAR UNIQUE,
  description TEXT,
  course_ids UUID[] NOT NULL,  -- ordered list of course IDs
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bundle enrollment: when user "buys" bundle, we add them to each course's group
-- groupmember already exists per course (course.groupId). No new table if we treat
-- bundle enrollment as "add to all groups for these courses."
```

### Flow

1. Educator creates bundle: selects courses, sets title/description.
2. Educator creates external payment link for bundle (or manual enrollment).
3. On "bundle enrollment" (webhook from payment or manual): for each course in bundle, add user to that course’s group (reuse existing `addMemberToCourse`).

### Implementation

- **Schema:** `course_bundle` table.
- **API:** CRUD for bundles. `POST /bundle/:bundleId/enroll` – add profile to all course groups.
- **Dashboard:** Bundles list/create/edit. "Enroll" button that calls enroll endpoint (for manual or post-payment).
- **Landing page:** Optional bundle landing page showing included courses.

### Edge Cases

- User already in one course: still add to others, don’t error.
- Bundle update (add/remove course): existing enrollments keep current access; new enrollments use new list.

---

## 4. Forms (Pre-Enrollment)

### Why It Matters

From roadmap. Replace Google Forms for applications, intake, surveys. Collect data before or during enrollment.

### Use Cases

- Application: "Why do you want to join? What's your experience?"
- Pre-course survey: "What do you hope to learn?"
- Intake: Name, phone, timezone, etc.

### Data Model

```sql
CREATE TABLE form (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id),
  course_id UUID REFERENCES course(id),  -- optional, if form is course-specific
  title VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE form_field (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES form(id) ON DELETE CASCADE,
  label VARCHAR NOT NULL,
  field_type VARCHAR(50) NOT NULL,  -- text | textarea | select | checkbox | radio | email | number
  required BOOLEAN DEFAULT true,
  options JSONB,  -- for select/radio/checkbox: ["Option A", "Option B"]
  "order" INTEGER DEFAULT 0
);

CREATE TABLE form_submission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES form(id),
  profile_id UUID REFERENCES profile(id),
  groupmember_id UUID REFERENCES groupmember(id),
  data JSONB NOT NULL,  -- { fieldId: value, ... }
  submitted_at TIMESTAMPTZ DEFAULT now()
);
```

### Flow

1. Educator creates form, adds fields.
2. Form can be linked to course (e.g. show on enrollment page) or standalone.
3. Student fills form; submission stored. If linked to course, can associate with `groupmember_id` after enroll.

### UI

- Form builder: drag-and-drop or list of fields. Field types: text, textarea, select, checkbox, radio, email, number.
- Form embed: Public form page or embed in course landing.
- Submissions: View submissions per form, export CSV.

### Implementation Order

1. Schema.
2. Form CRUD API.
3. Form builder UI.
4. Public form page + submit API.
5. Submissions list + export.
6. Optional: embed form on course enrollment page.

---

## 5. Course Templates / Cloning

### Why It Matters

From roadmap. Clone a course to create a new cohort or variant without rebuilding.

### Current State

- `course.isTemplate` exists but usage unclear.
- No clone endpoint.

### Data Model

No new tables. Cloning = copy:

- `course` (new id, new slug, reset published state, etc.)
- `course_section`
- `lesson`
- `exercise`
- `question`
- `lesson_language`
- New `group` for the cloned course

### Logic

1. Copy course row (new id, slug like `original-slug-copy-1`).
2. Copy sections, lessons, exercises, questions, lesson_language.
3. Create new group, attach to new course.
4. Don’t copy: groupmembers, submissions, invites, lesson_completion.

### API

```
POST /course/:courseId/clone
Body: { title?: string, slug?: string }
Response: { id, slug, ... } (new course)
```

### UI

- Course card or course menu: "Clone course" → modal with optional new title/slug → create.

### Implementation Order

1. Service: `cloneCourse(courseId, options)`.
2. API route.
3. Dashboard button + modal.

---

## 6. Affiliate Program

### Why It Matters

Creators use affiliates to drive sales. You track referrals; payout stays external.

### Use Cases

- Affiliate shares link with ref code.
- New student enrolls via that link.
- You record: this enrollment came from affiliate X.
- Educator uses your data for their own payouts (or future integration).

### Data Model

```sql
CREATE TABLE affiliate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id),
  profile_id UUID NOT NULL REFERENCES profile(id),
  code VARCHAR(50) NOT NULL UNIQUE,  -- e.g. JOHN2025
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE affiliate_click (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate(id),
  course_id UUID REFERENCES course(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  clicked_at TIMESTAMPTZ DEFAULT now()
);

-- Track conversion: when a groupmember is created, if they came from affiliate link
ALTER TABLE groupmember ADD COLUMN referred_by_affiliate_id UUID REFERENCES affiliate(id);
-- Or: separate conversion table
CREATE TABLE affiliate_conversion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate(id),
  groupmember_id UUID NOT NULL REFERENCES groupmember(id),
  course_id UUID NOT NULL REFERENCES course(id),
  converted_at TIMESTAMPTZ DEFAULT now()
);
```

### Flow

1. Affiliate signs up → gets unique code.
2. Share link: `course/xyz/enroll?ref=JOHN2025`.
3. On page load with `ref`: store click (affiliate_id, course_id, ip, etc.).
4. On enrollment: if session/cookie has `ref`, create `affiliate_conversion`.
5. Dashboard: Affiliates tab with clicks, conversions, conversion rate.

### UI

- Affiliates: List, add, view stats (clicks, conversions).
- Affiliate dashboard (simple): "Your link: ...?ref=JOHN2025", "Your conversions: X."

### Implementation Order

1. Schema.
2. Click tracking (middleware or enrollment page).
3. Conversion tracking on enrollment.
4. Dashboard: affiliates CRUD + stats.
5. Optional: public affiliate signup page.

---

## 7. Analytics Dashboard Expansion

### Current State

- `packages/db/src/queries/analytics/analytics.ts`: `getUserExercisesStats`, `getLessonsWithCompletion`, `getProfileCourseProgress`.
- Dashboard: `course/[id]/analytics` – total students, lessons, progress %, exercise completion, student table.

### Gaps vs Teachable/Thinkific

- Time-series: enrollment over time, completion over time.
- Lesson-level: which lessons have lowest completion.
- Engagement: time spent per lesson (if you start tracking).
- Org-level: aggregate across all courses.
- Export: CSV of student progress.

### Additions

| Metric | Source | Effort |
|--------|--------|--------|
| Enrollment over time | `groupmember.createdAt` grouped by date | Low |
| Completion over time | `lesson_completion`, `submission` grouped by date | Low |
| Lesson completion rate per lesson | `lesson_completion` / total students | Low |
| Drop-off: last lesson accessed | Max `lesson_completion.updatedAt` or similar | Medium |
| Org-wide stats | Aggregate across org’s courses | Medium |
| CSV export | Reuse student table data, add export button | Low |

### Implementation

- New queries in `packages/db/src/queries/analytics/`.
- New charts in dashboard (reuse `analytics-graph.svelte` pattern).
- Export: `GET /course/:id/analytics/export?format=csv`.

---

## 8. Live Lessons / Webinars

### Why It Matters

Teachable/Thinkific support live sessions. You have `lesson.callUrl` and `lesson.lessonAt`—partially there.

### Current State

- `lesson.callUrl` – URL for call.
- `lesson.lessonAt` – timestamp.
- `lesson` is already structured for "scheduled" lessons.

### Gaps

- No Zoom/Streamyard/Meet integration (one-click create).
- No "join live" CTA when `lessonAt` is near.
- No recording attachment (post-live).

### Minimal Additions

1. **Dashboard:** In lesson edit, "Live session" toggle. Set `callUrl`, `lessonAt`. Optional: "Add Zoom link" that opens Zoom OAuth or manual paste.
2. **Course-app:** When `lessonAt` is within 24h and `callUrl` exists, show "Join live" button.
3. **Recording:** Add `lesson.recordingUrl` or in `metadata` to attach recording after live.

### Implementation Order

1. Ensure `callUrl` + `lessonAt` are prominent in lesson editor.
2. Course-app: "Join live" banner when applicable.
3. Optional: Zoom/Meet link helper (paste or OAuth).

---

## 9. Messenger Delivery

### Why It Matters

From roadmap. "Run courses on Slack/Discord/Telegram" is differentiated.

### Flow

1. Educator connects workspace (Slack/Discord/Telegram) via OAuth.
2. Maps channel to course (or cohort).
3. Bot sends daily lesson content to channel.
4. Students consume in messenger; optional link back to dashboard for full experience.

### Components

- **OAuth:** Slack/Discord/Telegram app, store tokens per org.
- **Bot:** Fetches course content (next lesson), posts to channel.
- **Scheduler:** Cron or queue to run "send daily lesson" job.
- **Config UI:** "Connect Slack" → select channel → select course → enable.

### Data Model

```sql
CREATE TABLE messenger_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id),
  provider VARCHAR(20) NOT NULL,  -- slack | discord | telegram
  access_token TEXT,
  channel_id VARCHAR(255),
  course_id UUID REFERENCES course(id),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Effort

High—OAuth, bot logic, hosting. Recommend as later phase.

---

## 10. Course Batches (Cohorts)

### Why It Matters

From roadmap. One course, multiple cohorts (e.g. "Jan 2025 cohort", "Feb 2025 cohort"). Drip can be cohort-start relative.

### Data Model

```sql
CREATE TABLE course_batch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES course(id),
  name VARCHAR NOT NULL,  -- e.g. "January 2025"
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- group is 1:1 with course today. Option: group per batch?
-- Or: add batch_id to groupmember, group stays per course.
ALTER TABLE groupmember ADD COLUMN batch_id UUID REFERENCES course_batch(id);
-- But then one group or multiple? Multiple groups per course = one per batch.
-- Simpler: course has multiple groups (one per batch). Add batch_id to group.
ALTER TABLE "group" ADD COLUMN batch_id UUID REFERENCES course_batch(id);
```

### Flow

- Create batch → create new group for that batch → students enroll into batch-specific group.
- Drip "X days after enroll" = days after batch start (or enrollment date).
- Analytics: filter by batch.

### Effort

Medium–high. Touches enrollment, group, analytics. Best after drip content.

---

## 11. Pathways

### Why It Matters

From roadmap. Group courses into a path (e.g. "Full Stack Path" = Course 1 → 2 → 3). Certificate at end of path.

### Data Model

```sql
CREATE TABLE pathway (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id),
  title VARCHAR NOT NULL,
  description TEXT,
  course_ids UUID[] NOT NULL,  -- ordered
  certificate_template_id UUID,  -- optional
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pathway completion: when student completed all courses in path
CREATE TABLE pathway_completion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id UUID NOT NULL REFERENCES pathway(id),
  profile_id UUID NOT NULL REFERENCES profile(id),
  completed_at TIMESTAMPTZ DEFAULT now()
);
```

### Logic

- Student completes all courses in path (check groupmember + lesson_completion for each).
- Award pathway certificate (reuse certificate flow).
- Pathway landing page: list courses, progress.

### Effort

Medium. Build after course bundles (similar grouping concept).

---

## 12. Tags & Organization

### Why It Matters

From roadmap. Organize courses with tags (e.g. "Beginner", "React", "2025").

### Data Model

```sql
CREATE TABLE tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id),
  name VARCHAR NOT NULL,
  color VARCHAR(7),  -- hex for UI
  UNIQUE(organization_id, name)
);

CREATE TABLE course_tag (
  course_id UUID NOT NULL REFERENCES course(id),
  tag_id UUID NOT NULL REFERENCES tag(id),
  PRIMARY KEY (course_id, tag_id)
);
```

### UI

- Tag management: create/edit/delete tags.
- Course edit: multi-select tags.
- Course list: filter by tag.
- Course landing: display tags.

### Effort

Low.

---

## Prioritization Summary

| Priority | Feature | Effort | Dependencies |
|----------|---------|--------|--------------|
| P0 | Drip content | Medium | None |
| P0 | Coupon codes | Low–Medium | None |
| P1 | Course cloning | Low | None |
| P1 | Forms | Medium | None |
| P1 | Analytics expansion | Low | None |
| P2 | Course bundles | Medium | None |
| P2 | Affiliate program | Medium | None |
| P2 | Tags | Low | None |
| P3 | Live lessons polish | Low | None |
| P3 | Course batches | High | Drip content |
| P3 | Pathways | Medium | Bundles |
| P4 | Messenger delivery | High | None |

---

*Document for pricing-feature-competitive-strategy. Payment processing excluded per scope.*
