# ClassroomIO Comparison Pages PRD

Status: Draft  
Owner: Marketing / Website  
Prepared: 2026-05-12  
Source basis: `apps/dashboard` product surface plus current public competitor pages.

## Summary

Create comparison pages that position ClassroomIO against 10 incumbent learning platforms. The page set should help buyers who are evaluating hosted course platforms, community-led learning products, company training LMS tools, and open-source/self-hosted LMS options.

The first batch should include 7 SaaS competitors and 3 open-source incumbents:

1. Thinkific
2. Teachable
3. Kajabi
4. LearnWorlds
5. Mighty Networks
6. Circle
7. TalentLMS
8. Moodle
9. Open edX
10. Canvas LMS

## ClassroomIO Product Surface

Based on `apps/dashboard`, ClassroomIO should be positioned as a modern learning platform for organizations that need to create, deliver, manage, and automate learning without stitching together a course tool, community tool, assessment tool, and custom portal.

Core product capabilities to emphasize:

- Course creation with sections, lessons, lesson ordering, course cloning, public/private publishing, landing pages, and settings.
- Rich lesson content including notes, documents, slides, uploaded videos, YouTube, Google Drive video, video transcripts, comments, and AI lesson assistance.
- Exercises and assessments with multiple question types, sections, submissions, manual/assisted grading, marks, and student-level review.
- Certificates with course completion flows, certificate settings, certificate editor, issue flows, and reports.
- Attendance and compliance-oriented course management.
- People management with invites, tutors, bulk email invites, enrollment management, QR sharing, and audience import.
- Analytics for students, progress, lessons, and exercises.
- Programs with courses, people, newsfeed, and settings.
- Communities, discussions, ask flows, course newsfeed, comments, voting, and learner-facing community pages.
- Organization dashboard, audience management, tags, media library, widgets, embedded course displays, organization landing page, and LMS customization.
- Business features including billing, custom domains, organization/team settings, SSO, token auth, API, Zapier, MCP, automation, and AI credits.
- Learner experience with explore, my learning, exercises, programs, settings, and public org/course pages.
- Self-hosting posture is relevant because the site already has self-host/open-source content and the dashboard has org/site-level architecture.

## Goals

- Capture high-intent search demand for "[competitor] alternative", "ClassroomIO vs [competitor]", and "[competitor] vs ClassroomIO".
- Position ClassroomIO as a flexible learning operating system for course businesses, training teams, and education organizations.
- Make the comparison pages useful enough that they can stand alone as buyer enablement assets, not just SEO landing pages.
- Route users from competitor-specific objections into the right ClassroomIO strengths: assessments, certificates, communities, org portals, widgets, integrations, AI, API/MCP, custom domains, SSO, and self-host/control.

## Non-Goals

- Do not attack competitors with unverifiable claims.
- Do not claim exact ClassroomIO superiority where the competitor has mature capabilities ClassroomIO may not fully match yet.
- Do not publish pricing claims without source dates and links.
- Do not build the pages in this PRD. Another agent will implement from this analysis.

## Information Architecture

Recommended route pattern:

- `/compare`
- `/compare/thinkific`
- `/compare/teachable`
- `/compare/kajabi`
- `/compare/learnworlds`
- `/compare/mighty-networks`
- `/compare/circle`
- `/compare/talentlms`
- `/compare/moodle`
- `/compare/open-edx`
- `/compare/canvas-lms`

The `/compare` index should group competitors by buyer type:

- Course platforms: Thinkific, Teachable, Kajabi, LearnWorlds
- Community learning platforms: Mighty Networks, Circle
- Company LMS platforms: TalentLMS
- Open-source LMS platforms: Moodle, Open edX, Canvas LMS

## Required Footer Update

The website footer must be updated when these pages launch.

Implementation requirement:

- Add a "Compare" or "Alternatives" footer column/section in `apps/website/src/lib/components/footer.svelte`.
- Link to `/compare` and all 10 comparison pages, or link to `/compare` with the top 4 pages directly if the footer becomes too dense.
- Suggested direct footer links: `Thinkific alternative`, `Teachable alternative`, `Kajabi alternative`, `Moodle alternative`, and `All comparisons`.
- Footer copy should avoid hardcoded claims like "better than X". Use neutral labels such as "Compare ClassroomIO to Thinkific".

## Page Template

Each comparison page should use the same structure:

1. Hero
   - H1: `ClassroomIO vs [Competitor]`
   - Subhead: one-sentence positioning that names the buyer and primary tradeoff.
   - CTA: Start free / Book demo / View pricing, depending on current website CTA conventions.

2. Quick verdict
   - "Choose ClassroomIO if..."
   - "Choose [Competitor] if..."
   - Keep this honest and practical.

3. Feature comparison table
   - Course builder
   - Assessments/exercises
   - Certificates
   - Communities/discussions
   - Learner portal
   - Custom domain/branding
   - Widgets/embed
   - Analytics
   - SSO/auth
   - API/integrations
   - AI assistance
   - Self-host/control, only where relevant

4. Pricing comparison
   - Include "Pricing verified on 2026-05-12" and source link.
   - Use "published pricing" language.
   - For open-source projects, separate software license cost from hosting, support, implementation, and managed cloud costs.

5. Migration considerations
   - What data/assets customers may need to move.
   - What workflows differ.
   - What ClassroomIO can replace directly versus what may require setup.

6. Best-fit use cases
   - 3 to 5 bullets.

7. FAQ
   - 4 to 6 competitor-specific questions.

## Shared Positioning

Primary ClassroomIO angle:

ClassroomIO is for teams that want a modern course and learning platform with assessments, certificates, learner management, communities, organization portals, integrations, and AI-assisted authoring in one place.

Secondary angles:

- More learning-native than creator storefront tools.
- More modern and easier to operate than traditional/open-source LMS stacks.
- More flexible for education businesses than community-only products.
- More approachable for growing teams than enterprise LMS products.

## Competitor Research Briefs

### 1. Thinkific

Category: Hosted course platform  
Recommended page slug: `/compare/thinkific`  
Primary search intent: "Thinkific alternative", "Thinkific vs ClassroomIO", "best Thinkific alternative"

Public positioning:

- Thinkific is a platform for creating, marketing, selling, and delivering online courses, communities, memberships, and digital products.
- Pricing page currently presents tiers including Basic, Start, Grow, and Plus. Public entry pricing varies by billing cadence and promotions, so cite the page directly at publish time.

Pricing research:

- Source: https://www.thinkific.com/pricing/
- Verify again before launch. Pricing pages are high-change surfaces.

ClassroomIO comparison angle:

- Use when buyers want more than a course storefront: assessments, grading, certificates, org/audience management, learner operations, widgets, API/MCP, and training workflows.
- Thinkific is strong for course sales and creator businesses. ClassroomIO should be framed as stronger for structured learning delivery, teams, education businesses, and organizations that need learning operations.

Feature notes:

- Thinkific has mature course commerce and course site features.
- ClassroomIO should emphasize exercises/submissions/marks, certificates, compliance/attendance, programs, widgets, learner/community surfaces, and technical extensibility.

Choose ClassroomIO if:

- You need structured assessments and grading workflows.
- You manage learners, tutors, cohorts, programs, or organizations.
- You want course widgets, API/MCP/Zapier, custom domains, and an organization learning portal.

Choose Thinkific if:

- Your main goal is selling self-paced courses with a mature creator commerce stack.
- You want a large hosted course platform ecosystem with established creator-focused templates.

### 2. Teachable

Category: Hosted course-selling platform  
Recommended page slug: `/compare/teachable`  
Primary search intent: "Teachable alternative", "Teachable vs ClassroomIO"

Public positioning:

- Teachable focuses on monetizing knowledge through online courses, digital downloads, coaching, memberships, and community.
- Pricing page presents a free plan plus paid Starter, Builder, Growth, and Advanced tiers, with plan limits and transaction fees varying by tier.

Pricing research:

- Source: https://teachable.com/pricing
- Verify transaction fees, product limits, and membership/community availability before page launch.

ClassroomIO comparison angle:

- Teachable is good for creators monetizing knowledge. ClassroomIO should be positioned for teams that need deeper learning management: exercises, submissions, marks, certificates, audience import, tutors, programs, communities, organization setup, and integrations.

Feature notes:

- Teachable's strongest frame is creator monetization.
- ClassroomIO should not over-index on "selling courses"; focus on learning experience and operations.

Choose ClassroomIO if:

- You run a bootcamp, training program, cohort, school, or partner/customer education operation.
- You need assignments, grading, certificates, attendance/compliance, and learner management.
- You want a branded learning portal plus widgets and technical integrations.

Choose Teachable if:

- You are a solo creator prioritizing course checkout, payments, and simple product packaging.

### 3. Kajabi

Category: Premium all-in-one creator business platform  
Recommended page slug: `/compare/kajabi`  
Primary search intent: "Kajabi alternative", "Kajabi vs ClassroomIO"

Public positioning:

- Kajabi bundles courses, coaching, memberships, website, email, funnels, payments, and creator business tools.
- Pricing is premium and changes over time; the public pricing page is the required source.

Pricing research:

- Source: https://www.kajabi.com/pricing
- Verify plan names, monthly/annual rates, and limits immediately before publication.

ClassroomIO comparison angle:

- Kajabi is a business/marketing suite for creators. ClassroomIO is the better comparison for teams that care more about learning delivery, assessments, certificates, learner management, and education operations than funnels and email marketing.

Feature notes:

- Kajabi likely wins for built-in marketing funnels/email/sales-page maturity.
- ClassroomIO should win the narrative around education workflows, organization learning portals, assessments, certifications, programs, API/MCP, and LMS customization.

Choose ClassroomIO if:

- You need a learning platform first, not a marketing automation suite first.
- You have tutors, cohorts, learners, programs, grading, certificates, or compliance needs.
- You want extensibility through API, Zapier, MCP, widgets, and custom domains.

Choose Kajabi if:

- You want one premium creator-business suite with email/funnels deeply built in.

### 4. LearnWorlds

Category: Advanced hosted LMS/course platform  
Recommended page slug: `/compare/learnworlds`  
Primary search intent: "LearnWorlds alternative", "LearnWorlds vs ClassroomIO"

Public positioning:

- LearnWorlds offers a course platform/LMS with interactive video, assessments, certificates, website builder, memberships, subscriptions, mobile app options, and enterprise/SCORM-type capabilities depending on plan.

Pricing research:

- Source: https://www.learnworlds.com/pricing/
- Verify tiers such as Starter, Pro Trainer, Learning Center, and High Volume / Corporate before publication.

ClassroomIO comparison angle:

- LearnWorlds is one of the closest advanced course-platform competitors. ClassroomIO should focus on modern team workflows, community/program management, widgets, MCP/API, organization learning portals, and simpler operations.

Feature notes:

- LearnWorlds is strong on interactive learning and mature course website features.
- ClassroomIO should avoid claiming feature parity on every advanced LMS capability unless confirmed during implementation.

Choose ClassroomIO if:

- You want course operations, people management, community, programs, widgets, and modern technical integrations in one simpler platform.
- You need an organization-first learning portal instead of a course-business storefront only.

Choose LearnWorlds if:

- Interactive video, branded mobile app options, and mature advanced LMS packaging are top priorities.

### 5. Mighty Networks

Category: Community-led learning, memberships, events  
Recommended page slug: `/compare/mighty-networks`  
Primary search intent: "Mighty Networks alternative", "Mighty Networks vs ClassroomIO"

Public positioning:

- Mighty Networks centers on communities, memberships, events, livestreams, challenges, and courses.
- Public pricing includes community/business style plans and higher-tier branded app options. Pricing and plan names change, so cite the official pricing page at launch.

Pricing research:

- Source: https://www.mightynetworks.com/pricing

ClassroomIO comparison angle:

- Mighty is community-first. ClassroomIO is learning-first with community included.
- This page should speak to teams that like community engagement but need course structure, assessments, certificates, grading, audience import, learner progress, and training operations.

Feature notes:

- Mighty should be credited for community UX, memberships, events, and mobile/community engagement.
- ClassroomIO should emphasize course depth and learning operations.

Choose ClassroomIO if:

- Courses, assessments, certificates, learner tracking, and programs are core to the business.
- Community is important but should support a structured learning journey.

Choose Mighty Networks if:

- Your primary product is a community/membership network with courses as one part of engagement.

### 6. Circle

Category: Community platform with courses and memberships  
Recommended page slug: `/compare/circle`  
Primary search intent: "Circle alternative", "Circle vs ClassroomIO", "Circle community alternative"

Public positioning:

- Circle positions around branded community, courses, events, memberships, discussions, and monetization.
- Public pages show plan-based pricing and transaction-fee considerations; exact plan details should be verified at launch.

Pricing research:

- Sources:
  - https://circle.so/pricing
  - https://circle.so/platform/courses

ClassroomIO comparison angle:

- Circle is community-first and strong for member engagement. ClassroomIO is better positioned for organizations where courses, exercises, certificates, cohorts/programs, learner analytics, and integrations are first-class.

Feature notes:

- Circle is a serious community competitor and should be treated respectfully.
- ClassroomIO pages should avoid saying "Circle is not an LMS" too bluntly; instead say "Circle is strongest when community is the center; ClassroomIO is built when learning delivery is the center."

Choose ClassroomIO if:

- You need assessments, marks, certificates, attendance/compliance, and course/program operations.
- You want a learning portal with communities, not only a community with courses.

Choose Circle if:

- Your main product is a paid community, membership, or customer community with lightweight learning content.

### 7. TalentLMS

Category: SMB/company training LMS  
Recommended page slug: `/compare/talentlms`  
Primary search intent: "TalentLMS alternative", "TalentLMS vs ClassroomIO"

Public positioning:

- TalentLMS is a business training LMS for onboarding, compliance, customer training, partner training, sales training, and employee development.
- Pricing page includes free and paid tiers with user limits, and enterprise/custom options.

Pricing research:

- Source: https://www.talentlms.com/prices

ClassroomIO comparison angle:

- TalentLMS is a traditional business LMS. ClassroomIO should position as a more modern, education-business-friendly and creator-friendly alternative for teams that still need training-grade features.

Feature notes:

- TalentLMS likely has mature SCORM, branches, compliance, and enterprise training features.
- ClassroomIO should emphasize modern course authoring, public course/org pages, communities, widgets, AI/MCP, and learning experiences that can serve both business training and education businesses.

Choose ClassroomIO if:

- You need a modern learning portal for customers, partners, cohorts, or education communities.
- You want branded public course pages, widgets, communities, and AI-assisted authoring alongside training controls.

Choose TalentLMS if:

- Your buying checklist is classic corporate LMS, SCORM-heavy training, and formal HR/training department administration.

### 8. Moodle

Category: Open-source LMS  
Recommended page slug: `/compare/moodle`  
Primary search intent: "Moodle alternative", "Moodle vs ClassroomIO", "open source LMS alternative"

Public positioning:

- Moodle is the most established open-source LMS, widely used by schools, universities, companies, and training organizations.
- Moodle software is open source. Managed options such as MoodleCloud and Moodle Workplace have paid plans or partner/custom pricing.

Pricing research:

- Sources:
  - https://moodle.org/
  - https://moodle.com/products/moodlecloud/
  - https://moodle.com/solutions/moodle-workplace/

ClassroomIO comparison angle:

- Moodle is powerful and highly customizable but often requires setup, hosting, plugins, theme work, maintenance, and admin expertise.
- ClassroomIO should be positioned for teams that want a modern LMS-like experience without maintaining a Moodle stack.

Feature notes:

- Do not imply Moodle lacks capabilities; it has a huge ecosystem.
- The comparison should focus on operational complexity, modern UX, faster setup, creator/team workflows, widgets, AI/MCP, and integrated organization/course/community surfaces.

Choose ClassroomIO if:

- You want a hosted modern learning platform without plugin/theme/server maintenance.
- You need fast course/program launch, branded portals, widgets, AI assistance, and integrated community/course operations.

Choose Moodle if:

- You require deep open-source customization, institutional LMS conventions, plugin ecosystem breadth, and direct control over infrastructure.

### 9. Open edX

Category: Open-source large-scale learning platform  
Recommended page slug: `/compare/open-edx`  
Primary search intent: "Open edX alternative", "Open edX vs ClassroomIO", "MOOC platform alternative"

Public positioning:

- Open edX is an open-source platform for scalable online learning, MOOCs, universities, enterprises, and governments.
- The software is open source, but production deployments usually require hosting, DevOps, implementation, customization, and support.

Pricing research:

- Sources:
  - https://openedx.org/
  - https://github.com/openedx/

ClassroomIO comparison angle:

- Open edX is best for institutions that need large-scale, highly customizable online learning infrastructure.
- ClassroomIO should be positioned for organizations that want a faster, simpler, more integrated learning platform for courses, communities, certificates, programs, and learner operations.

Feature notes:

- Open edX has significant depth and scale but high implementation complexity.
- ClassroomIO should focus on speed to launch, lower operational overhead, and practical all-in-one workflows.

Choose ClassroomIO if:

- You want a modern hosted platform without assembling and operating an Open edX deployment.
- Your team prioritizes courses, assessments, certificates, programs, communities, and learner management over deep platform engineering.

Choose Open edX if:

- You need MOOC-scale infrastructure, open-source codebase control, and can invest in engineering/implementation support.

### 10. Canvas LMS

Category: LMS with open-source core and institutional market presence  
Recommended page slug: `/compare/canvas-lms`  
Primary search intent: "Canvas LMS alternative", "Canvas vs ClassroomIO"

Public positioning:

- Canvas LMS by Instructure is a major LMS for K-12, higher education, and institutions.
- Canvas has an open-source core, while commercial Canvas offerings, hosting, support, and institutional packages are provided by Instructure.

Pricing research:

- Sources:
  - https://www.instructure.com/canvas
  - https://github.com/instructure/canvas-lms

ClassroomIO comparison angle:

- Canvas is institution-first. ClassroomIO is better framed for smaller teams, education businesses, bootcamps, customer/partner training, and organizations that need modern course/community/program workflows without institutional LMS overhead.

Feature notes:

- Canvas likely wins for deep school/institution LMS workflows, gradebook maturity, SIS integrations, and academic administration.
- ClassroomIO should emphasize fast launch, modern UX, public course/org pages, widgets, communities, AI/MCP, and business-friendly learning operations.

Choose ClassroomIO if:

- You are not a traditional school district/university and do not need a full institutional LMS.
- You want branded course delivery, communities, certificates, widgets, and simpler admin.

Choose Canvas if:

- You need a school/university LMS with institutional workflows, gradebook/SIS expectations, and formal academic administration.

## Cross-Competitor Feature Matrix

Use this as a drafting guide, not a legal claim table. The implementation agent should verify final wording before publication.

| Capability | ClassroomIO | Thinkific | Teachable | Kajabi | LearnWorlds | Mighty | Circle | TalentLMS | Moodle | Open edX | Canvas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hosted course builder | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Self/managed | Self/managed | Self/managed/commercial |
| Assessments/submissions/marks | Strong | Moderate | Moderate | Moderate | Strong | Limited/moderate | Limited/moderate | Strong | Strong | Strong | Strong |
| Certificates | Yes | Yes/plan-dependent | Yes/plan-dependent | Yes/plan-dependent | Yes | Limited/plan-dependent | Limited/plan-dependent | Yes | Yes/plugins/core | Yes | Yes/available workflows |
| Communities/discussions | Yes | Yes | Yes/plan-dependent | Yes | Yes | Strong | Strong | Limited/moderate | Yes | Discussions | Yes |
| Programs/cohorts | Yes | Limited/moderate | Limited/moderate | Moderate | Moderate | Yes | Moderate | Learning paths | Yes | Yes | Yes |
| Public course/org pages | Yes | Yes | Yes | Yes | Yes | Limited | Limited | Limited | Requires setup | Requires setup | Institution-focused |
| Widgets/embed | Yes | Limited | Limited | Limited | Limited | Limited | Limited | Limited | Requires custom work | Requires custom work | Requires custom work |
| Custom domains/branding | Yes | Yes/plan-dependent | Yes/plan-dependent | Yes | Yes | Yes/plan-dependent | Yes/plan-dependent | Yes/plan-dependent | Yes with hosting | Yes with hosting | Yes with hosting |
| SSO/auth controls | Yes | Enterprise/plan-dependent | Advanced/enterprise | Higher tiers | Higher tiers | Higher tiers | Higher tiers | Yes/plan-dependent | Yes/plugins | Yes | Yes |
| API/integrations | API, Zapier, MCP | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Extensive/plugins | Extensive | Extensive |
| AI assistance | Yes | Platform-specific | Platform-specific | Platform-specific | Platform-specific | Platform-specific | Platform-specific | Yes/features vary | Plugin/custom | Custom | Vendor/custom |
| Open-source control | Not primary | No | No | No | No | No | No | No | Yes | Yes | Yes core |

## Pricing Guidance For Pages

Because competitor pricing changes frequently, use this rule on every page:

- Include the exact date pricing was checked.
- Link to the official pricing page.
- Avoid anchoring the whole page on exact price if plans, promotions, or annual discounts are likely to change.
- For Moodle, Open edX, and Canvas, explain that open-source software may be free to download but total cost includes hosting, setup, maintenance, upgrades, plugins, security, support, and implementation.

Pricing snapshot verified on 2026-05-12:

| Competitor | Published pricing snapshot | Notes |
| --- | --- | --- |
| Thinkific | Start: $99/mo monthly or $74/mo annual billing. Grow: $199/mo monthly or $149/mo annual billing. Expand: $499/mo monthly or $374/mo annual billing. Plus: custom. | USD per site, taxes extra. Start includes unlimited courses, certificates, assignments, compliance tools, memberships, and 1 community. |
| Teachable | Starter: $39/mo. Builder: $89/mo. Growth: $199/mo. Advanced: $499/mo. | Starter has 7.5% transaction fee. Builder, Growth, Advanced, and Custom list 0% transaction fees when using Teachable payment options; processing fees still apply. |
| Kajabi | Basic: $143/mo billed annually, or $179/mo monthly. Growth: $199/mo billed annually, or $249/mo monthly. Pro: $399/mo billed annually, or $499/mo monthly. | Kajabi says no revenue sharing; payment processing rates still apply. |
| LearnWorlds | Starter: $29/mo monthly or $24/mo annual billing, plus $5 per course enrollment. Pro Trainer: $99/mo monthly or $79/mo annual billing. Learning Center: $299/mo monthly or $249/mo annual billing. High Volume & Corporate: custom. | Starter has per-enrollment fee; Pro Trainer and above list no transaction fees. |
| Mighty Networks | Launch: $79/mo. Scale: $179/mo. Growth: $354/mo. Mighty Pro: custom. | Transaction fees shown by plan: 2%, 1%, 0.5%, 0.5%. Annual billing gives 2 months free. |
| Circle | Professional: $89/mo. Business: $199/mo. Circle Plus: custom. | Add-ons and usage limits can affect total price; verify transaction fees and add-ons at launch. |
| TalentLMS | Core: from $119/mo for 1-40 users on annual billing. Grow: from $229/mo for 1-70 users on annual billing. Pro: from $449/mo for 1-100 users on annual billing. Enterprise: custom. | Pricing is based on monthly active users who log in. Annual billing saves 20%. |
| Moodle | Moodle LMS software: free/open source under GPL. MoodleCloud examples: Mini 100 users/2.5GB at $250 USD annual; Medium 500 users/20GB at $1,110 USD annual; Standard 750 users/50GB at $1,980 USD annual. | MoodleCloud is billed annually and official support notes say billing is in AUD; displayed USD may be indicative. Moodle Workplace / premium hosting is quote-based via partners. |
| Open edX | Open-source software; no standard SaaS list price from Open edX. | Total cost depends on hosting, DevOps, service provider, implementation, support, and customization. Official docs state production installation is not simple and recommend a service provider. |
| Canvas LMS | Open-source core under AGPLv3; Instructure commercial Canvas pricing is quote-based. | Total cost depends on whether using open-source self-hosted Canvas, Canvas Cloud, institution contracts, support, and integrations. |

Current pricing source links:

- Thinkific: https://www.thinkific.com/pricing/
- Teachable: https://teachable.com/pricing
- Kajabi: https://www.kajabi.com/pricing
- LearnWorlds: https://www.learnworlds.com/pricing/
- Mighty Networks: https://www.mightynetworks.com/pricing
- Circle: https://circle.so/pricing
- TalentLMS: https://www.talentlms.com/prices
- MoodleCloud: https://moodle.com/products/moodlecloud/
- Moodle Workplace: https://moodle.com/solutions/moodle-workplace/
- Open edX: https://openedx.org/
- Canvas LMS: https://www.instructure.com/canvas

## SEO Targets

Primary keyword pattern:

- `[competitor] alternative`
- `ClassroomIO vs [competitor]`
- `[competitor] vs ClassroomIO`
- `best [competitor] alternative`

Secondary keyword patterns:

- `online course platform alternative`
- `community LMS alternative`
- `open source LMS alternative`
- `Moodle alternative`
- `Open edX alternative`
- `Canvas LMS alternative`
- `Thinkific alternative for teams`
- `Teachable alternative for training`
- `Kajabi alternative for education`

## Conversion Requirements

Every comparison page should include:

- A primary CTA near the hero.
- A secondary CTA after the comparison table.
- A final CTA after FAQ.
- Link to pricing.
- Link to relevant use-case pages where they exist: customer education, partner training, compliance training, teach.

Recommended CTA copy:

- `Start building with ClassroomIO`
- `See ClassroomIO pricing`
- `Book a demo`

## Content Tone

- Be direct and practical.
- Use "best for" framing rather than winner/loser framing.
- Avoid unverifiable claims such as "the #1 alternative".
- Do not say "free" for open-source platforms without explaining total cost of ownership.
- For competitor pricing, use "published pricing" and include the verification date.

## Implementation Notes

- Build a reusable comparison page data model so each page can be generated from structured competitor data.
- Keep page copy in content/data files where possible so pricing and claims can be updated without editing component layout.
- Add a `/compare` index before or alongside individual pages.
- Update `apps/website/src/lib/components/footer.svelte` as part of launch.
- Add sitemap/metadata entries if the website has an existing SEO/sitemap flow.
- Use existing website components where possible: navigation, footer, page header, FAQ, page signup CTA.

## Acceptance Criteria

- `/compare` exists and links to all 10 comparison pages.
- All 10 individual comparison pages exist with unique competitor-specific copy.
- Every page has a current pricing/source section with "verified on" date.
- Every page includes an honest "choose ClassroomIO if / choose competitor if" section.
- Footer includes comparison page navigation.
- Pages do not contain unsupported superiority claims.
- Pages are responsive and match the existing website visual system.
- Build passes with the website package command.
