# ClassroomIO QA

This is the home base for QA on ClassroomIO. **Test cases live here in the repo; bugs live
in GitHub Issues.** This folder is the *execution layer* on top of
[`FEATURE_AUDIT.md`](../FEATURE_AUDIT.md) (the feature map).

- [`FEATURE_AUDIT.md`](../FEATURE_AUDIT.md) — the **map**: every feature, its user flow, and edge cases, with `file:line` citations.
- [`flows/`](flows/) — the **test plan and execution record**: per-flow happy-path checklists you walk through; the checkboxes *are* the progress record.
- **GitHub Issues** — the **bug system of record** (filed via the `qa-bug` template, with video). Live list: [all open QA bugs](https://github.com/classroomio/classroomio/issues?q=is%3Aissue+is%3Aopen+label%3Aqa).
- [Feature coverage map](#feature-coverage-map) (below) — proves every audited feature has a test plan.

---

## The workflow

```
Pick a flow (flows/NN-*.md)
  → walk every checklist step in the running app (staging once available, else local)
  → step behaves as "Expected"?  ✔ check it off
  → step misbehaves?             ✘ file a GitHub issue (qa-bug template) + screen recording
                                   then link the issue # in the flow step, and check it off
```

**Bug strategy (current phase): log everything, fix in a later pass.** During a walkthrough
you are *discovering and filing*, not fixing — file the bug, link it, keep moving. Fixing
happens later, highest-severity first.

### Definition of done for a flow
- Every checklist step has been executed (checked off, or has a linked issue explaining why not).
- Tested in every deployment mode the flow header lists (cloud and/or self-host).

---

## Filing a bug

Open a GitHub issue using the **QA Bug** template (`.github/ISSUE_TEMPLATE/qa-bug.yml`). Every
QA bug must have:
- **Severity** and **Difficulty** labels (rubrics below).
- **Repro steps**, **expected**, **actual**.
- A **screen recording** (your JD requires video on filed bugs).
- The **flow reference** (`qa/flows/NN-*.md` + step number) so it ties back to this plan.
- A **Sentry link** when the bug corresponds to a captured error.

Title convention: `[area] short description` — e.g. `[courses] publishing a course with no sections 500s`.

### Severity (how bad is it?)
| Level | Meaning | Examples |
|-------|---------|----------|
| **S0 — Blocker** | Flow is impossible; data loss; security hole; crash; payments broken | Can't sign up; course save wipes content; auth bypass |
| **S1 — Major** | Core feature broken, no reasonable workaround | Can't publish a course; student can't submit an exercise |
| **S2 — Minor** | Works but wrong/confusing; a workaround exists | Wrong validation message; sort order off; toast missing |
| **S3 — Polish** | Cosmetic / copy / layout / edge-only | Misaligned button; typo; hover state |

### Difficulty (how hard to fix?)
| Level | Meaning |
|-------|---------|
| **Easy** | < 1h, localized to one file/component |
| **Medium** | A few hours, single area/feature |
| **Hard** | Cross-cutting, or root cause unknown / needs investigation |

> Severity drives **order** (fix S0s first); difficulty drives **planning** (batch the easy wins).

### Labels
Create once per repo (see below). Apply on every QA issue:
- `severity:S0-blocker`, `severity:S1-major`, `severity:S2-minor`, `severity:S3-polish`
- `difficulty:easy`, `difficulty:medium`, `difficulty:hard`
- `area:*` (e.g. `area:auth`, `area:courses`, `area:lessons`, `area:exercises`, `area:media`, `area:billing`, `area:programs`, `area:org-site`, `area:api`)
- `qa` (all QA-found bugs, to distinguish from community reports)

```bash
# Run once against the target repo (confirm repo first). Severity:
gh label create "severity:S0-blocker" --color B60205 --description "Flow impossible / data loss / security / crash"
gh label create "severity:S1-major"   --color D93F0B --description "Core feature broken, no workaround"
gh label create "severity:S2-minor"   --color FBCA04 --description "Works but wrong/confusing; workaround exists"
gh label create "severity:S3-polish"  --color 0E8A16 --description "Cosmetic / copy / layout / edge"
# Difficulty:
gh label create "difficulty:easy"   --color C2E0C6 --description "<1h, localized"
gh label create "difficulty:medium" --color FEF2C0 --description "Hours, single area"
gh label create "difficulty:hard"   --color F9D0C4 --description "Cross-cutting / unknown root cause"
gh label create "qa" --color 5319E7 --description "Found during QA walkthrough"
```

### Triage views
- **Fix queue (Week 3/4):** `is:issue is:open label:qa label:severity:S0-blocker` → then S1, S2, S3.
- **Quick wins:** `is:issue is:open label:qa label:difficulty:easy`.

---

## Deployment modes

The product is one codebase with flag-driven divergence on `PUBLIC_IS_SELFHOSTED`
(see FEATURE_AUDIT §5). Some flows must be walked **twice** — once per mode. Each flow
header states which modes apply. High-divergence areas to test in both: signup gating,
onboarding/org creation, billing, analytics, licensing/SSO.

---

## Environments

- **Local:** `pnpm dev` from repo root (boots api + jobs + dashboard + ui and builds shared
  packages). Postgres/Redis via `pnpm docker:start`. Seed demo data + login with
  `pnpm --filter @cio/db db:setup:seed` → `admin@test.com` / `123456`.
- **Staging (Coolify):** preferred target for Week-2 walkthroughs. *Pending credentials.*

---

## Roadmap (JD alignment)

| Phase | Work |
|-------|------|
| Week 1 | Build `qa/` flows covering all 42 features; add `qa-bug` template + labels; get Coolify + Sentry access; share `qa/` PR with **best** for review. |
| Week 2 | Walk every flow on staging; file every bug on GitHub with video; label severity + difficulty. |
| Week 3/4 | Fix bugs highest-severity first. |
| Ongoing | Sentry triage; customer-support bugs; Vitest unit tests for core logic; Cypress E2E mirroring flows 01–04. |

---

## Feature coverage map

Every feature in [`FEATURE_AUDIT.md`](../FEATURE_AUDIT.md) §2 maps to at least one flow, so
nothing is demoed as "shipped" without a test plan. This map is static — execution status
lives in each flow file's checkboxes, not here.

| # | Feature (audit §2) | Covered by flow |
|---|--------------------|-----------------|
| 1 | Authentication & sessions | 01 |
| 2 | Signup gating | 01 |
| 3 | Onboarding & org creation | 01 |
| 4 | Organizations (workspaces) | 01 (create), 10 (settings) |
| 5 | Team / people management | 03 |
| 6 | Courses | 02 |
| 7 | Lessons & lesson editor | 02 |
| 8 | Exercises & questions | 02 (author), 04 (submit) |
| 9 | Course people / enrollment | 03 |
| 10 | Course invites | 03 |
| 11 | Org invites | 03 |
| 12 | Compliance training | 04 |
| 13 | Certificates | 04 |
| 14 | Programs (cohorts) | 06 |
| 15 | Community Q&A | 07 |
| 16 | Course newsfeed | 07 |
| 17 | Attendance | 06 |
| 18 | AI Course Assistant | 05 |
| 19 | AI Lesson Tutor | 05 |
| 20 | AI credits / token billing | 13 |
| 21 | Course import | 09 |
| 22 | Media manager | 09 |
| 23 | Tags | 10 |
| 24 | Org public site (org-site) | 08 |
| 25 | Custom domains | 10 |
| 26 | Course widget embed | 10 |
| 27 | Public REST API (v1) | 11 |
| 28 | Automation / API keys | 11 |
| 29 | MCP server | 11 |
| 30 | Enterprise SSO | 12 |
| 31 | Token auth | 12 |
| 32 | Licensing | 12 |
| 33 | Billing (Polar) | 13 |
| 34 | Analytics | 10 |
| 35 | Email / notifications | 01, 03, 04 (observed in-flow) |
| 36 | Background jobs | 09 (media), admin/queues |
| 37 | Unsplash image search | 02 (content image picker) |
| 38 | Marketing website | 08 |
| 39 | Documentation site | 08 |
| 40 | Outbound webhooks | ⚠️ verify NOT shipped (audit §7.1) |
| 41 | SCORM support | ⚠️ verify NOT shipped (audit §7.2) |
| 42 | In-app notification system | ⚠️ verify NOT shipped (audit §7.3) |

> Items 40–42 are PRD-only stubs per the audit. For these, "testing" means **confirming the
> feature is not exposed** in the UI/API so it isn't demoed as shipped — record the result in
> the relevant flow file.
