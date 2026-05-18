---
name: AI Tutor Fair-Use Cap
overview: Protect the org's pooled AI tutor quota from single-learner abuse without adding pricing complexity. Introduce a per-learner monthly fair-use cap on student-facing AI tutor messages, enforced silently at the product layer. Pricing page stays unchanged — one pooled AI quota per tier. When the org pool runs out, the admin (buyer) is upsold; students never see an upgrade prompt.
todos:
  - id: cap-decision
    content: Lock in a flat per-learner cap of 100 tutor messages per calendar month across all tiers (rationale - agent + teacher usage already drains the pool, so the per-learner cap is a uniform abuse limiter)
    status: pending
  - id: usage-counter
    content: Add a per-learner monthly tutor-message counter scoped to a calendar month, resetting on the 1st
    status: pending
  - id: enforcement
    content: Block additional tutor messages for a learner who has reached the cap; return a soft error that the chat-input component can render as a "take a break" state
    status: pending
  - id: student-ux
    content: Build the friendly "AI tutor is taking a break — try again on the 1st" state in ai-course-chat / chat-input. No upgrade prompt to students.
    status: pending
  - id: admin-learner-leaderboard
    content: On the AI credits / usage page, add a learners leaderboard ranking active learners by tutor messages (and tokens) this period, with their current cap status (under / approaching / at cap)
    status: pending
  - id: admin-per-learner-detail
    content: Allow admin to click a learner in the leaderboard to see their tutor usage over time, the courses driving the usage, and any cap-hit events
    status: pending
  - id: admin-cap-status-summary
    content: Add a summary card on the AI credits page: "N learners at cap this month", "M learners approaching cap (>80%)", linked to the leaderboard
  - id: org-pool-empty-flow
    content: When the org's pooled AI quota is drained, send admin email + in-app notification with top-up / upgrade CTA. Students see same "take a break" message.
    status: pending
  - id: rate-limit-tuning
    content: Decide secondary protections beyond the monthly cap (no daily cap in v1; revisit only if abuse patterns emerge)
    status: pending
  - id: quota-resize
    content: Right-size the pooled AI quotas across tiers with realistic student tutor consumption modeled in
    status: pending
  - id: admin-disable-ai
    content: Add a workspace-level "Disable AI tutor for this workspace" toggle in AI settings. When off, the tutor entry points are hidden for all learners in that workspace and no AI requests are sent.
    status: pending
isProject: false
---

# AI Tutor Fair-Use Cap PRD

## Status

- Draft (2026-05-15)
- Owner: TBD

## Problem

The AI tutor is a pooled-token product: the org pays for a monthly AI quota, all learners in all workspaces share it. This works for teacher-side usage (creation is bursty, the admin sees the meter and can upgrade), but it creates a billing/UX dead-end on the student side:

1. **A single heavy student can drain the org's monthly pool**, blocking every other learner from using the tutor for the rest of the month.
2. **Students aren't the buyer.** There is no clean upgrade prompt to show a student when the pool runs out — they have no billing relationship with us.
3. **Splitting AI into two billable buckets (creation tokens + tutor messages) adds pricing complexity** that hurts conversion. The pricing page should remain one AI number per tier.

We need a way to protect the org's pool from individual-learner abuse without adding a new billing line, without surfacing complexity on the pricing page, and without ever upselling a student.

## Goals

1. Cap the impact one heavy learner can have on the org's pooled AI quota
2. Keep pricing simple — one "AI credits" number per tier; no new SKU
3. Never show an upgrade prompt to a student
4. When the org pool does run out, drive the admin (buyer) to top up or upgrade — existing motion
5. Give admins per-learner visibility so they can investigate or coach heavy users
6. Let admins disable the AI tutor entirely for their workspace (privacy, compliance, or cost reasons)

## Non-goals (v1)

- Per-learner tutor billing or per-learner overage SKUs
- Showing students any pricing/upgrade UI
- Cross-workspace tutor cap pooling (cap is per-learner per-workspace per-month)
- Per-tier variation of the per-learner cap (cap is uniform; tier differences live in the pooled AI quota size)
- A learner-visible usage counter (cap is invisible until hit)
- Real-time cost optimization (model routing, cheaper-model fallback) — separate effort

## Approach

**One AI quota at the org level.** Pooled tokens, used by teachers, students, and the agent equally. Pricing page stays unchanged.

**One per-learner fair-use cap underneath.** Every learner gets the same monthly budget: **100 tutor messages per calendar month**, flat across all tiers. The pool already differentiates tiers; the per-learner cap is purely an abuse limiter, so it doesn't need to vary by plan. Counter resets on the 1st. When a learner exceeds their cap:

- Tutor chat becomes read-only for that learner until the next reset
- Message: *"AI tutor is taking a break — try again on the 1st. You can still review lessons and notes."*
- No upgrade prompt, no marketing
- Lesson content, notes, quizzes, certificates all continue to work normally

**Locked-down student tutor surface.** To keep per-message cost predictable (so a flat message-count cap is a fair proxy for token usage), the student-facing tutor does not expose:

- A model picker — students always use the platform default model
- File uploads — text Q&A only

Teachers and the agent retain full model/upload access; this restriction is student-side only.

**Org-pool-exhausted flow (separate from per-learner cap):**

- When org's pooled AI quota hits 95% / 100%: admin gets email + in-app banner with top-up + upgrade CTAs (existing motion, just trigger it earlier)
- Students see the same generic "take a break" message
- Admin can top up via existing $5 / 2M tokens overage SKU

**Admin off-switch (workspace-level):**

- Admin can disable the AI tutor entirely for their workspace from AI settings
- When disabled: tutor entry points are hidden in lessons for every learner in that workspace; no AI requests are made; no tokens are consumed
- Toggle is per workspace, not per learner, not per course (v1)
- Existing AI conversation history is preserved but read-only while disabled
- Re-enabling is instant

## User stories

### Learner — typical
- I open a lesson and chat with the AI tutor.
- I have no awareness of any cap. Counter exists but isn't surfaced.
- I ask 12 questions across the month; nothing happens, all works fine.

### Learner — heavy user
- I have asked 100 tutor questions this month.
- On message 101 I see: *"AI tutor is taking a break — try again on the 1st."*
- Rest of the lesson UI still works. I can keep learning.
- I am never asked to pay or upgrade.

### Admin — happy path
- I open the AI credits page and see, alongside the pooled-quota meter:
  - A summary card: "3 learners at cap this month • 12 approaching (>80%)"
  - A **learners leaderboard** ranking learners by tutor usage this period (messages and tokens), each row showing name, course(s), messages used / cap, and a status badge (under / approaching / at cap)
- I click a learner to see their usage over time and which courses are driving it.
- I can proactively reach out to coach heavy users — or do nothing, the cap enforces itself.

### Admin — org pool draining
- I get an email at 95% usage: "You're nearing your monthly AI tutor quota. Top up or upgrade."
- I top up for $5 / 2M tokens or upgrade tier.
- Learners experience no service interruption if I act in time.

### Admin — org pool exhausted
- All learners see "AI tutor is taking a break."
- I get an in-app banner + email with clear top-up CTA.
- Topping up restores service immediately for all learners (subject to their individual per-learner caps).

### Admin — disable AI entirely
- I open AI settings for my workspace and toggle "AI tutor" off.
- Learners in this workspace no longer see the tutor entry point in any lesson.
- No tokens are consumed; the workspace's contribution to pooled usage drops to zero.
- I can re-enable at any time; conversation history is preserved.

## Functional requirements

### Data model

Likely already partial; verify against existing AI usage tracking:

- Per-learner monthly tutor-message counter, scoped by `(workspaceId, profileId, periodStart)`
- Reset on the 1st of each calendar month
- Counter is **per workspace, not pooled across workspaces** — a learner enrolled in two workspaces under one account gets one fresh cap in each (each workspace is its own billing context)
- Existing pooled-org AI quota tracking remains unchanged
- Workspace-level `aiTutorEnabled: boolean` (default `true`) on the org/workspace settings record

### Enforcement

- On every student-facing tutor request:
  1. Check workspace-level AI toggle → if disabled, return `ai_disabled` (request should not have been made; defensive check)
  2. Check org pooled quota → if exhausted, return `pool_exhausted` error
  3. Check per-learner cap → if reached, return `learner_cap_reached` error
  4. Else proceed; increment both counters on completion
- `pool_exhausted` and `learner_cap_reached` render the same neutral "take a break" UX to the student; admin sees the actual reason in their usage UI
- When the workspace AI toggle is off, the tutor entry point is **not rendered** for learners; defensive backend check prevents any direct API call from succeeding

### Student UI

- No model picker exposed — student tutor always uses the platform default model
- No file-upload affordance in the student tutor (text Q&A only)
- No usage counter shown to the learner — cap is invisible until they hit it
- On cap-hit: chat input disabled with the friendly "take a break" message above; lesson, notes, quizzes, and exercises continue to work
- No CTA pointing to billing / upgrade / payment
- Optionally: small "Learn more" link → static FAQ page (no pricing context)

### Admin UI — AI credits page

The existing AI credits / usage page is the home for all tutor visibility. Additions:

1. **AI tutor toggle** — top-of-page workspace-level switch: "AI tutor — On / Off". When off, the rest of the page shows a disabled state with a "Re-enable to start tracking again" CTA. Disabled state still shows historical usage.
2. **Pooled-quota meter** — unchanged (org-level AI credits used / available)
3. **Cap status summary card** — "N learners at cap this month • M approaching (>80%)" with click-through to the leaderboard
4. **Learners leaderboard** — primary new surface. Ranks active learners by tutor usage this period.
   - Columns: learner name, primary course(s), messages used, % of per-learner cap, tokens consumed, status badge (under / approaching / at cap)
   - Sortable by messages, tokens, or % of cap; default sort: messages descending
   - Pagination + search by learner name
   - Period selector: current month (default), previous month, last 90 days
5. **Per-learner detail panel / page** — clicking a leaderboard row shows:
   - Daily usage chart for the selected period
   - Course-level breakdown driving the usage
   - Cap-hit event log (when the learner hit the cap and was rate-limited)
6. **Existing 95% / 100% pool alerts** — unchanged; trigger existing top-up CTA

The leaderboard is **scoped to a single workspace**. Multi-workspace admins see one leaderboard per workspace (no cross-workspace roll-up in v1).

### Configuration

- Per-learner cap is a single server-side constant: **100 tutor messages / learner / calendar month**, flat across all tiers (including Enterprise)
- The cap value is never shown on the pricing page
- No daily / burst cap in v1 — revisit only if abuse patterns emerge that the monthly cap doesn't catch

## Success metrics

- **Single-learner abuse blocked:** % of months in which one learner consumed >5% of org pool. Target: <2% post-launch (vs whatever baseline).
- **Student-side complaints / tickets** about "tutor stopped working": <1 per 1,000 active learners per month.
- **Admin top-up conversion** when pool nears exhaustion: maintained or improved vs. today.
- **Tutor satisfaction** (existing in-product rating): no regression after launch.
- **Leaderboard engagement:** % of paid admins who view the AI credits page weekly, % who drill into a per-learner detail at least once per month. Target: 30% weekly views by month 2 post-launch.

## Rollout plan

1. **Phase 1 — instrumentation (1 week):** add per-learner counter; log usage; no enforcement
2. **Phase 2 — data review (1–2 weeks):** look at real distributions; confirm 100/month is the right value (adjust before broad rollout if data says otherwise)
3. **Phase 3 — silent enforcement on new orgs (1 week):** ship cap + UX for new signups behind a flag
4. **Phase 4 — full rollout:** enable for all orgs; communicate the policy in help docs (not on pricing page)

## Decisions log

All five originally-open questions are now resolved and baked into the spec:

1. **Window** — calendar month, resets on the 1st
2. **Daily/burst cap** — none in v1
3. **Cap value** — flat 100 msgs/learner/month across all tiers
4. **Learner-visible counter** — no, cap is invisible until hit
5. **Cross-workspace pooling** — no, cap is per-workspace

Phase 1 instrumentation may still flag the need to retune the cap value, but the structural choices above are committed for v1.

## Risks

- **Cap too low** → legitimate heavy learners (e.g., test-prep crammers) get blocked. Mitigation: Phase 1 instrumentation; tune before enforcing.
- **Confusing "take a break" message** → learners think the product is broken. Mitigation: clear message + help-doc link; track support tickets in Phase 4.
- **Admin can't tell why pool was drained** if instrumentation is bad. Mitigation: clear per-learner breakdown in admin UI from day 1.
- **Per-learner counter drift** under high concurrency. Mitigation: atomic increment via Postgres counter or Redis with periodic flush; existing AI usage tracking pattern.

## Out of scope

- Per-learner billing
- Model routing to cheaper models when pool low
- Tutor-quality differentiation by tier (Sonnet vs Haiku per tier) — separate decision
- Student-facing pricing or upgrade flows of any kind
