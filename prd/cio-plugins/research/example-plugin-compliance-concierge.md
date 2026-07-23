# Example plugin: "Compliance Concierge"

A concrete, simple example plugin grounded in ClassroomIO's customer niche. It is included to
make the abstract framework tangible: a small, high-value plugin built entirely on **existing**
surfaces (webhooks in, REST API out), with no code running inside ClassroomIO.

## ClassroomIO's niche (from the site + product docs)

ClassroomIO is the **open-source LMS for companies**, targeting three use cases:

- **Compliance Training** — regulated industries (healthcare, finance, manufacturing,
  government): deadline tracking, renewals & retake intervals, grace periods, waivers,
  certificates with custom IDs.
- **Customer Education** — branded academy portal, cohorts, AI lesson tutor, multilingual.
- **Partner Training** — partner workspaces, branded certificates, custom domains, embeddable
  widgets.

It already ships a `COMPLIANCE` course type (retake intervals, grace periods,
`reminderDaysBefore`, statuses like `expiring_soon` / `in_grace_period` / `non_compliant`,
a daily `compliance-expiry-checker`) and developer surfaces: outbound webhooks, a REST API, and
an embeddable widget. (Sources: `README.md`, `prd/compliance-training-platform [DONE]/README.md`,
`prd/webhooks/README.md`.)

---

## The niche problem it solves

The #1 pain in compliance training is not authoring the course — it is the human chase: getting
every employee to _finish mandatory training before the deadline_, escalating the stragglers,
and _proving completion to an auditor_. ClassroomIO already computes the hard part (deadlines,
grace periods, `non_compliant` status via the daily checker), but the nudging still happens over
email nobody reads. This plugin closes that last mile where compliance programs actually fail.

## What it does

- **Escalating reminders** tied to the course's own `reminderDaysBefore` (e.g. `[30, 7, 1]`):
  DM the learner in Slack at T-30/7/1 before `dueDate`.
- **Manager escalation**: once a learner hits `in_grace_period`, CC their manager on the
  reminder.
- **Overdue alarm**: when status flips to `non_compliant`, post to a `#compliance-alerts`
  channel and email the compliance owner.
- **Audit evidence**: on completion, post a ✅ and append a row (learner, course, `completedAt`,
  `validUntil`, certificate ID) to a Google Sheet / CSV the auditor can pull.

## How it "plugs in" — all existing surfaces, nothing runs inside ClassroomIO

This is the out-of-process, webhook + API plugin archetype (the same safe model Canvas uses for
LTI tools and WordPress uses for its Slack/notification plugins). ClassroomIO never executes the
plugin's code, so there is zero trust/sandbox burden.

- **IN (real-time)** — subscribe the plugin's endpoint to webhooks in `/settings/integrations`:
  `lesson.completion.updated` and `course.submission.status_changed` to react the moment
  someone finishes.
- **IN (state)** — a **daily poll** of the REST API for each learner's compliance status
  (`expiring_soon` / `in_grace_period` / `non_compliant`) and `dueDate`, which drives the
  escalation ladder.
- **OUT** — Slack Web API for DMs/channel posts; optional email; optional write-back to the
  REST API (e.g. append an audit note).
- **Config** — an org admin pastes the webhook endpoint + signing secret + an API key, and maps
  `courseId → Slack channel` and a manager lookup (Slack email match or an HRIS field).

## The whole plugin is ~150 lines — two pieces

1. **Webhook receiver** (a serverless function). Steps: read raw body + headers → verify
   `X-Cio-Signature-256` as `sha256=HMAC_SHA256(secret, "<X-Cio-Timestamp>.<rawBody>")` within a
   5-minute window → dedupe on `event.id` (idempotency key) → if
   `event.type === 'lesson.completion.updated'` and the course is a COMPLIANCE course, post
   `✅ {learner} completed {course} — valid until {validUntil}` to Slack and append the audit
   row. Verification and envelope fields are exactly as specified in `prd/webhooks/README.md`.

2. **Daily cron poller.** Steps: `GET` compliance enrollments from the REST API → for each
   learner compute `daysUntil(dueDate)` → if `daysUntil ∈ reminderDaysBefore` DM the learner; if
   `status === 'in_grace_period'` DM learner **+** manager; if `status === 'non_compliant'` post
   to `#compliance-alerts` and email the owner. Because the LMS already maintains status and
   dates, the plugin only decides _who to ping and how loudly_.

## Why this is the right "simple first plugin"

- **Directly monetizes the niche**: compliance buyers pay for _proof and enforcement_, not
  content — this delivers both with existing data.
- **Uses only shipped surfaces** (webhooks + REST API), so it needs no core changes and no code
  sandbox — the safest extension tier.
- **Genuinely small**: one function + one cron, deployable on any serverless host.

## One natural extension point to make it cleaner

The v1 webhook catalog has `lesson.completion.updated` and `course.submission.status_changed`,
but **no dedicated compliance-lifecycle event**. Adding a `course.compliance.status_changed`
event (fired by the existing `compliance-expiry-checker` when a learner moves to
`expiring_soon` / `in_grace_period` / `non_compliant` / `compliant`) would let this plugin be
**100% event-driven** and drop the daily poll — a small, high-leverage addition to the
extension surface.

---

## The pattern generalizes to the other two niches

- **Customer Education** → an "Adoption Signals" plugin: on `lesson.completion.updated` /
  `course.submission.status_changed`, push course-completion events into HubSpot/Salesforce so
  CS teams see which accounts are getting trained.
- **Partner Training** → a "Certified Partner Badge" plugin: on completion, mint a verifiable
  badge and post it back via the embeddable widget / a public verification URL for the
  partner's site.

All three are the identical, safe **webhook-in / API-out** shape — which is why it is the ideal
foundation for a first ClassroomIO plugin surface.
