# ClassroomIO QA

This is the home base for QA on ClassroomIO. **Test cases live here in the repo; bugs live
in GitHub Issues.** This folder is the *execution layer* on top of
[`FEATURE_AUDIT.md`](../FEATURE_AUDIT.md) (the feature map).

- [`FEATURE_AUDIT.md`](../FEATURE_AUDIT.md) — the **map**: every feature, its user flow, and edge cases, with `file:line` citations.
- [`flows/`](flows/) — the **test plan**: per-flow happy-path checklists you walk through.
- [`TRACKER.md`](TRACKER.md) — the **dashboard**: every flow/feature × tested? × linked GitHub issues × status.
- **GitHub Issues** — the **bug system of record** (filed via the `qa-bug` template, with video).

---

## The workflow

```
Pick a flow (flows/NN-*.md)
  → walk every checklist step in the running app (staging once available, else local)
  → step behaves as "Expected"?  ✔ check it off
  → step misbehaves?             ✘ file a GitHub issue (qa-bug template) + screen recording
                                   then link the issue # in the flow step and in TRACKER.md
  → when all steps walked, mark the flow's row in TRACKER.md
```

**Bug strategy (current phase): log everything, fix in a later pass.** During a walkthrough
you are *discovering and filing*, not fixing — file the bug, link it, keep moving. Fixing
happens later, highest-severity first.

### Definition of done for a flow
- Every checklist step has been executed (checked, or has a linked issue explaining why not).
- Tested in every deployment mode the flow header lists (cloud and/or self-host).
- TRACKER.md row updated with status + issue links.

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
