# Events PRD Addendum: Luma Replacement + Event-to-Training

Addendum to [`README.md`](./README.md). Where the two conflict, this document wins and the README must be updated when this is accepted.

## Why this addendum exists

The README scopes Events as "publish a single webinar page". Two things changed:

1. **Positioning.** Events should be a standalone replacement for Luma (lu.ma): an org can run its whole event programme on ClassroomIO without Zoom-link spreadsheets, calendar invites or a separate event tool.
2. **The wedge.** Luma stops when the event ends. ClassroomIO keeps going: the recording, notes and resources from any event can become a reusable training in the org's academy. Nobody else in the Luma category can do that, and it is the reason to choose us over Luma.

## Research findings

### TraCorp LMS (the post that prompted this)

Findings come from TraCorp's help-desk article snippets surfaced by search. The sandbox could not fetch `tracorp.com` or `helpdesk.tracorp.com` directly, so the articles themselves were not read, and the conference site itself was not reachable.

- **TraCorp does not host live video.** Webinar Training is an orchestration layer. An admin either launches a Zoom meeting from inside the LMS (Zoom API key + secret enabled under General Settings) or pastes a meeting URL from Zoom, Teams, GoToMeeting or similar. The Reddit post says the same: "works with any conferencing platform; put your link in the Access Instructions field".
- What TraCorp adds on top: sessions with seat limits, register-by-dates, wait lists, a learner calendar, and showing the join link only after registration.
- Whether TraCorp pulls recordings from Zoom through the API is **not confirmed** by anything found. The post says "everything else on replay" without saying how replays get there.

Conclusion: TraCorp is a registration and access layer in front of someone else's conferencing tool. We should be the same, and we do not need to build video conferencing.

### Luma (lu.ma)

From third-party reviews and Luma help-centre snippets (official docs were not fetchable; verify before relying on specifics, especially pricing and API tiers):

- Event pages, email and SMS invites, registration questions, approval-required registration, guest chat.
- Reminders by email, SMS, push and WhatsApp. Default email reminders reportedly go the day before and an hour before.
- Calendars: curated, subscribable collections of events, newsletters to subscribers, embeddable on other sites.
- Recurring event series.
- Ticketing (free tier takes 5% plus Stripe; Plus drops the platform fee). Check-in by QR, check-in manager and co-host roles.
- Zoom integration with attendance tracking.
- iOS and Android apps.
- REST API and Zapier/Make automations on paid tiers.

## Decisions

### Dropped from consideration

These were raised and rejected. They are not needed for the Luma-replacement positioning:

- Completion badges and leaderboards.
- Multiple dated or time-zoned sessions under one topic with a single attendance report.
- User groups, sponsor tiers, role-based dashboards and access codes (TraCorp's conference workflow).
- Attendance reports. Event analytics stay a non-goal.

The README's one-event-equals-one-lesson invariant stays. A recurring event is a series of separate events (see Series below), not one event with many sessions.

### Locked in: reminders

Reminders move from "Later" into v1. A scheduled event without reminders is not a Luma replacement.

- **Recipients:** only verified registrants (enrolled via redemption, per Confirmed Decision 6). Never unverified form responses.
- **Defaults:** 24 hours before and 1 hour before the start. Each event can override or disable them in the editor. Channel is email in v1; SMS, push and WhatsApp are a Later item that depends on `prd/notification-system/README.md`.
- **Content:** org-branded system template (event title, local-time range with timezone, join link, Add to calendar). The join link is allowed here because recipients have redeemed.
- **Derived, not formatted:** extend the reminder scan beyond its single `type = 'LIVE_CLASS'` condition to `EVENT` rows where `lessonAt` is in the future and a `callUrl` is present. Consistent with Confirmed Decision 4, `format` must not be a condition.
- **Idempotency:** one send per `(event, recipient, reminder kind)`, recorded so job retries and restarts never double-send.
- **Reschedule and cancel (moved out of Non-Goals):** changing `lessonAt` or cancelling a published event with registrants must (a) cancel pending reminders and recompute them, (b) email registrants the change, and (c) send an updated `.ics` (`buildSessionIcs` with `method: 'REQUEST'` using the same UID and bumped sequence, or `method: 'CANCEL'`). Reminders that ignore a reschedule are worse than no reminders.
- **Replay-ready email (moved out of Non-Goals):** when a recording is attached to a past event, email its verified registrants "the replay is ready". This is the bridge into the training story below.
- Respect `prd/email-notification-preferences/README.md` for opt-out; system-critical reschedule and cancel emails are exempt.

### Luma parity: what to build

Tiered by how much of the "I can stop using Luma" promise each one carries.

**Tier 1: required to be credible (v1)**

- Everything already in the README: public event page, branded `/events` catalog, verified registration, countdown, timezone-correct times, calendar invites, landing-page section, LMS entry.
- Reminders, reschedule/cancel updates and replay-ready email (above).
- **Capacity and waitlist.** Use the Forms attachment-level response limit as the capacity source. Over capacity, the form accepts the response as `waitlisted` with no grant issued; when a seat frees (grant revoked or expired), promote the oldest waitlisted response and issue its grant. Reuses the seat-reservation contract in README Prerequisites §3.
- **Approval-required registration.** An attachment setting. The response stays `pending_approval` until an admin approves it, which issues the grant. Rejection sends a neutral email.
- **Guest list for admins:** per-event view of registrations with status (pending, approved, waitlisted, registered/redeemed, revoked), search, export, and email-all-registrants.
- **Meeting-link helpers:** paste any link (Zoom, Meet, Teams, YouTube Live). Auto-creating Zoom or Meet meetings through OAuth is Tier 2.
- **Co-hosts:** more than one team member can manage an event. The README's "multiple hosts" non-goal is reversed for admin co-management; a single public "Hosted by" remains the display default until we decide otherwise.

**Tier 2: parity after launch**

- **Series and recurring events.** A recurring event is N independent `EVENT` courses linked by a series. Per Confirmed Decision 2, relational links do not live in JSONB, so this needs a real `event_series` table plus an FK on the event course, not `metadata`. Series get a stable page and a "subscribe to series" calendar feed. This also feeds the training story: a series maps naturally to a course.
- **Calendars (collections).** An org's curated, subscribable event lists with an `.ics` feed and an embeddable widget (see `prd/course-widget-embed [DONE]/README.md` for the pattern).
- **Zoom/Meet auto-create and recording import** via OAuth (see Recording ingestion below).
- **Newsletter or blast emails** to registrants beyond the single "email all" in Tier 1.
- **Check-in** for in-person events: QR ticket and a check-in manager role. In-person stays display-only (`delivery`, `location`) until we choose to build it.
- Webhook and Zapier events for event lifecycle (`event.registration.completed`, `event.replay.ready`), per `prd/webhooks/README.md` and `prd/zapier/README.md`.

**Tier 3: deliberately later**

- **Paid and ticketed events.** Luma's monetisation is a platform fee; ours is the academy. Revisit with the existing pricing plumbing once Tier 1 and Tier 2 land.
- **Native mobile app.** Public pages and emails must be mobile-first, and Add to calendar covers most phone usage. Native work belongs in `prd/mobile-app/README.md`, not here.
- SMS, push and WhatsApp reminders.

### The wedge: Turn an event into a training

**Principle:** an Event stays an Event (Confirmed Decision 8, "events and courses never mix" in catalogs and progress). "Turn into training" does not change an event's type. It **creates or extends a course from the event's content**, and the event keeps its page and registrants.

**Flow for the admin**

1. A past event has a playable recording. The editor shows **Turn into training**.
2. The admin picks **New course** or **Add to an existing course** (and a section).
3. We create a lesson in the target course from the event: title, rich-text note, video (referencing the same media-manager asset, not a copy), and resources from `lesson.documents`. Prefill the lesson description from the event description.
4. Optional: offer an AI-drafted summary and quiz from the transcript (`prd/study-from-source/README.md`, `prd/youtube-embed-transcripts [DONE]/README.md`). Default off, admin reviews before publishing.
5. Optional: enroll the event's registrants in the new course, as an explicit checkbox with a registrant count. Default off, because enrolling people in something they did not sign up for is a surprise.
6. The event page gains a "Part of training: X" link, and the lesson links back to the source event.

**From a series:** *Turn series into training* creates one course with one lesson per event, ordered by date. This is the strongest case for building series in Tier 2.

**Rules**

- The link is by reference. Editing the event recording or notes does not silently change a published course lesson; the admin sees "source changed" and chooses to resync.
- Gating follows the destination course's own access settings, not the event's. Making a gated recording public via a course is an explicit admin action with a warning.
- A course lesson created this way must not break the event invariants: events still reject additional lessons and sections; only the course side is extended.

### Recording ingestion

The training wedge depends on getting recordings in with little effort. TraCorp relies on the admin pasting a link; Luma has none. Ordering:

1. **v1:** attach a YouTube embed or upload to the event's single lesson (already in the README).
2. **Tier 2:** Zoom (and Meet) OAuth connection. Creating the meeting from the editor, then importing the cloud recording when it finishes and attaching it to the event, which flips the event to `on-demand` and triggers the replay-ready email.

## Changes to the README

When this addendum is accepted, update `README.md`:

- Confirmed Decisions: add reminders as v1 (new decision) and the training conversion principle.
- Non-Goals: remove reschedule/cancel updates, replay-ready notification, capacity/waitlists, approval workflows, series, and multiple hosts (admin co-hosting); keep ticketing/payments, native app, in-person operations beyond display strings, assessment extras.
- Phased Delivery: add reminders and reschedule/cancel to Phase 3, capacity/waitlist/approval/guest list to Phase 3, "Turn into training" as a new phase after Phase 4, series and recording import as a following phase.
- Phase 5 (assessment CE mode) is unaffected, though it overlaps with the optional AI quiz in the training flow; decide which owns the exercise creation entry point.
- Add a new "Required Forms extensions" item for `waitlisted` and `pending_approval` response statuses.

## Open questions

1. **Is "Turn into training" a copy or a live link?** Recommendation: a reference with explicit resync, as above.
2. **Do registrants get auto-enrolled in the training by default?** Recommendation: no, opt-in with a count shown.
3. **Series table shape.** A standalone `event_series` table, or reuse `programs` / `learning-paths` (`prd/programs [DONE]/README.md`)? Needs a read of those PRDs before choosing. Do not store the link in JSONB.
4. **Co-host scope.** Admin co-management only, or also public multi-host display? The README currently lists both as non-goals.
5. **Capacity source of truth.** Forms attachment response limit (recommended) or a separate event capacity field? Using two risks them disagreeing.
6. **Pricing and plan limits.** Are events, registrants per event and reminder volume plan-gated? Check `prd/pricing-improvements/README.md`.

## Not verified

- TraCorp's conference site and help-desk pages were not read directly (network fetch failed in this session); statements about them come from search-result snippets.
- Luma feature and pricing details come from third-party summaries and may be out of date. Verify on `lu.ma` / `help.luma.com` before using any of it in marketing or comparison pages.
