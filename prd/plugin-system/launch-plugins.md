# Launch plugins

Five plugins to build first, chosen against three tests at once: they target categories with real
Moodle install counts, they exercise **every** primitive between them (so building them validates
the framework rather than just decorating it), and they fit the company-training niche.

Install counts are from the Moodle plugin directory as cited in the research on
[PR #781](https://github.com/classroomio/classroomio/pull/781).

## 1. Certificate Studio

**Targets:** Custom certificate (31k) + Workplace certificate manager (9.9k) + Workplace course
certificate (8.9k) — roughly 50k installs, the largest single category on the list.

**Primitives:** `defineCertificateTemplate` — declarative only.

`packages/certificates/src/templates/` is five hardcoded modules (`brutalist`, `classique`,
`minimal`, `noir`, `poster`). Turning that into a registry is genuinely small work.

Best ratio of Moodle parity to effort here, and zero security cost: declarative templates execute
no code, so this is the one category that can accept untrusted authors on cloud immediately.

## 2. XP, Streaks & Leaderboard

**Targets:** Level Up! XP (11k). ClassroomIO has nothing — `packages/db/src/schema.ts` has no
badge, xp, streak or leaderboard table.

**Primitives:** `on()` hooks + `defineEntity` + a `dashboard.widgets` slot.

`on('lesson.completed')` and `on('exercise.graded')` award points; an entity stores them; a widget
and an LMS profile panel display them. **No core changes beyond `defineEntity`.**

The poster child for the hook model and the cheapest of the five. Also the best single validation
spike: if a contributor can build this in a weekend from the scaffolder, the primitives are right.

## 3. Course Shells — Tiles, Grid, Top-nav

**Targets:** Tiles format (22k) + Onetopic (10k) + Edwiser Course Formats (9.9k) — roughly 42k
installs. Course formats are one of Moodle's most-loved categories.

**Primitives:** `app.shell` + `course.format` slots.

Doubles as the launch demo. Shipping our own sidebar layout through the same door a contributor
uses is what proves the seam is not a special case.

## 4. Audit Pack — reporting and progress

**Targets:** Configurable Reports (16k) + Completion Progress (17k) + Course dedication (7.5k).

**Primitives:** `report-widget` slots + a plugin page + `defineServerHandler` for scheduled
CSV/PDF export to the compliance owner.

Deliberately **not** Moodle's arbitrary-query report builder. Ship a fixed set of composable report
primitives (cohort × course × status × window) over a permission-filtered read surface. That covers
what the compliance buyer actually needs — *prove to an auditor that these 400 people finished by
this date* — and avoids user-authored SQL.

## 5. Role Play — AI scenario practice

**Targets:** nothing. Moodle has no equivalent; its interactive-content answer is H5P (27k), which
cannot do conversational practice.

**Primitives:** `defineActivityType` + `defineEntity` (transcript, rubric scores) +
`defineServerHandler` (LLM turn loop) + completion/grade write-back.

A manager practises a termination conversation; a nurse practises patient handoff; a rep practises
objection handling. Graded against a rubric, counting toward compliance status like any other
lesson. `packages/ai-assistant` already exists, so the model plumbing is there.

The one where the goal is not parity — it goes where Moodle structurally cannot. Also the hardest,
which is why it is the right final spike: if it works, the primitives are complete.

## Summary

| Plugin | Moodle installs targeted | Primitives | Cost |
| --- | --- | --- | --- |
| Certificate Studio | ~50k | declarative template registry | Small |
| XP & Leaderboard | 11k | hooks + entity + widget slot | Small |
| Course Shells | ~42k | `app.shell` + `course.format` | Medium |
| Audit Pack | ~40k | report slots + page + server handler | Medium |
| Role Play | none — new ground | activity type + entity + server + write-back | Large |

Three of the five need `defineEntity`, which is the argument for pulling it earlier in the
sequencing than its position suggests.

## Deliberately not plugins

**Live-class connectors** (Zoom, 10k) — `lesson.callUrl` and `packages/db/src/queries/attendance/`
already exist.

**SSO** (OpenID Connect, 10k) — shipped: `prd/enterprise-sso [DONE]`, `sso_provider` at
`packages/db/src/schema.ts:95`, `features/settings/pages/sso.svelte`, license-gated. Moodle's OIDC
plugin has 10k installs *because Moodle core does not ship it*; that demand is not inherited.
`auth.provider` still earns its place in the catalog for the tail (LDAP, bespoke IdPs,
HRIS-driven provisioning), just not in the launch five.

Reframing native features as plugins to pad a marketplace count is how ecosystems get a reputation
for being thin.
