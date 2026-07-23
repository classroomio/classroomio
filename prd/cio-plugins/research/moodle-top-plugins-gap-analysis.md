# Moodle's most-installed plugins vs. the proposed framework

A reality check: would the proposed ClassroomIO plugin framework actually let people build
alternatives to the plugins people _actually install_ on Moodle? This compares the most-installed
Moodle plugins (from the Moodle Marketplace, sorted by installs) against the framework's
extension points and runtime tiers, and is honest about what does not fit.

## The top Moodle plugins (by installs)

Custom certificate (31k), H5P Interactive Content (27k), Moove theme (27k), Attendance (22k),
Tiles format (22k), Completion Progress (17k), Questionnaire (17k), Configurable Reports (16k),
Academi theme (12k), Level Up XP gamification (11k), Moodle eMail Test (11k), Zoom (10k),
Onetopic format (10k), OpenID Connect (10k), Edwiser Course Formats (9.9k), Workplace
certificate manager (9.9k), Workplace course certificate (8.9k), Checklist (8.6k), Game (8.5k),
Boost Union theme (8.5k), Word Import/Export for Book (8.4k), Group choice (7.8k), FilterCodes
(7.8k), Course dedication (7.5k).

The short verdict: **yes for the clear majority, but this list exposes ~3 concrete gaps** that
would need to be added before it is fully true.

---

## Scorecard

| Moodle plugin (installs)                                                          | Maps to                                                              | Verdict                                                                            |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Custom certificate (31k), Workplace certificate manager (9.9k), course cert (8.9k)| `certificate-template` (declarative + browser)                       | Buildable — a certificate engine already exists                                   |
| Level Up XP – gamification (11k)                                                  | `event-handler` hooks + plugin storage + `report-widget` (leaderboard)| Buildable — poster child for the hook model, **but needs plugin storage (gap)**   |
| Completion Progress (17k), Course dedication (7.5k)                               | `report-widget` reading progress/completion scopes                  | Buildable — clean fit                                                              |
| FilterCodes (7.8k) — 200 `{firstname}`-style dynamic tags                         | `filter('content.render', …)` hook                                   | Buildable — textbook WordPress-filter fit                                         |
| Zoom meeting (10k)                                                                | `lesson-block` + `event-handler` + external OAuth (server runtime)   | Buildable — classic integration / LTI-webhook shape                              |
| OpenID Connect / SSO (10k)                                                        | `auth-provider` (Better Auth)                                        | Buildable — in catalog (verified/first-party tier)                               |
| Word Import/Export for Book (8.4k)                                                | `content-importer`                                                   | Buildable — in catalog                                                            |
| H5P Interactive Content (27k)                                                     | `content-block` (iframe) playing `.h5p`                             | A player/embed block is buildable; re-creating H5P's whole authoring suite is a big lift |
| Configurable Reports (16k) — no-SQL report builder                               | `dashboard-page` + REST query                                       | Partial — only as far as the REST API exposes queryable, permission-filtered entities |
| Attendance (22k), Questionnaire (17k), Checklist (8.6k), Game (8.5k), Group choice (7.8k) | `content-block`/activity that stores its own learner data + reports completion | Needs **plugin-scoped storage** + **completion/grade write-back** (gaps)          |
| Tiles format (22k), Onetopic (10k), Edwiser Course Formats (9.9k)                | —                                                                   | **No `course-format` extension point in the original proposal** (gap)             |
| Moove (27k), Academi (12k), Boost Union (8.5k) — full themes                     | `theme` (declarative only)                                          | Not on cloud — full template control is a self-host `server-native` concern       |
| Moodle eMail Test (11k) — SMTP diagnostics                                        | `dashboard-page` (admin)                                            | Not on cloud — needs server/SMTP-level access; self-host only                     |

Roughly: **~13 of the top ~24 are clean fits, ~7 more become buildable once a few capabilities
are added, and ~4 are genuine cloud limitations** (three of which are full themes).

---

## The 3 gaps this list reveals

1. **A `course-format` / `course-layout` extension point is missing — and it is big.** Tiles,
   Onetopic, and Edwiser are 3 of the top ~15 (40k+ combined installs). Course formats are one
   of Moodle's most-loved categories. The original catalog had `lesson-block` but nothing that
   lets a plugin re-render the _course shell_ (how modules/sections are laid out). Add a
   `course-format` extension point (a browser-runtime plugin that renders the course page from a
   provided course model via the iframe host). This alone unlocks a popular category. (This gap
   is now reflected in the extension-point catalog in `plugin-framework-design.md`.)

2. **Plugin-scoped persistent storage is missing — it blocks all "activity" plugins.**
   Attendance, Questionnaire, Checklist, Game, Group choice, and Level Up XP all store their
   _own_ learner data. Today a plugin can only read via the API or stash data on its own external
   server (server runtime). To make these easy, add a **scoped storage API** in
   `@classroomio/plugin-sdk` (per-org, per-plugin key-value or small tables, permission-gated) so
   a community dev does not need to host a backend just to track attendance. This is the single
   highest-leverage addition for Moodle parity.

3. **A completion/grade write-back API is needed** so activity plugins can mark a lesson complete
   or push a score — the equivalent of LTI's Assignment & Grade Services. Without it, an
   "activity" plugin can render and store data but cannot participate in progress/certificates.
   Add `completion:write` / `grade:write` scopes and endpoints.

Two smaller notes:

- **Configurable Reports** is only as powerful as the REST API's read surface — a real report
  builder needs broad, permission-filtered querying. Worth deciding how far to expose that.
- **Themes and server diagnostics (eMail Test)** are honest ceilings on multi-tenant cloud: full
  theming and server-level tools should be `server-native` (self-host) or first-party only.
  Declarative theming covers the common 80%.

---

## Bottom line

The three primitives (provide / hook / page) and three runtime tiers are the right shape —
certificates, gamification, integrations, SSO, importers, filters, and progress/report blocks all
fall out naturally, which already covers a big chunk of Moodle's most-installed plugins. To make
the claim "people can build alternatives to _these_ plugins" fully true, add **(1) a
course-format extension point, (2) plugin-scoped storage, and (3) completion/grade write-back**.
With those three, the framework would cover the large majority of the top list; the only
categories deliberately _not_ matched on cloud are full custom themes and server-level admin
tools, which is a reasonable and defensible line.
