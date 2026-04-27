# Compliance Course Type PRD

## Status
- Draft

## Date
- February 21, 2026 (updated April 11, 2026)

## Purpose
Add a `COMPLIANCE` course type to ClassroomIO for courses that must be retaken after a given period. This targets organizations in regulated industries (healthcare, finance, manufacturing, government) that need recurring training with automated renewal, reminders, and compliance status tracking.

> **Scope**: This PRD covers the `COMPLIANCE` course type only — retake intervals, completion validity, automatic re-enrollment, reminders, certificates, and dashboards. Programs already exist in the app and are out of scope. Policy attestation, audit trails, and HRIS integrations are separate efforts.

---

## 1. Executive Summary

### The Problem
Companies in regulated industries need courses that employees must retake periodically. Today, ClassroomIO courses are one-and-done — there's no way to say "this HIPAA course must be retaken every 12 months" and have the system enforce it.

### Target Customers
| Industry | Example Use Cases |
|----------|-------------------|
| Healthcare | HIPAA training, patient safety, infection control |
| Financial Services | Anti-money laundering, fraud prevention, data privacy |
| Manufacturing | OSHA safety, quality control (ISO), hazardous materials |
| Government | Security clearance, ethics training, procurement rules |
| Education | FERPA, Title IX, campus safety |
| Retail/Hospitality | Food safety, anti-harassment, PCI-DSS |

### Solution
A third course type — `COMPLIANCE` — that carries retake settings directly on the course. When a learner completes it, their completion is valid for N months. When it expires, they're automatically re-enrolled. The system sends reminders before deadlines and tracks compliance status per learner.

---

## 2. Current State

### What Already Exists
| Feature | Current State |
|---------|--------------|
| Course Types | `LIVE_CLASS` and `SELF_PACED` — no recurring/retake support |
| Programs | Already implemented — can group courses together |
| Assessments | Exercises with auto-grading for self-paced courses |
| Certificates | PDF generation with themes, thresholds, and deadlines |
| User Management | Invite students, track progress per course |

### What's Missing
| Gap | Impact |
|-----|--------|
| No `COMPLIANCE` course type | Can't model courses that need periodic retaking |
| No completion validity window | Completions are permanent — no expiry |
| No automatic re-enrollment | Admins must manually re-invite learners |
| No compliance status tracking | No way to see who is compliant vs overdue |
| No retake reminders | Manual follow-up is unsustainable at scale |

---

## 3. Feature Requirements

### 3.1 COMPLIANCE Course Type

#### Purpose
Add `COMPLIANCE` to the `COURSE_TYPE` enum. A compliance course behaves like a self-paced course for content delivery but carries retake settings that drive automatic re-enrollment and compliance tracking.

#### Requirements

**CCT-1: Course Type Enum Extension**
- Add `COMPLIANCE` to the `COURSE_TYPE` PostgreSQL enum: `['SELF_PACED', 'LIVE_CLASS', 'COMPLIANCE']`
- Compliance courses behave like self-paced courses for content delivery (lessons, exercises, grading) but carry additional retake/renewal configuration
- All existing course features (content editor, assessments, certificates, invites) work unchanged

**CCT-2: Compliance Settings (per course)**
When a course is created or updated with type `COMPLIANCE`, the following settings are available via a new `compliance` JSONB column:

| Setting | Type | Required | Default | Description |
|---------|------|----------|---------|-------------|
| `retakeIntervalMonths` | integer | Yes | — | Months after completion before the course must be retaken. Common: 3, 6, 12, 24 |
| `gracePeriodDays` | integer | — | `0` | Additional days after the retake deadline before marking non-compliant |
| `reminderDaysBefore` | integer[] | — | `[30, 7, 1]` | Days before retake deadline to send reminder notifications |
| `isMandatory` | boolean | — | `true` | Whether the course is mandatory for all assigned learners |
| `framework` | string | — | `null` | Regulatory framework tag: `HIPAA`, `OSHA`, `SOX`, `GDPR`, `PCI_DSS`, `FERPA`, `ISO`, `CUSTOM` |
| `maxRetakeAttempts` | integer \| null | — | `null` | Max attempts per retake cycle. `null` = unlimited |
| `passingScore` | integer | — | `80` | Minimum score (0–100) to count as a valid completion |

**CCT-3: Due Date Ownership**
- The initial `dueDate` for cycle 1 is set by the course admin/teacher when learners are assigned or enrolled into a compliance course
- `dueDate` is the operational deadline used for reminder scheduling, grace period handling, extensions, and overdue status
- For renewal cycles, the system automatically creates the next cycle with `dueDate = validUntil` from the previous compliant cycle
- Admin actions such as extend or reset may override the current cycle's `dueDate`

**CCT-4: Completion Validity Window**
- When a learner completes a compliance course, their completion is valid for `retakeIntervalMonths` months
- `validUntil` = `completedAt` + `retakeIntervalMonths`
- `validUntil` is the date that triggers renewal into the next cycle
- The system tracks this validity window per learner per course in the `course_completion_record` table
- A valid completion satisfies compliance; an expired completion does not

**CCT-5: Retake Lifecycle**
A learner's relationship to a compliance course follows this cycle:

```
Cycle 1 created → Not Started → In Progress → Completed (Compliant)
                                               ↓
                             [validUntil reaches current date]
                                               ↓
                         Cycle 2 created automatically as new active cycle
                                               ↓
       Not Started → Expiring Soon → In Grace Period → Non-Compliant → Completed
```

- There is exactly one active cycle per learner per compliance course
- The active cycle owns the learner's current `status`, `dueDate`, reminder schedule, and overdue state
- When a learner completes a cycle, that cycle becomes historical and remains visible in history
- When `validUntil` is reached, the system creates the next cycle as the new active record with status `not_started`
- The previous cycle is preserved for audit/history and is no longer used as the source of current reminder or overdue state

**CCT-6: Compliance Status per Learner**
Each learner enrolled in a compliance course has one of these statuses (tracked on `course_completion_record`):

| Status | Condition |
|--------|-----------|
| `not_started` | Enrolled but hasn't begun |
| `in_progress` | Started but not yet completed/passed |
| `compliant` | Completed within validity window |
| `expiring_soon` | Within the earliest reminder window (e.g., 30 days before expiry) |
| `in_grace_period` | Past expiry date but within grace period |
| `non_compliant` | Past expiry + grace period with no valid completion |
| `waived` | Exempted by admin (with reason and optional expiration) |

**CCT-7: Automatic Re-enrollment**
- When a learner's completion validity expires, the system automatically creates a new completion record with status `not_started` and a new `dueDate`
- Previous completions are preserved in history (never deleted)
- The learner sees the course reappear in their "Due" list
- A background job (`compliance-expiry-checker`) runs daily to process expirations

**CCT-8: Completion Rule**
- Compliance completion is determined by the course completion rule, not by any single passing submission in isolation
- For v1, a compliance cycle is complete when the learner satisfies the course's configured completion requirements and achieves `passingScore` on the designated final assessment for the cycle
- Submission and lesson events may trigger a re-check, but a centralized compliance completion service decides whether the cycle becomes `compliant`
- If below `passingScore` and `maxRetakeAttempts` is not reached, the learner may retry

**CCT-9: Auto-grading Behavior**
- Like `SELF_PACED` courses, `COMPLIANCE` courses auto-grade submissions when all questions are auto-gradable
- Auto-graded results feed into the centralized compliance completion evaluation
- Manually graded assessments may also complete the cycle once grading is finished and the completion rule is satisfied

---

### 3.2 Notifications & Reminders

#### Purpose
Automatically remind learners before their compliance course deadlines and notify admins about overdue learners.

#### Requirements

**NR-1: Learner Reminders**
- Send reminders at each interval defined in `reminderDaysBefore` (e.g., 30, 7, 1 days before due)
- Email includes: course name, due date, current progress, direct link to course
- In-app notification badge on the course card

**NR-2: Admin Alerts**
- Notify course admins when learners become overdue (transition to `non_compliant`)
- Daily digest option: summary of all overdue learners across compliance courses in the org

**NR-3: Completion Confirmation**
- Email + in-app notification when a learner completes a compliance course
- Include: course name, score, "compliant until" date, certificate download link (if applicable)

**NR-4: Renewal Notification**
- When a new retake cycle is created (automatic re-enrollment), notify the learner
- Email includes: course name, new due date, link to start

**NR-5: Notification Idempotency**
- Reminder and alert delivery is persisted per cycle so scheduled jobs can be re-run safely
- The system records reminder events such as `reminder_30d`, `reminder_7d`, `reminder_1d`, `renewal_created`, and `became_non_compliant`
- A given reminder or alert may be sent at most once per cycle per channel unless an admin explicitly triggers a manual resend

> **Note**: The notification system PRD (`prd/notification-system`) covers the general delivery infrastructure (templates, channels, preferences). This section only defines the compliance-specific triggers.

---

### 3.3 Certificate Lifecycle for Compliance Courses

#### Purpose
Certificates issued for compliance courses should carry an expiration date matching the completion validity window, and be re-issued on each retake cycle.

#### Requirements

**CL-1: Certificate Expiration**
- When a compliance course has certificates enabled, the issued certificate includes an `expiresAt` date equal to the completion's `validUntil`
- Certificate status follows the completion record: valid → expiring soon → expired

**CL-2: Certificate Re-issuance**
- Each successful retake cycle issues a new certificate
- Previous certificates are preserved in history with status `renewed`
- Learner can view/download all historical certificates

**CL-3: Certificate Display**
- Certificate PDF shows: completion date, expiration date, cycle number, framework tag (if set)
- Certificate list view in dashboard shows validity status badge (valid/expiring/expired)

**CL-4: Certificate Persistence**
- Compliance certificates are stored per cycle in a dedicated issuance table linked to `course_completion_record`
- Each issuance stores `issuedAt`, `expiresAt`, `status`, and the associated `cycleNumber`
- The existing course-level certificate settings remain the configuration source, but per-cycle issuance history is persisted separately so learners and admins can view all historical certificates

---

### 3.4 Compliance Dashboard

#### Purpose
Give course admins visibility into who is compliant, who is expiring, and who is overdue — per compliance course.

#### Requirements

**CD-1: Course-Level Compliance Overview**
Available on the course management page for any `COMPLIANCE` type course:
- Summary stats: total enrolled, compliant, expiring soon, in grace period, non-compliant, waived
- Compliance rate percentage (compliant / total)
- Learner table with: name, status, due date, last completed date, score, cycle number

**CD-2: Status Filters & Sorting**
- Filter learners by compliance status
- Sort by: due date (soonest first), status severity, name
- Search by learner name or email

**CD-3: Bulk Admin Actions**
- Bulk waive selected learners (with reason and optional expiry)
- Bulk extend due dates
- Bulk force re-enrollment (reset cycle)
- Export learner compliance data as CSV

**CD-4: Org-Level Compliance Summary**
On the organization dashboard, show a summary card for compliance courses:
- Count of compliance courses in the org
- Overall compliance rate across all compliance courses
- Number of overdue learners (link to drill down)

---

## 4. User Experience Flows

### 4.1 Admin: Creating a Compliance Course

```
1. Click "New Course" → Select type: "Compliance"
   ↓
2. Fill in title, description (same as any course)
   ↓
3. Compliance settings panel appears:
   - Retake interval: [12] months  (dropdown: 3, 6, 12, 18, 24, custom)
   - Framework: [HIPAA] (optional dropdown)
   - Passing score: [80]%
   - Grace period: [14] days
   - Reminders: [30, 7, 1] days before due
   ↓
4. Add content: lessons, exercises, assessments (same as self-paced)
   ↓
5. Configure certificate (optional, same as today but will auto-expire)
   ↓
6. Publish course → Invite/enroll learners
```

### 4.2 Student: Taking a Compliance Course (First Time)

```
1. Receive invite / see course in dashboard
   - Course card shows: compliance badge, framework tag, "Due by [date]"
   ↓
2. Open course → See banner: "Required: Complete by [date]"
   ↓
3. Work through lessons and exercises (same as self-paced)
   ↓
4. Complete final assessment
   - Score >= passing score → "Compliant until [date]" confirmation
   - Score < passing score → "You need [X]% to pass. [N] attempts remaining."
   ↓
5. Receive confirmation email + certificate (if enabled)
   ↓
6. Course card updates: green "Compliant" badge, "Valid until [date]"
```

### 4.3 Student: The Renewal Cycle

```
1. [30 days before expiry] Receive reminder email:
   "Your HIPAA Compliance certification expires on [date]. Retake the course to stay compliant."
   - Course card turns yellow: "Expiring Soon"
   ↓
2. [7 days before] Second reminder
   ↓
3. [1 day before] Final reminder
   ↓
4. [Expiry date] If not completed:
   - Course card turns orange: "In Grace Period" (if grace period > 0)
   - OR red: "Non-Compliant" (if no grace period)
   ↓
5. Student clicks the same course → Sees the active cycle plus prior cycle history:
   - This is not a separate course and not a course-switcher in nav
   - The learner stays in the same course shell and sees a "Current Cycle" panel plus a "Past Cycles" history list
   "Cycle 1: Completed Jan 2025 (Score: 92%) — Expired"
   "Cycle 2: Due by Jan 2026 — [Start Retake]"
   ↓
6. Completes retake → New certificate issued → Back to "Compliant"
```

### 4.4 Admin: Monitoring Compliance

```
1. Open compliance course → "Compliance" tab in course management
   ↓
2. See dashboard: 85% compliant, 10% expiring soon, 5% overdue
   ↓
3. Filter by "Non-Compliant" → See list of overdue learners
   ↓
4. Select overdue learners → Actions:
   - "Send Reminder" (manual nudge)
   - "Extend Due Date" (grant extension)
   - "Waive" (exempt with reason)
   ↓
5. Export compliance report as CSV for records
```

---

## 5. Database Schema

### Enum Change
```sql
ALTER TYPE "COURSE_TYPE" ADD VALUE 'COMPLIANCE';
```

### New Column on `course` Table
```sql
ALTER TABLE course ADD COLUMN compliance JSONB DEFAULT NULL;
-- Only populated when type = 'COMPLIANCE'. Example:
-- {
--   "retakeIntervalMonths": 12,
--   "gracePeriodDays": 14,
--   "reminderDaysBefore": [30, 14, 7, 1],
--   "isMandatory": true,
--   "framework": "HIPAA",
--   "maxRetakeAttempts": null,
--   "passingScore": 80
-- }
```

### New Table: `course_completion_record`
```sql
CREATE TABLE course_completion_record (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  group_member_id UUID NOT NULL REFERENCES groupmember(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profile(id),

  -- Cycle tracking
  cycle_number INTEGER NOT NULL DEFAULT 1,  -- 1 = first time, 2 = first retake, etc.
  status VARCHAR NOT NULL DEFAULT 'not_started',
    -- 'not_started', 'in_progress', 'compliant', 'expiring_soon',
    -- 'in_grace_period', 'non_compliant', 'waived'

  -- Dates
  due_date TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,  -- completedAt + retakeIntervalMonths
  expired_at TIMESTAMPTZ,   -- when status changed to non_compliant

  -- Results
  score INTEGER,             -- best score for this cycle
  attempts INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,

  -- Waiver
  waived_by UUID REFERENCES profile(id),
  waiver_reason TEXT,
  waiver_expires_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(course_id, profile_id, cycle_number)
);

CREATE INDEX idx_ccr_course ON course_completion_record(course_id);
CREATE INDEX idx_ccr_profile ON course_completion_record(profile_id);
CREATE INDEX idx_ccr_status ON course_completion_record(status);
CREATE INDEX idx_ccr_due_date ON course_completion_record(due_date);
CREATE INDEX idx_ccr_valid_until ON course_completion_record(valid_until);
```

### New Table: `course_completion_notification_event`
```sql
CREATE TABLE course_completion_notification_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_completion_record_id UUID NOT NULL REFERENCES course_completion_record(id) ON DELETE CASCADE,
  channel VARCHAR NOT NULL,      -- 'email', 'in_app'
  event_type VARCHAR NOT NULL,   -- 'reminder_30d', 'renewal_created', 'became_non_compliant', etc.
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(course_completion_record_id, channel, event_type)
);
```

### New Table: `course_certificate_issue`
```sql
CREATE TABLE course_certificate_issue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  course_completion_record_id UUID NOT NULL REFERENCES course_completion_record(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'valid', -- 'valid', 'expiring_soon', 'expired', 'renewed'
  file_url TEXT,

  UNIQUE(course_completion_record_id)
);
```

### Drizzle Schema (TypeScript)

```typescript
// In packages/db/src/schema.ts

// Update enum
export const courseType = pgEnum('COURSE_TYPE', ['SELF_PACED', 'LIVE_CLASS', 'COMPLIANCE']);

// Add to course table definition
compliance: jsonb().$type<{
  retakeIntervalMonths: number;
  gracePeriodDays?: number;
  reminderDaysBefore?: number[];
  isMandatory?: boolean;
  framework?: 'HIPAA' | 'OSHA' | 'SOX' | 'GDPR' | 'PCI_DSS' | 'FERPA' | 'ISO' | 'CUSTOM' | null;
  maxRetakeAttempts?: number | null;
  passingScore?: number;
}>(),

// New table
export const courseCompletionRecord = pgTable(
  'course_completion_record',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    courseId: uuid('course_id').notNull(),
    groupMemberId: uuid('group_member_id').notNull(),
    profileId: uuid('profile_id').notNull(),
    cycleNumber: integer('cycle_number').default(1).notNull(),
    status: varchar().default('not_started').notNull(),
    dueDate: timestamp('due_date', { withTimezone: true, mode: 'string' }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
    validUntil: timestamp('valid_until', { withTimezone: true, mode: 'string' }),
    expiredAt: timestamp('expired_at', { withTimezone: true, mode: 'string' }),
    score: integer(),
    attempts: integer().default(0),
    timeSpentMinutes: integer('time_spent_minutes').default(0),
    waivedBy: uuid('waived_by'),
    waiverReason: text('waiver_reason'),
    waiverExpiresAt: timestamp('waiver_expires_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => [
    foreignKey({ columns: [table.courseId], foreignColumns: [course.id], name: 'ccr_course_id_fkey' }),
    foreignKey({ columns: [table.groupMemberId], foreignColumns: [groupmember.id], name: 'ccr_group_member_id_fkey' }),
    foreignKey({ columns: [table.profileId], foreignColumns: [profile.id], name: 'ccr_profile_id_fkey' }),
    unique('ccr_unique_cycle').on(table.courseId, table.profileId, table.cycleNumber),
    index('idx_ccr_course').on(table.courseId),
    index('idx_ccr_profile').on(table.profileId),
    index('idx_ccr_status').on(table.status),
    index('idx_ccr_due_date').on(table.dueDate),
    index('idx_ccr_valid_until').on(table.validUntil),
  ]
);
```

### Validation Schema (Zod)

```typescript
// In packages/utils/src/validation/course/course.ts

export const ZComplianceSettings = z.object({
  retakeIntervalMonths: z.number().int().min(1).max(120),
  gracePeriodDays: z.number().int().min(0).max(365).optional().default(0),
  reminderDaysBefore: z.array(z.number().int().min(1).max(365)).max(10).optional().default([30, 7, 1]),
  isMandatory: z.boolean().optional().default(true),
  framework: z.enum(['HIPAA', 'OSHA', 'SOX', 'GDPR', 'PCI_DSS', 'FERPA', 'ISO', 'CUSTOM']).nullable().optional(),
  maxRetakeAttempts: z.number().int().min(1).nullable().optional(),
  passingScore: z.number().int().min(0).max(100).optional().default(80),
});

// Update ZCourseCreate
export const ZCourseCreate = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['LIVE_CLASS', 'SELF_PACED', 'COMPLIANCE']),
  organizationId: z.string().min(1),
  compliance: ZComplianceSettings.optional(),
}).refine(
  (data) => data.type !== 'COMPLIANCE' || data.compliance !== undefined,
  { message: 'Compliance settings are required for COMPLIANCE courses', path: ['compliance'] }
);

// Update ZCourseUpdate
export const ZCourseUpdate = z.object({
  // ... existing fields ...
  type: z.enum(['LIVE_CLASS', 'SELF_PACED', 'COMPLIANCE']).optional(),
  compliance: ZComplianceSettings.optional(),
});
```

---

## 6. API Endpoints

### Course Endpoints (extended)
```
POST   /courses                          # Now accepts type: 'COMPLIANCE' + compliance settings
PATCH  /courses/:courseId                 # Can update compliance settings
```

### Compliance-Specific Endpoints
```
GET    /courses/:courseId/compliance
  → Compliance overview: stats + learner list with statuses

GET    /courses/:courseId/compliance/learners/:profileId
  → Learner compliance history: current cycle + all previous cycles

POST   /courses/:courseId/compliance/waive
  Body: { profileId, reason, expiresAt? }
  → Waive a learner from the current cycle

POST   /courses/:courseId/compliance/reset
  Body: { profileId, newDueDate }
  → Force re-enrollment (create new cycle)

POST   /courses/:courseId/compliance/extend
  Body: { profileIds[], newDueDate }
  → Bulk extend due dates

GET    /courses/:courseId/compliance/export
  → CSV export of all learner compliance records
```

---

## 7. Background Job Infrastructure

### Current State
There is no cron or job queue system in ClassroomIO today. Redis exists but is only used for rate limiting and caching. The compliance course type requires two daily jobs — this is the first scheduled work in the platform.

### Architecture: Internal API Routes + Cron Runner

The compliance logic lives inside the existing API (where it has DB access, services, and context). A separate lightweight Bun cron runner triggers it on a schedule by calling internal endpoints.

```
┌─────────────────┐       POST /internal/compliance/*       ┌──────────────┐
│   Cron Runner   │  ──────────────────────────────────►    │   API        │
│   (apps/cron)   │       x-api-key: PRIVATE_SERVER_KEY     │   (apps/api) │
│   Bun + croner  │                                         │   Hono       │
└─────────────────┘                                         └──────┬───────┘
                                                                   │
                                                            ┌──────▼───────┐
                                                            │  PostgreSQL  │
                                                            └──────────────┘
```

### Internal API Routes

Two new routes under `/internal/`, protected by the existing `PRIVATE_SERVER_KEY` middleware (`apps/api/src/middlewares/api-key.ts`):

```
POST /internal/compliance/check-expiry
  → Checks valid_until dates across all compliance courses
  → Creates the next cycle when a compliant cycle reaches valid_until
  → Transitions only the active cycle through: not_started/in_progress → expiring_soon → in_grace_period → non_compliant
  → Returns: { processed: number, transitioned: number, reEnrolled: number }

POST /internal/compliance/send-reminders
  → Finds compliance courses with upcoming due dates
  → Sends reminders based on each course's reminderDaysBefore settings
  → Sends admin notifications for newly overdue learners
  → Returns: { remindersSent: number, adminAlertsSent: number }
```

### Cron Runner (`apps/cron/`)

Minimal Bun project. Its only job is to call the internal API endpoints on a schedule.

```typescript
// apps/cron/index.ts
import { Cron } from 'croner';

const API_URL = process.env.API_URL;
const SERVER_KEY = process.env.PRIVATE_SERVER_KEY;

const headers = { 'x-api-key': SERVER_KEY, 'content-type': 'application/json' };

// Daily at 2:00 AM UTC — check expirations and transition statuses
new Cron('0 2 * * *', async () => {
  const res = await fetch(`${API_URL}/internal/compliance/check-expiry`, { method: 'POST', headers });
  console.log('check-expiry:', await res.json());
});

// Daily at 2:30 AM UTC — send reminders (runs after expiry check so statuses are up to date)
new Cron('30 2 * * *', async () => {
  const res = await fetch(`${API_URL}/internal/compliance/send-reminders`, { method: 'POST', headers });
  console.log('send-reminders:', await res.json());
});

console.log('Cron runner started');
```

**Dependencies**: Just `croner` (lightweight, zero-dep cron library for Bun/Node).

### Security

| Concern | How it's handled |
|---------|-----------------|
| **Authentication** | `PRIVATE_SERVER_KEY` — the existing server-to-server key, validated by the `api-key` middleware. No new auth mechanism needed |
| **Route exposure** | `/internal/*` prefix is never registered in public-facing route groups. Middleware rejects requests without a valid key |
| **Network isolation** | On Railway, the cron runner and API are separate services in the same project — internal communication stays within Railway's private network |
| **Idempotency** | Both jobs are safe to run multiple times. `check-expiry` only transitions records that match date conditions. `send-reminders` tracks sent reminders to avoid duplicates |

### Deployment

**Railway** (production): The cron runner is a separate Railway service in the same project as the API. It needs two env vars:
- `API_URL` — internal URL of the API service (Railway provides this via service references)
- `PRIVATE_SERVER_KEY` — same value as the API's key

**Self-hosted**: Not included in docker-compose. A `README.md` in `apps/cron/` explains the three options:

1. **Run the cron runner directly** — `bun run apps/cron/index.ts` as a separate long-running process
2. **Use system cron** — add two crontab entries that `curl` the internal endpoints:
   ```
   0 2 * * * curl -X POST -H "x-api-key: $PRIVATE_SERVER_KEY" http://localhost:3002/internal/compliance/check-expiry
   30 2 * * * curl -X POST -H "x-api-key: $PRIVATE_SERVER_KEY" http://localhost:3002/internal/compliance/send-reminders
   ```
3. **Manual** — call the endpoints on demand, skip automation entirely

### Adding Future Jobs

When new scheduled work is needed beyond compliance, add a new `/internal/*` route in the API and a new `Cron(...)` call in the runner. The pattern scales without architectural changes.

---

## 8. Technical Architecture

### Frontend Changes

```
apps/dashboard/src/lib/features/course/
  components/
    new-course-modal.svelte             # Updated: COMPLIANCE option alongside LIVE_CLASS/SELF_PACED
    compliance-settings-form.svelte     # New: retake interval, framework, grace period, passing score
    compliance-status-badge.svelte      # New: compliant/expiring/non-compliant badges
    compliance-learner-table.svelte     # New: learner list with compliance statuses + bulk actions
  pages/
    settings.svelte                     # Updated: compliance settings section when type=COMPLIANCE
    compliance.svelte                   # New: compliance tab in course management

apps/course-app/  (learner-facing)
  # Updated: show compliance status badge, due date, retake history on course page
  # Updated: course card shows "Due by" and color-coded status
  # Updated: same course page shows "Current Cycle" and "Past Cycles" history instead of separate course entries
```

### Files That Need Code Changes

| File | Change |
|------|--------|
| `packages/db/src/schema.ts` | Add `COMPLIANCE` to enum, `compliance` column to course, new `courseCompletionRecord` table |
| `packages/utils/src/validation/course/course.ts` | Add `ZComplianceSettings`, update `ZCourseCreate`/`ZCourseUpdate` with `COMPLIANCE` and `.refine()` |
| `packages/utils/src/validation/course-import/course-import.ts` | Add `COMPLIANCE` to `ZCourseImportDraftCourse.type` |
| `apps/api/src/services/course/course.ts` | Handle `compliance` field in create/update |
| `apps/api/src/services/submission/submission.ts` | Record valid completion on `course_completion_record` when score >= passingScore |
| `apps/api/src/routes/v1/courses.ts` | Add `/courses/:courseId/compliance/*` endpoints |
| `apps/api/src/routes/internal/compliance.ts` | New: `/internal/compliance/check-expiry` and `send-reminders` routes |
| `apps/cron/index.ts` | New: Bun cron runner that calls internal endpoints on a schedule |
| `apps/dashboard/.../new-course-modal.svelte` | Add COMPLIANCE option to course type selector |
| `apps/dashboard/.../settings.svelte` | Show compliance settings panel for COMPLIANCE courses |

---

## 9. Implementation Roadmap

### Phase 1: Schema & API (Week 1-2)

| Task | Duration | Deliverable |
|------|----------|-------------|
| Extend `COURSE_TYPE` enum + migration | 1 day | `COMPLIANCE` in Postgres enum and Drizzle schema |
| Add `compliance` JSONB column to course | 1 day | Migration + schema update |
| `course_completion_record` table + Drizzle model | 2 days | New table with indexes |
| `ZComplianceSettings` Zod validation | 1 day | Validation for create/update |
| Update course create/update API | 2 days | Accept compliance settings |
| Compliance-specific API endpoints | 2 days | Overview, waive, reset, extend, export |

### Phase 2: Completion Tracking & Background Jobs (Week 2-3)

| Task | Duration | Deliverable |
|------|----------|-------------|
| Record compliance completion on submission | 2 days | Submission service integration |
| `/internal/compliance/*` routes + `PRIVATE_SERVER_KEY` guard | 1 day | Internal API endpoints |
| `check-expiry` service logic | 2 days | Daily status transitions + auto re-enrollment |
| `send-reminders` service logic | 1 day | Reminder emails based on `reminderDaysBefore` |
| `apps/cron` Bun project + `croner` setup | 1 day | Cron runner calling internal endpoints |
| Deploy cron runner as Railway service | 0.5 day | Running in production |
| Admin overdue notifications | 1 day | Notify admins of newly non-compliant learners |

### Phase 3: Dashboard & Admin UI (Week 3-4)

| Task | Duration | Deliverable |
|------|----------|-------------|
| COMPLIANCE option in course creation modal | 1 day | Course type selector update |
| Compliance settings form component | 2 days | Retake interval, framework, grace period UI |
| Compliance settings in course settings page | 1 day | Edit compliance config after creation |
| Compliance tab in course management | 3 days | Learner table with statuses, bulk actions |
| Org-level compliance summary card | 1 day | Dashboard overview widget |

### Phase 4: Student Experience (Week 4-5)

| Task | Duration | Deliverable |
|------|----------|-------------|
| Compliance badge + due date on course card | 1 day | Learner dashboard update |
| "Required: Complete by" banner on course page | 1 day | Course page update |
| Retake history view | 2 days | "Cycle 1: Completed... Cycle 2: Due..." |
| "Compliant until" confirmation on completion | 1 day | Post-completion UI |
| Certificate with expiration date | 1 day | Certificate PDF update |

**Milestone**: Organizations can create compliance courses with retake periods. Learners see due dates, get reminders, and are automatically re-enrolled when completions expire. Admins can monitor compliance status and take bulk actions.

---

## 10. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Time to create a compliance course | < 5 min | User testing |
| Compliance course completion rate | > 90% | `course_completion_record` data |
| Reminder email → completion conversion | > 50% | Track completions within 7 days of reminder |
| Overdue rate (non-compliant after grace period) | < 10% | `course_completion_record` status counts |
| Admin time spent on manual follow-up | Reduced by 80% | Customer interviews |

---

## 11. Open Questions

1. Should converting an existing `SELF_PACED` course to `COMPLIANCE` retroactively create completion records for current enrollees?
2. When a waiver expires, should the learner automatically get a new cycle, or return to their previous status?
3. Should compliance courses support a "pre-assessment" that lets learners who already know the material skip directly to the final assessment?
4. Do we need org-level defaults for compliance settings (e.g., "all compliance courses in this org default to 12-month retake")?
