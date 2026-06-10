# QA Tracker

At-a-glance status. **Bugs live in GitHub Issues** — this file only links to them, it does
not duplicate bug detail. See [`README.md`](README.md) for the workflow and rubrics.

Status legend: ⬜ not started · 🟡 in progress · ✅ walked (all steps) · 🔁 re-test after fix

---

## A. Flow status

| Flow | Personas | Modes | Status | Open issues (by severity) |
|------|----------|-------|--------|---------------------------|
| [01 Admin signup & onboarding](flows/01-admin-signup-onboarding.md) | Admin | cloud + self-host | ⬜ | — |
| [02 Course authoring](flows/02-course-authoring.md) | Admin/Tutor | both | ⬜ | — |
| [03 People, invites & roles](flows/03-people-invites-roles.md) | Admin/Tutor → Student | both | ⬜ | — |
| [04 Student learning → certificate](flows/04-student-learning-to-certificate.md) | Student | both | ⬜ | — |
| [05 AI assistant & tutor](flows/05-ai-assistant-and-tutor.md) | Admin/Tutor, Student | both (key-gated) | ⬜ | — |
| [06 Programs (cohorts) & attendance](flows/06-programs-cohorts.md) | Admin/Tutor, Student | both | ⬜ | — |
| [07 Community & newsfeed](flows/07-community-and-newsfeed.md) | All | both | ⬜ | — |
| [08 Org public site & marketing](flows/08-org-public-site-and-enrollment.md) | Guest/Visitor | both | ⬜ | — |
| [09 Media & course import](flows/09-media-and-import.md) | Admin/Tutor | both | ⬜ | — |
| [10 Org settings, tags, domains, widgets, analytics](flows/10-org-settings-tags-domains-widgets.md) | Admin | both | ⬜ | — |
| [11 Public API, MCP & automation keys](flows/11-public-api-mcp-automation.md) | Admin / integrator | both | ⬜ | — |
| [12 Enterprise SSO, token auth & licensing](flows/12-enterprise-sso-token-licensing.md) | Admin | self-host (licensed) | ⬜ | — |
| [13 Billing & AI credits](flows/13-billing-and-ai-credits.md) | Admin | cloud only | ⬜ | — |

---

## B. Feature coverage matrix (proves all 42 audit features are covered)

Every feature in `FEATURE_AUDIT.md` §2 maps to at least one flow. Update **Status** as you go.

| # | Feature (audit §2) | Covered by flow | Status |
|---|--------------------|-----------------|--------|
| 1 | Authentication & sessions | 01 | ⬜ |
| 2 | Signup gating | 01 | ⬜ |
| 3 | Onboarding & org creation | 01 | ⬜ |
| 4 | Organizations (workspaces) | 01 (create), 10 (settings) | ⬜ |
| 5 | Team / people management | 03 | ⬜ |
| 6 | Courses | 02 | ⬜ |
| 7 | Lessons & lesson editor | 02 | ⬜ |
| 8 | Exercises & questions | 02 (author), 04 (submit) | ⬜ |
| 9 | Course people / enrollment | 03 | ⬜ |
| 10 | Course invites | 03 | ⬜ |
| 11 | Org invites | 03 | ⬜ |
| 12 | Compliance training | 04 | ⬜ |
| 13 | Certificates | 04 | ⬜ |
| 14 | Programs (cohorts) | 06 | ⬜ |
| 15 | Community Q&A | 07 | ⬜ |
| 16 | Course newsfeed | 07 | ⬜ |
| 17 | Attendance | 06 | ⬜ |
| 18 | AI Course Assistant | 05 | ⬜ |
| 19 | AI Lesson Tutor | 05 | ⬜ |
| 20 | AI credits / token billing | 13 | ⬜ |
| 21 | Course import | 09 | ⬜ |
| 22 | Media manager | 09 | ⬜ |
| 23 | Tags | 10 | ⬜ |
| 24 | Org public site (org-site) | 08 | ⬜ |
| 25 | Custom domains | 10 | ⬜ |
| 26 | Course widget embed | 10 | ⬜ |
| 27 | Public REST API (v1) | 11 | ⬜ |
| 28 | Automation / API keys | 11 | ⬜ |
| 29 | MCP server | 11 | ⬜ |
| 30 | Enterprise SSO | 12 | ⬜ |
| 31 | Token auth | 12 | ⬜ |
| 32 | Licensing | 12 | ⬜ |
| 33 | Billing (Polar) | 13 | ⬜ |
| 34 | Analytics | 10 | ⬜ |
| 35 | Email / notifications | 01, 03, 04 (observed in-flow) | ⬜ |
| 36 | Background jobs | 09 (media), admin/queues | ⬜ |
| 37 | Unsplash image search | 02 (content image picker) | ⬜ |
| 38 | Marketing website | 08 | ⬜ |
| 39 | Documentation site | 08 | ⬜ |
| 40 | Outbound webhooks | ⚠️ verify NOT shipped (audit §7.1) | ⬜ |
| 41 | SCORM support | ⚠️ verify NOT shipped (audit §7.2) | ⬜ |
| 42 | In-app notification system | ⚠️ verify NOT shipped (audit §7.3) | ⬜ |

> Items 40–42 are PRD-only stubs per the audit. For these, "testing" means **confirming the
> feature is not exposed** in the UI/API so it isn't demoed as shipped — record the result here.
