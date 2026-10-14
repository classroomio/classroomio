# Learner gamification: requirements

Priority: P1 = Phase 1, P2 = Phase 2, P3 = Phase 3.

## A. Org settings

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| A1 | P1 | Gamification is off by default for every org. An admin turns it on in settings. | A new or existing org has the master switch off. No XP is awarded and no gamification UI appears until it is on. |
| A2 | P1 | Admins can switch each feature on or off separately: streaks, XP and levels, badges, Veteran badge, weekend freeze, leaderboards, streak reminder emails. | Turning a feature off hides its UI and stops its awards for all learners in the org. Turning gamification off entirely hides everything. |
| A3 | P1 | Admins can edit XP values for each rule. | Values are saved per org. A change applies to new activity. Past XP is recalculated overnight. |
| A4 | P1 | Each course can turn gamification off. | A course with it off earns no XP, and its learners see no gamification UI there. |
| A5 | P2 | Leaderboards default to off for courses with compliance enabled. | A new compliance course starts with leaderboards off and shows the "Off for compliance courses" label. |
| A6 | P1 | Settings follow the course settings pattern. | Each group is a titled card with a description. Each row has a label, a muted description and a switch on the right. Rows are separated by dividers. Unsaved changes show the standard save bar. |

## B. Launch and history

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| B1 | P1 | On the day an org turns gamification on, every learner starts at zero XP. | No XP is awarded for activity dated before the turn-on date. |
| B2 | P1 | Learners with activity before the turn-on date get a one-time Veteran badge. It gives no XP. | Awarded once per learner, based on at least one lesson completion or exercise submission before the turn-on date. Re-running the job does not award it again. |

## C. Points ledger

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| C1 | P1 | Every award is one row in `learner_xp_event` with org, learner, course, rule, source type, source id, points and timestamp. | Each row links to the record that earned it. |
| C2 | P1 | A learner cannot receive the same award twice. | A unique key on learner, rule and source enforces this. A retried job creates no duplicate. |
| C3 | P1 | Awards are written by a background job queued after the originating transaction commits. | A failed award job does not roll back the lesson, submission or other action that triggered it. |

## D. Earning rules

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| D1 | P1 | Completing a lesson awards 20 XP, once per lesson. | A video lesson awards XP only after 80% of the video is watched. Re-completing awards nothing. |
| D2 | P1 | Submitting an exercise before its due date awards 10 XP, once per exercise. | A late submission awards nothing. A resubmission awards nothing. |
| D3 | P1 | First-attempt score bonus, up to 30 XP. | Only the first attempt counts. Later attempts award nothing. |
| D4 | P1 | Attending a live session awards 15 XP. | Attendance is recorded in `group_attendance` and counts once per session. |
| D5 | P1 | Course milestones at 25%, 50% and 75% award 25 XP each. Finishing a course awards 100 XP. | Each milestone is awarded once per course. |
| D6 | P1 | Logins, page views and time on page never award XP. | No ledger row is created for these events. |
| D7 | P2 | Community upvotes never award XP. The Helpful answer badge is awarded only when an instructor marks an answer helpful. | Upvote counts do not create ledger rows. |

## E. Streaks

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| E1 | P1 | A streak counts consecutive days with a qualifying activity: a lesson completion, an exercise submission or a live session attendance. | Replaces the login streak on the learner home. The `GET /dash/login-streak` endpoint and card stay, with a new data source. |
| E2 | P1 | Days are counted in the learner's own time zone. | A lesson at 23:30 local time counts for that local day. |
| E3 | P1 | Saturday and Sunday never break a streak. | A learner who studies Monday to Friday keeps their streak. Weekend activity still counts toward it. |

## F. Badges and levels

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| F1 | P2 | Ten built-in badges, each with a rule and a progress indicator. | Locked badges show progress, for example "12 / 30 days". Earned badges show the date. |
| F2 | P1 | Levels are calculated from total XP. | The home page shows the current level and the XP needed for the next. |
| F3 | P1 | Milestone celebrations appear on the lesson screen when a milestone is reached. | The "Halfway there" card shows once per milestone and can be dismissed. |

## G. Leaderboards

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| G1 | P2 | Leaderboards rank learners by XP earned in the current week, per course. | The board resets every Monday. |
| G2 | P2 | Learners can hide themselves from leaderboards. | A hidden learner's row is removed for classmates. The learner still sees their own rank. |
| G3 | P2 | Leaderboards show only first name and last initial. | No full names or emails appear. |
| G4 | P2 | Leaderboards are limited to one org. | No cross-org ranking exists. |

## H. Email

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| H1 | P2 | A streak reminder is sent when a learner with a 3-day or longer streak has no qualifying activity by late evening in their time zone. | The email is org-branded (`branding` field, `buildEmailFromName`). |
| H2 | P2 | Learners can opt out of streak reminders. | A new column in `organizationmember_email_notifications` stores the choice. An opted-out learner receives nothing. |

## I. Teacher tools

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| I1 | P3 | Teachers can create time-boxed quests, such as 2x XP for a module this week. | A quest applies only to its course and its dates. Its XP is recorded in the ledger with a quest source. |
| I2 | P3 | The course student table shows XP, streak and last active. | The columns sort and export like the existing ones. |

## J. Cross-cutting

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| J1 | P1 | All learner-facing copy uses translation keys. | No hardcoded English strings in components. Keys exist in `en.json` and other locale files. |
| J2 | P1 | Gamification UI meets the accessibility pattern. | Switches have `role="switch"` and `aria-checked`. Icon-only controls have labels. Colour is never the only signal. |
| J3 | P1 | Enabling or disabling gamification does not change grades, certificates or compliance status. | Grades and certificates are the same before and after toggling. |

## Out of scope

- Money, prizes or certificates earned through XP.
- Cross-org leaderboards.
- Changes to grading.
- A native mobile treatment.
