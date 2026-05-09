# Compliance UX

This document describes the compliance user journey that is implemented today. It is intentionally limited to the current behavior in code and dashboard UI.

## Scope

- Applies only to courses whose type is `COMPLIANCE`
- The `Compliance` nav item only appears for `COMPLIANCE` courses
- The current implementation uses one course with compliance history inside it
- It does not create separate retake courses or a course-switching UI

## Key prerequisites

- A teacher/admin must create or configure the course as `COMPLIANCE`
- The course must have `certificate.deadline` set before student enrollment can create the initial compliance cycle
- Student completion is currently tied to the existing course certification rule, not a separate compliance-only completion rule

## Teacher/Admin Journey

### 1. Configure the course

The teacher/admin creates or updates a course to use the `COMPLIANCE` type.

For the compliance lifecycle to begin for learners, the course must also have a certificate deadline configured. That deadline is used as the initial `dueDate` for the first compliance cycle.

### 2. Enroll learners

When a student is enrolled into the course, the system attempts to create that learner's first compliance record automatically.

This automatic record creation currently runs when enrollment happens through:

- direct course member add
- bulk course member add
- course invite acceptance
- organization invite acceptance when courses are assigned
- audience-based course enrollment

If the course has no certificate deadline, compliance record creation is blocked.

### 3. View course compliance status

Staff can open the course `Compliance` page.

The page currently shows:

- summary cards for learner counts by status
- a learner table with current status, due date, validity date, and score

This is an overview of the latest compliance record per learner, not a multi-cycle drilldown UI.

### 4. Take bulk staff actions

On the course `Compliance` page, staff can select learners and apply bulk actions:

- `Reset`
- `Extend`
- `Waive`

Current behavior:

- `Reset` creates a first record if none exists, or resets the learner's latest record back to `not_started` with a new due date
- `Extend` updates the due date on the learner's current incomplete record; if the learner has no current incomplete record and also has no completed record, it creates a new `not_started` record
- `Waive` marks the learner's current incomplete record as `waived`

The page supports:

- select all visible learners
- clear selection
- staff-entered due date for reset/extend
- optional waiver reason
- optional waiver expiration date

### 5. Refresh data

The `Compliance` page has a refresh action. It clears the local compliance state and reloads the course data.

## Student Journey

### 1. Join the course

The student joins the `COMPLIANCE` course through one of the supported enrollment flows.

If the course is correctly configured, the system creates the student's first compliance cycle automatically with:

- status `not_started`
- cycle number `1`
- due date from `certificate.deadline`

### 2. Take the course normally

The student experience remains inside the same course shell. There is no separate retake course.

The student works through lessons and exercises using the existing course flow.

### 3. Open the Compliance page

Students see a `Compliance` tab for compliance courses.

The page currently shows:

- `Current Cycle`
- `History`

`Current Cycle` displays the latest active record fields that are currently available in the system:

- cycle number
- status
- due date
- completed at
- valid until
- score
- attempts

`History` shows previous and current cycle records in a table.

### 4. Complete the course

Compliance completion is not triggered by a dedicated "mark complete" action on the compliance page.

Instead, the system evaluates compliance after submission activity. When the student becomes eligible under the existing course certification rule:

- the active compliance record is marked `compliant`
- `completedAt` is stored
- `validUntil` is calculated from the course retake interval
- a per-cycle certificate issue record is created if certificates are downloadable for the course

If the student is not yet eligible for the course certificate, the compliance record remains incomplete.

## System-driven lifecycle

Some parts of the journey are implemented as backend jobs rather than dashboard actions.

### Reminder and status scan

The system has an internal reminder/status scan that can:

- mark a record `expiring_soon`
- move a learner into `in_grace_period`
- move a learner into `non_compliant`
- create reminder notification-event records for configured reminder offsets

This logic is implemented in the backend. There is no teacher-facing reminder management UI yet.

### Renewal cycle creation

When a compliant cycle reaches `validUntil`, the expiry job:

- marks the old cycle as expired
- marks its certificate issue as expired
- creates the next cycle as `not_started`
- sets the next cycle's due date to the previous cycle's `validUntil`

There is no separate student retake selector in the UI. The renewal appears as another cycle in the same course history.

## Current UI boundaries

The following are implemented in the backend but not yet exposed as full dashboard workflows:

- staff drilldown into a specific learner's compliance history from the staff overview page
- reminder management UI
- explicit certificate history UI tied to compliance cycles

The current dashboard UX is therefore:

- staff: overview + learner table + bulk actions
- student: current cycle + cycle history
