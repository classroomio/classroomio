---
name: Website Customer-Education Positioning
overview: Rewrite apps/website to lead unambiguously with customer education for SaaS as the primary wedge. Compliance, partner training, and internal academy stay as supporting use cases. Target reader is a CS / Customer Education leader at a B2B SaaS company who should immediately recognize "this is for me" on the homepage. Grounded in shipped features only — no marketing of unbuilt integrations or capabilities.
todos:
  - id: hero-rewrite
    content: Replace the wedge-agnostic homepage hero copy with a customer-education-first headline and subhead; swap the hero visual to a branded customer academy
    status: pending
  - id: homepage-section-reorder
    content: Reorder homepage section blocks in +page.svelte to the new flow (Hero → TrustBand → ROI → AI Builds → Brand/Domain → AI Tutor → Certs+Programs → API/Automation → Multi-Academy → OSS → Testimonial → CTA)
    status: pending
  - id: trustband-on-home
    content: Promote the existing TrustBand component from /customer-education to the homepage (Built for product-led SaaS)
    status: pending
  - id: roi-band
    content: Add a "Why customer education, why now" section to the homepage and the /customer-education page with industry stats (+22% retention, +38% adoption, -6.1% support costs) with source attribution
    status: pending
  - id: ai-builds-academy-section
    content: Build a new homepage section highlighting AI course creation (templates + assistant) and the MCP server for agent-driven course authoring — currently underused in marketing
    status: pending
  - id: multi-academy-section
    content: Add a "One account, multiple academies" homepage section explaining multi-workspace (customer-facing + internal + partner portals, each with own brand and domain)
    status: pending
  - id: programs-section
    content: Add a "Many programs in every academy" section highlighting programs as the multi-track primitive (Onboarding, Admin Cert, Power-User Track)
    status: pending
  - id: vs-help-docs-section
    content: Add a "vs help docs" comparison section/table on the /customer-education page positioning the academy against Intercom Articles, Zendesk Guide, Confluence
    status: pending
  - id: nav-reorder
    content: Reorder Solutions in navigation.svelte to Customer Education → Compliance → Internal Training; fold Partner Training into Customer Education or rewrite it (see partner-training-rewrite)
    status: pending
  - id: nav-developers-dropdown
    content: Add a new top-level "Developers" dropdown to navigation.svelte containing Automation (API + webhooks + MCP), Docs (API reference + self-hosting), MCP Recipes (/mcp-recipes), and GitHub.
    status: pending
  - id: page-vs-help-docs
    content: Create /customer-ed/vs-help-docs page — direct comparison vs Intercom Articles / Zendesk Guide / Confluence; SEO-targeted at "alternative to" queries
    status: pending
  - id: page-templates
    content: Create /templates page — public gallery of AI course templates from packages/ai-assistant/src/templates (Product 101, Onboarding, Expert). Audience is course creators / CS leaders, not developers. Top-level route; linked from homepage hero/section + customer-education page + footer. Do not put it under the Developers dropdown.
    status: pending
  - id: page-automation
    content: Create /automation page (replaces planned /integrations) — covers public API, webhooks, MCP server. Lives under the new Developers nav dropdown. No integration logo grid; no fake logos.
    status: pending
  - id: page-mcp-recipes
    content: Create /mcp-recipes page — public gallery of agent prompts/workflows using ClassroomIO's MCP server. The developer-side analog to /templates. Ship 12 recipes grouped by category (Course creation, Content updates, Bulk ops, Publishing, Power user). Lives under the new Developers nav dropdown.
    status: pending
  - id: partner-training-rewrite
    content: Rewrite /partner-training to lead with the multi-workspace pattern ("spin up a dedicated partner workspace alongside your customer academy")
    status: pending
  - id: compliance-page-soften
    content: Soften /compliance-training claims — remove "7-state compliance lifecycle" overclaim and any "audit log export" mention; current module is basic status tracking only
    status: pending
  - id: footer-cta-rewrite
    content: Rewrite the homepage footer CTA to be customer-education specific (replace "Stop chasing training completion manually" with something like "Stop forwarding help articles to every new customer")
    status: pending
  - id: remove-overweight-sections
    content: Move LearnerSection, QuestionTypes, and CertEditorSection off the homepage into feature deep-dive pages; keep linked but de-emphasized
    status: pending
  - id: language-claim-soften
    content: Soften any "10 languages" claim to "Deliver lessons in 10 languages" since UI translation is incomplete
    status: pending
  - id: seo-target-mapping
    content: Map each new/updated page to a primary SEO target keyword and set page metaTags accordingly
    status: pending
  - id: dont-market-list
    content: Audit all pages and remove copy that markets unbuilt capabilities — native integrations (Salesforce/HubSpot/Slack/etc), SCIM, audit-log export, SCORM/xAPI
    status: pending
isProject: true
---

# Website Customer-Education Positioning PRD

## Status

- Draft (2026-05-15)
- Owner: TBD
- Source: `company/website-customer-ed-pivot.md`

## Problem

The current `apps/website` homepage treats all four use cases — customer education, compliance, partner training, internal academy — as equal. The hero copy says *"...for teams, customers, and partners."* This produces a wedge-agnostic page where a VP Customer Education at a B2B SaaS company cannot immediately recognize that the product is for them.

The strongest opportunity is **customer education for SaaS** — fastest-growing segment, weakest entrenched competition in the SMB / mid-market slice, strongest ROI proof points. The website needs to commit to that wedge.

The dedicated `/customer-education` page is already strong (~574 lines) but doesn't get the homepage traffic that should funnel into it.

## Goals

1. Make customer education for SaaS the unambiguous primary wedge on the homepage
2. Surface shipped-but-underused capabilities: AI course creation, MCP server, multi-workspace, programs
3. Strengthen the `/customer-education` page with ROI proof, comparison vs help docs, and the multi-academy / many-programs story
4. Add supporting pages a CS / Customer Education leader expects: vs-help-docs comparison, template gallery, automation/API page
5. Demote (don't kill) compliance and partner-training pages; rewrite partner-training around multi-workspace
6. Keep all copy grounded in shipped features — no fake integration logos, no SCIM, no audit-log export, no SCORM

## Non-goals

- Pricing changes or any references to plan/tier mechanics on the marketing site
- Building an ROI calculator
- A native-integration logo grid (we don't have native integrations)
- Building new product features (this PRD covers website only)
- Translating the marketing site into multiple languages
- Redesigning the visual system beyond what the section reorder needs

## Users & jobs

| Persona | Job |
|---|---|
| **VP / Director Customer Education** at a B2B SaaS company (50–500 employees) | "I need to launch a customer academy to reduce support load and drive feature adoption. Is this the right tool?" |
| **CS leader evaluating Skilljar / Intellum / Northpass alternatives** | "Show me how this compares, with a credible product depth and lower friction." |
| **PLG founder / head of CX** at a Series A/B SaaS | "I want a branded learning portal under our domain — fast, AI-assisted, not a generic LMS." |
| **Compliance / partner-program lead** | (Secondary) "Can this do my use case too?" — should still find a clear path two clicks deep |

## Approach

### Homepage rewrite

**New hero copy (replaces wedge-agnostic copy in `apps/website/src/lib/components/hero.svelte`):**

- Headline: *"Teach your customers your product before support has to."*
- Subhead: *"Launch a branded customer academy in days. Train customers, certify power-users, drive adoption — under your own domain, with an AI tutor in every lesson."*
- Primary CTA: *"Launch your academy free →"*
- Secondary CTA: *"See a live academy"*
- Hero visual: a branded customer academy in a browser (e.g. `learn.acme.com`), not the current compliance/security mix

**New homepage section order in `apps/website/src/routes/+page.svelte`:**

| # | Section | Source |
|---|---|---|
| 1 | Hero (customer-education first) | Rewrite |
| 2 | TrustBand — "Built for product-led SaaS" | Promote from `/customer-education` |
| 3 | "Why customer education, why now" — ROI band | New |
| 4 | "AI builds the academy" — templates + chat + MCP | New |
| 5 | "Your brand, your domain" — custom domain + white-label | Existing FeaturesSection, retitle |
| 6 | "AI tutor in every lesson" | Existing AiSection, reframe for adoption |
| 7 | "Verifiable certificates + programs" | Combine existing cert sections |
| 8 | "API, webhooks, MCP — automate everything" | New (no logo grid) |
| 9 | "One account, multiple academies" | New |
| 9b | "Many programs in every academy" | New |
| 10 | "Open source, self-host, no per-seat fees" | New |
| 11 | Testimonial + CTA — customer-ed–specific | Rewrite footer CTA |

**Sections to remove from homepage** (move to feature deep-dive pages, still linked from nav/footer):

- `LearnerSection`
- `QuestionTypes`
- `CertEditorSection`

### Navigation update (`apps/website/src/lib/components/navigation.svelte`)

Reorder Solutions:

1. **Customer Education** (primary, subhead "Customer academies for SaaS")
2. Compliance Training
3. Internal Training
4. Partner Training — rewritten around multi-workspace (or folded into Customer Education)

**Add a new top-level "Developers" dropdown** containing:

- **Automation** → `/automation` (API + webhooks + MCP overview)
- **Docs** → API reference + self-hosting guide
- **MCP Recipes** → `/mcp-recipes` (developer activation gallery)
- **GitHub** → repo link

This is the right home for the OSS + API + MCP positioning that doesn't fit under Solutions.

`/templates` does **not** belong under Developers — it's a content / activation surface for course creators (CS leaders building academies), so it sits as a top-level route linked from the homepage and `/customer-education`. The developer-side analog is `/mcp-recipes`.

### `/customer-education` page enhancements

The page is already substantial. Add three things:

1. **ROI proof band** near the top: "+22% retention, +38% adoption, -6.1% support costs" with industry-stat source attribution
2. **"vs help docs" comparison section** — direct fair-fight against Intercom Articles, Zendesk Guide, Confluence (which we win on certification, programs, AI tutor, analytics)
3. **"One account, multiple academies" + "Many programs per academy"** — explain multi-workspace + programs as separate but complementary patterns

Do NOT add an integration logo grid (no native integrations).

### New pages

| Page | Lives under | Purpose | Primary SEO target |
|---|---|---|---|
| `/customer-ed/vs-help-docs` | Solutions › Customer Education | Captures "alternative to Intercom Articles / Zendesk" intent | "alternative to intercom articles", "customer academy vs help docs" |
| `/templates` | Top-level (linked from homepage section + `/customer-education` + footer). **Not** under Developers — audience is course creators / CS leaders. | Public gallery of AI course templates | "customer onboarding course template" |
| `/automation` | **Developers (new dropdown)** | Public API + webhooks + MCP server | "lms api", "open source lms api", "mcp lms" |
| `/mcp-recipes` | **Developers (new dropdown)** | Gallery of agent prompts/workflows using ClassroomIO's MCP server — developer-side analog to /templates | "mcp examples", "claude mcp lms", "claude course automation" |

### Rewrites / softening

| Page | Change |
|---|---|
| `/partner-training` | Rewrite around multi-workspace: "Spin up a dedicated partner workspace alongside your customer academy — separate brand, separate domain, one bill." |
| `/compliance-training` | Soften "7-state compliance lifecycle" to "track compliant / expiring / non-compliant"; remove any "audit export" mention; module is basic status tracking only |
| Homepage footer CTA | Replace "Stop chasing training completion manually" with customer-ed-specific copy (e.g. "Stop forwarding help articles to every new customer") |
| Any page mentioning "10 languages" | Soften to "Deliver lessons in 10 languages" — UI translation is incomplete |

### Honest-claims rules (applies to every page)

- Don't list native integrations (Salesforce, HubSpot, Slack, Zapier, Notion, GitHub, Intercom, Zendesk, Segment) — none are built
- Don't mention SCIM, audit log export
- Don't mention SCORM / xAPI
- Don't pitch sub-orgs / nested tenancy as separate from multi-workspace (they are the same shipped feature)
- "Multi-tenant" = per-org branded academies AND multi-workspace under one account (both shipped)

## Functional requirements

### Components touched

- `apps/website/src/routes/+page.svelte` — section reorder
- `apps/website/src/lib/components/hero.svelte` — copy + visual rewrite
- `apps/website/src/lib/components/navigation.svelte` — reorder, add Customers link
- `apps/website/src/lib/components/trust-band.svelte` — promote to homepage
- `apps/website/src/lib/components/features-section.svelte` — retitle for branded-academy framing
- `apps/website/src/lib/components/ai-section.svelte` — reframe for adoption
- `apps/website/src/lib/components/page-signup-cta.svelte` — rewrite copy
- Existing wedge pages (`customer-education`, `compliance-training`, `partner-training`) — content updates per above

### New components (likely)

- ROI band component (reusable on homepage and `/customer-education`)
- "AI builds the academy" section (templates + chat + MCP triple)
- "One account, multiple academies" section (multi-workspace pitch)
- "Many programs per academy" section (programs pitch)
- "vs help docs" comparison table component
- Case-study card component

### New routes

- `apps/website/src/routes/(marketing)/customer-education/vs-help-docs/+page.svelte` (match existing marketing-group pattern)
- `apps/website/src/routes/templates/+page.svelte`
- `apps/website/src/routes/automation/+page.svelte`
- `apps/website/src/routes/mcp-recipes/+page.svelte`

### `/mcp-recipes` page spec

**Top of page:**
- Hero — *"Build and manage courses with your AI agent. 12 recipes using ClassroomIO's MCP server."*
- 3-step setup: install MCP, connect ClassroomIO, paste a recipe
- "Why MCP" 2-line explainer for non-technical readers

**Body:**
- Filter chips by category (Course creation / Content updates / Bulk ops / Publishing / Power user)
- Grid of recipe cards

**Per recipe card → detail page:**
- Title + 1-line outcome
- Use case ("when to reach for this")
- **Copyable prompt** — the actual text to paste into an agent

### Recipes to ship at v1 (12 total)

**Course creation (4):**
1. Create a course from a PDF
2. Spin up a Customer Onboarding academy from your docs site
3. Convert a Loom recording (transcript) into a lesson
4. Generate a course from a one-line brief

**Content updates (3):**
5. Regenerate quiz questions for an existing course
6. Translate a course's lessons to Spanish
7. Rewrite a course landing page for a new audience

**Bulk ops (2):**
8. Re-tag every course by topic using AI
9. Reorder lessons across multiple courses for consistency

**Publishing (2):**
10. Publish a draft to production
11. Clone a flagship course into a new program

**Power user (1):**
12. Daily course-health digest (list courses, summarize completion, post to Slack via webhook)

### SEO

- Each new page sets primary keyword in metaTags
- Internal linking: homepage → customer-education → vs-help-docs / case-studies / templates / automation
- Keep existing `docs-vs-company-academy` page; cross-link

## Success metrics

- **Homepage clarity:** qualitative — usability test with 3–5 CS leaders; can they describe the product in one sentence after 30 seconds?
- **Customer-ed page traffic:** % of homepage sessions that click through to `/customer-education` — track increase post-launch
- **Demo / trial signups attributed to customer-ed pages:** baseline now, target 2× by month 3
- **Developers dropdown engagement:** clicks on the new Developers nav item; visits to `/automation`, `/mcp-recipes`, and self-host docs
- **SEO rankings:** track positions for "customer academy software", "customer education platform", "alternative to skilljar/intellum", "open source LMS for customer education"
- **No regression** in compliance / partner / internal-training conversion paths (they remain reachable, just demoted)

## Rollout plan

### Week 1 — homepage + nav
- Hero rewrite, section reorder, nav reorder
- Add new **Developers** dropdown
- Footer CTA rewrite
- Promote TrustBand to homepage
- Soften any unbuilt-feature claims sitewide

### Week 2 — customer-education page enhancements
- ROI band
- vs-help-docs section / table
- Multi-academy + many-programs sections

### Week 3 — supporting pages
- `/templates` (gallery from AI templates)
- `/automation` (API + webhooks + MCP) under Developers
- `/mcp-recipes` (12 agent recipes) under Developers

### Week 4 — rewrites
- `/partner-training` rewrite around multi-workspace
- `/compliance-training` softening pass
- `/customer-ed/vs-help-docs` page

## Open questions

1. **Hero visual asset:** do we have a usable screenshot of a real branded academy, or do we need a mockup designed?
2. **Partner-training nav slot:** keep it as a top-level Solutions item or fold into Customer Education? Recommend: keep as its own item now that multi-workspace makes it real.
3. **Internal training:** does it need its own page or is it adequately covered by the demoted Compliance + Partner pattern? Recommend: defer until there is signal from inbound.
4. **vs-help-docs page tone:** direct and named (Intercom Articles, Zendesk Guide, Confluence) or generic? Recommend: named — captures the comparison intent and is fair.
5. **Developers dropdown items beyond /automation:** include /docs route if one exists; otherwise the dropdown is API + self-host + GitHub for v1.
6. **Case studies:** noted absent for v1; revisit when we have a named customer willing to be quoted. Footer CTA + testimonials remain as social proof in the meantime.

## Risks

- **Wedge over-narrowing** alienates compliance/internal/partner inbound. Mitigation: keep those pages live and reachable two clicks deep; don't delete content.
- **Hero copy too cute** ("before support has to") may not match buyer phrasing. Mitigation: A/B test against a more literal alternative in week 2.
- **New pages launched with thin content** dilute brand. Mitigation: case-studies allowed placeholder; vs-help-docs and templates require real content before launch.
- **Sectional bloat** if every new section is added without removing the moved-off ones. Mitigation: keep the section-removal todos paired with the new-section work.

## Out of scope

- Any pricing-page changes
- Visual redesign / theme work
- Dashboard / product UI changes
- Translation of marketing site
- Building the ROI calculator
- Building native CRM / support-tool integrations
