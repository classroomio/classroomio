---
name: write-docs
description: Write accurate, product-grounded documentation pages for ClassroomIO. Use when adding content to stub pages, expanding thin docs, or creating new guide pages under apps/docs/content/docs/.
---

You are writing documentation for ClassroomIO — an LMS platform that lets organizations create and run training academies. Documentation lives in `apps/docs/content/docs/` and is rendered by Blume.

## Research before writing

Every page must reflect how the feature actually works in the product. Before writing, read the relevant source:

- **UI components / pages**: `apps/dashboard/src/lib/features/{domain}/pages/`
- **Settings pages**: `apps/dashboard/src/lib/features/settings/pages/`
- **API routes**: `apps/api/src/routes/{domain}/` and `apps/api/src/services/{domain}/`
- **DB schema**: `packages/db/src/schema.ts` — column names and types reveal the data model
- **Translations**: `apps/dashboard/src/lib/utils/translations/en.json` — use the exact UI label text from here, not guesses

Never describe behavior you haven't verified in the source code or UI.

## Terminology (use these terms everywhere)

| Term | Meaning |
|---|---|
| **academy** | The public-facing org site (`<siteName>.myclassroomio.com` or custom domain) |
| **LMS** | The authenticated student learning area (Home, My Learning, Explore, Programs) |
| **organization** | The admin workspace holding courses, people, settings, branding |
| **student** | A user enrolled in courses — never "learner" |
| **Open Academy** | The button/link that opens the public academy |
| **Academy subdomain** | The org's site name / slug field in settings |
| **academy landing page** | The public homepage for the org (not "org landing page") |
| **course landing page** | The per-course public page |

## Settings navigation paths

These are the exact sidebar paths in the admin dashboard:

- `Settings → Profile` — personal profile settings
- `Settings → Organization` — org name, logo, theme, and links to Custom Domain and Teams sub-pages
- `Settings → Organization → Custom Domain` — navigated to via "Edit domain" button inside Organization
- `Settings → Organization → Teams` — navigated to via "Manage Team" button inside Organization
- `Settings → Landing Page` — academy landing page editor
- `Settings → Authentication` — signup rules, SSO, token auth; sub-tabs: General, SSO, Token Auth
- `Settings → Authentication → General` — signup toggle, Internal Enrollment Only
- `Settings → Billing` — plan and billing
- `Settings → AI Credits` — token usage
- `Settings → AI Tutor` — per-org AI tutor toggle

## MDX format conventions

Pages are rendered by Blume. Its components are global — **do not import anything**.

**Callouts** are directives, not components. Types: `note`, `info`, `tip`, `success`, `warning`, `danger`.

```mdx
:::warning[Paid plan required]
Certificate features require a paid plan.
:::
```

**Steps** for sequential procedures. Keep an `###` heading inside each `<Step>` — it is what
generates the linkable anchor:

```mdx
<Steps>
<Step>
### Enable downloadable certificates

Turn on **Allow students download certificate**.
</Step>
</Steps>
```

Also available without imports: `<Tabs>`/`<Tab>`, `<Card>`, `<Accordion>`, `<YouTube id="..." />`,
`<CodeGroup>`, `<Frame>`. Code fences take a title: ` ```zsh title="Terminal" `. Mermaid fences render
as diagrams.

**Links and images follow different rules** — this trips people up:

- **Links**: root-relative, no `/docs` prefix — `[Enrollment](/course-enrollment)`. Blume adds the
  base at build time.
- **Images**: must include the `/docs` prefix — `![Alt](/docs/certificates-rules.webp)`. Blume does
  not rebase images, so an unprefixed path 404s. Files live in `apps/docs/public/`.

Run `pnpm --filter @cio/docs validate` to check links and anchors.

**Frontmatter** (required on every page):
```mdx
---
title: Page Title
description: One sentence — shown in search results and link previews.
---
```

New pages must also be added to the sidebar in `apps/docs/blume.config.ts` (`navigation.sidebar`) —
a page that isn't listed there will not appear in the nav.

## Writing style

- Address the reader as "you" (the admin/instructor).
- Short, direct sentences. No filler. No "In this guide, we will…" preambles.
- Use **bold** for UI element names exactly as they appear in the product (match translations).
- Use `code` for paths, values, slugs, and field names.
- Tables for comparisons and reference lists.
- Steps component for sequential procedures (not numbered markdown lists).
- End every substantive page with a `## Related guides` section linking to connected pages.
- Remove the "Work in Progress" callout when replacing it with real content.

## Page structure patterns

**Reference page** (what a feature is):
1. One-paragraph description of the feature
2. Key concepts or table
3. How it fits with related features
4. Related guides

**How-to guide** (how to do something):
1. One-sentence context (what and why)
2. Prerequisites if any
3. Steps component with the procedure
4. Common scenarios or edge cases (Callout blocks)
5. Related guides

**Overview/index page** (org, course, programs):
1. Short description
2. Table: area | where | guide
3. Related guides

## Things to avoid

- Don't describe UI that doesn't exist yet
- Don't say "workspace" — use "organization"
- Don't use "learner" — use "student"
- Don't say "org site" — say "your academy"
- Don't hardcode customer site names — use `<siteName>.myclassroomio.com` as the placeholder
- Don't add the "Work in Progress" callout to pages you've completed
