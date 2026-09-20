---
name: write-docs
description: Write, revise, split, or audit customer-facing ClassroomIO Help Center guides under apps/help/content/help. Use for task guides, troubleshooting answers, concept/reference pages, student guides, and their media or internal-link plans. Do not use for developer or API reference documentation.
---

# ClassroomIO Help Guide Writer

Create help articles that let a reader finish one job without contacting support. Every article must be accurate to the current product, independently shareable, easy to scan, and complete without relying on a screenshot or video.

## Non-negotiable outcomes

- Give one article one primary search intent or task. Split unrelated jobs into separate URLs.
- Put the answer or outcome before background information.
- Use the product's exact current labels and behavior. Never document a roadmap item, unfinished control, or inferred behavior as available.
- Keep the written instructions sufficient on their own. Images confirm location or state; videos demonstrate motion or a long workflow.
- Preserve a canonical explanation for each concept. Summarize and link instead of duplicating full instructions across pages.
- Make every new article discoverable through the sidebar and at least one contextual link from an existing page.
- Warn before a destructive, irreversible, paid, permission-gated, or behavior-changing action.

## Where the help center lives

- Articles: `apps/help/content/help/**/*.mdx`
- Sidebar: `apps/help/blume.config.ts`
- Help-site assets and scripts: `apps/help/`
- Current public-image archive: `apps/help/public/`
- Proposed information architecture: `apps/help/help-center-sidebar-proposal.html`

The help site is rendered by Blume at `classroomio.com/help`. Do not use the retired `apps/docs/` paths.

## Workflow

### 1. Define the reader and the job

Write down, for your own use:

- reader: administrator, tutor/instructor, or student;
- job: the single result they need;
- entry state: where they begin and what must already be true;
- success state: what they should see or be able to do at the end;
- likely failure states: permissions, plan limits, missing setup, processing delays, and destructive consequences.

If the draft needs two different success states, two unrelated navigation paths, or serves both administrators and students with separate procedures, split it unless the comparison itself is the point.

### 2. Verify the current product

Research before writing. Prefer the narrowest authoritative source that proves the claim:

- visible UI and routes: `apps/dashboard/src/routes/`;
- feature pages and components: `apps/dashboard/src/lib/features/`;
- exact UI labels: `apps/dashboard/src/lib/utils/translations/en.json`;
- validation and shared product rules: `packages/utils/src/validation/`;
- API behavior and errors: `apps/api/src/routes/` and `apps/api/src/services/`;
- persisted concepts: query and schema code under `packages/db/src/`;
- emails and link destinations: `packages/email/` and the API caller that builds each URL.

Trace both the normal path and meaningful branches. Confirm:

- who can see and use the control;
- plan or feature-flag requirements;
- defaults and inherited values;
- save, publish, enrollment, notification, and deletion side effects;
- what administrators see versus what students see;
- exact success, empty, pending, and error states when those affect the task.

Do not expose implementation-only details unless the reader needs them to make a decision or troubleshoot. If the source and visible UI disagree, document the shipped UI and report the discrepancy instead of guessing.

### 3. Choose the article pattern

Read [references/article-blueprints.md](references/article-blueprints.md) and choose the smallest pattern that fits:

- task/how-to guide;
- quick answer or troubleshooting guide;
- concept or feature reference;
- overview or decision guide;
- student guide.

Do not force every optional section into every article.

### 4. Apply the editorial standard

Read [references/editorial-standard.md](references/editorial-standard.md) before drafting or substantially revising a page. It defines titles, introductions, voice, terminology, headings, procedures, callouts, tables, accessibility, and maintenance rules.

### 5. Plan links and media

Read [references/media-and-linking.md](references/media-and-linking.md) whenever the article adds, removes, or meaningfully changes screenshots, videos, diagrams, internal links, anchors, or related guides.

Media is selected after the written procedure is known. Do not add a screenshot quota or use a video to compensate for missing written instructions.

### 6. Write the MDX

Every page starts with:

```mdx
---
title: Action-oriented or question-shaped title
description: One sentence that states the article's answer, outcome, or scope.
last_reviewed: 'YYYY-MM-DD'
---
```

Blume renders `title` as the page H1, so body headings start at `##`.

Use globally available Blume syntax without imports:

- `:::note`, `:::info`, `:::tip`, `:::success`, `:::warning`, and `:::danger` callouts;
- numbered `###` action headings for procedures;
- `<Tabs>` only for equivalent variants of the same task;
- `<Accordion>` only for optional or FAQ material that does not hide a required step;
- `<CardGroup>` and `<Card>` for overview/index navigation;
- `<YouTube id="..." title="..." />` for approved video embeds.

Do not use `<Steps>` for help procedures. Numbered Markdown headings create visible, linkable anchors and survive CMS editing and plain-Markdown export more reliably.

### 7. Connect the article

For a new page:

1. Use a short, durable, kebab-case slug based on the task, not the current menu location.
2. Add it to the correct section and topic group in `apps/help/blume.config.ts`.
3. Add at least one natural inbound link from an existing guide where a reader would need the new task.
4. Add focused outbound links in the body and `## Related guides`.

For a page split, leave a short summary and link at the old point of explanation. Do not leave two complete, drifting copies of the same procedure.

Avoid changing a published URL only to improve wording. If a move is necessary, identify every inbound link and require a redirect plan before removing the old path.

### 8. Review and verify

Check the rendered article, not only its source. Confirm that:

- the first paragraph answers the title;
- a reader can complete the task using text alone;
- every label and navigation path matches the product;
- conditions and warnings appear before the affected action;
- headings form a useful in-page table of contents;
- screenshots sit beside the instruction they clarify and remain legible on mobile;
- videos have descriptive titles and written equivalents;
- internal links, fragments, images, and sidebar entries resolve;
- the page has no placeholders, speculative copy, or stale screenshots;
- `last_reviewed` reflects the date the product behavior was actually checked.

Format and validate the changed files:

```bash
pnpm exec prettier --write apps/help/content/help/<path>.mdx
pnpm --filter @cio/help validate
pnpm --filter @cio/help build
```

When only planning or auditing content, do not modify product code or capture new media unless the user asks. Report missing evidence, unavailable screenshots, or product/documentation discrepancies explicitly.

## ClassroomIO terminology

- **organization**: the administrator workspace that owns courses, people, settings, and branding;
- **academy**: the public-facing organization site on a ClassroomIO subdomain or custom domain;
- **LMS**: the signed-in student learning area;
- **student**: the person taking a course; use “learner” only when quoting an exact UI label;
- **administrator** and **tutor**: use the exact role relevant to the permission being described;
- **academy landing page**: the public organization homepage;
- **course landing page**: the public page for one course.

Use **ClassroomIO** exactly. Use American English because the current interface uses forms such as “organization” and “customize.”
