# Org + Course landing pages

This folder holds the entire landing-page system: the public org site (`{theme}.org`) and the per-course landing (`{theme}.course`), in 10 themes.

Both surfaces share the same nav, hero, footer, tokens, and edit context. A course landing inherits its theme from the org's `landingpage.theme` — courses don't pick their own.

## Folder map

```
packages/ui/src/custom/org-landing-page/
│
├── types.ts                       Public types: OrgLandingPageProps, CourseLandingPageProps,
│                                  CourseLandingPageLabels, OrgLandingPageTheme, …
├── theme-vars-base.ts             Type + baseTokenVars for --landing-* CSS variables
├── theme-style.ts                 Thin registry: aggregates per-theme vars + exports themeStyle()
├── course-tokens-base.ts          Type + baseCourseTokens + tokenize() helper
├── course-landing-page.tokens.ts  Thin registry: aggregates per-theme courseTokens + exports
│                                  courseLandingTokens(theme)
├── course-landing-page.helpers.ts alignHeroCtaWithPricing, buildCourseSectionNavItems
├── fixtures.ts                    mockOrgLandingPageProps, mockCourseLandingPageProps
├── index.ts                       Public exports
│
├── edit-context.ts                LandingSectionKey + setLandingPageEditContext/getLandingPageEditContext
├── editable-section.svelte        Wrapper that makes a section click-to-edit when a context is set
├── landing-button.svelte          Theme-aware button used by every CTA
├── landing-page-footer.svelte     Shared footer, per-theme class tokens
├── landing-page-footer.tokens.ts
│
├── {theme}/                       Everything for one theme (minimal, bold, classic, saas, tech,
│   │                              studio, corporate, terminal, editorial, vibrant)
│   ├── index.ts                   re-exports { nav, hero, courseCard, org, course }
│   ├── nav.svelte                 reused by both org and course
│   ├── hero.svelte                reused; course populates with course-shaped hero data
│   ├── course-card.svelte         used by the org catalog
│   ├── org.svelte                 org-landing composer for this theme
│   ├── course.svelte              course-landing composer for this theme
│   ├── vars.ts                    --landing-* CSS variables for this theme
│   └── course-tokens.ts           CourseLandingTokens record for this theme
│
└── course-*.svelte                Shared body components driven by `variant` + tokens:
    course-section-nav, course-social-proof, course-info-blocks, course-curriculum,
    course-chips, course-instructor, course-reviews, course-pricing
```

## A theme is one folder

Every artifact for a theme — composer, sub-components, CSS variables, class tokens — lives in `{theme}/`. To touch one theme you edit one directory. To delete one you `rm -rf {theme}/`. To duplicate one you copy the folder.

The central registries (`theme-style.ts`, `course-landing-page.tokens.ts`, `index.ts`) only import-and-aggregate from each `{theme}/`.

## Three-layer separation

```
┌────────────────────────────────────────┐
│ {theme}/course.svelte    (orchestration)│  ← composes the theme
│ ── reuses {theme}/nav, {theme}/hero,    │
│    landing-page-footer                  │
└──┬─────────────────────────────────────┘
   │ renders, passes variant="…"
   ▼
┌────────────────────────────────────────┐
│ course-*.svelte           (shared body) │  ← one component per section
│   • course-section-nav                  │    used by all 10 themes
│   • course-social-proof                 │
│   • course-info-blocks                  │
│   • course-curriculum                   │
│   • course-chips                        │
│   • course-instructor                   │
│   • course-reviews                      │
│   • course-pricing                      │
└──┬─────────────────────────────────────┘
   │ reads courseLandingTokens(variant)
   ▼
┌────────────────────────────────────────┐
│ {theme}/course-tokens.ts     (tokens)   │  ← per-theme class strings
│ {theme}/vars.ts              (vars)     │     and CSS variables
└────────────────────────────────────────┘
```

The composer only orchestrates. Body components only render. Theme variation lives in tokens + CSS vars.

## Token contract

Each theme owns its `course-tokens.ts` exporting `courseTokens: CourseLandingTokens` via `tokenize({...overrides})`. The base lives in `course-tokens-base.ts`. Every body component reads `t = courseLandingTokens(variant)` and applies `{t.sectionShell}`, `{t.heading}`, `{t.curriculumModule}`, … Anything not overridden falls through to the base.

**Tokens-first rule.** Body components must not hardcode theme-varying utilities (`font-bold`, `tracking-tight`, `rounded-2xl`, `bg-card-soft`, …). Anything that differs between themes lives in tokens. Layout-only utilities that are identical everywhere (`flex`, `grid`, `gap-6`, `py-12`) can sit inline.

**Off-palette rule.** A course body section must only use surfaces that exist in the theme's org template. Don't introduce `bg-section` greys to minimal, don't paint card-soft on bold, etc.

## Data flow

The dashboard's `<CourseLandingPage>` (`apps/dashboard/src/lib/features/ui/course-landing-page/course-landing-page.svelte`) is the entry point. It:

1. Reads the org's chosen theme from `landingpage.theme`.
2. Maps `course + org` → `CourseLandingPageProps` via `buildCourseLandingPageProps()`. Section visibility (`metadata.sectionDisplay`) is honoured here — hidden sections are stripped from `info` / `reviews` / `instructor` before rendering.
3. Lazy-loads the theme bundle via `importThemeBundle(theme)` — one bundle per theme; the other nine never download. The bundle exposes `{ nav, hero, courseCard, org, course }`.

The composer wires nav/hero/footer (theme-specific files) around the shared body components, threading `variant={theme}` and the same `labels` prop into each.

## Edit context (click-to-edit)

`EditableLandingSection sectionKey="…"` wraps every editable region. When a parent route calls `setLandingPageEditContext({ selectedKey, selectKey, labelFor, iconFor })`, clicking a section in the preview calls `selectKey(key)`. The Editor sidebar reads the same key from a bound prop and opens the matching form. Without a context, the wrapper is a transparent pass-through.

Course `LandingSectionKey` values: `header`, `requirement`, `description`, `goals`, `certificate`, `curriculum`, `chips`, `instructor`, `reviews`, `pricing`.

---

## Adding a new theme

A theme is one folder. The central registries are the only files outside that folder you touch.

### 1. Declare the theme key

`types.ts`:

```ts
export type OrgLandingPageTheme =
  | 'minimal'
  | …
  | 'newtheme';
```

### 2. Create the folder

```
newtheme/
├── index.ts
├── nav.svelte
├── hero.svelte
├── course-card.svelte
├── org.svelte
├── course.svelte
├── vars.ts
└── course-tokens.ts
```

Quickest path: `cp -R minimal/ newtheme/` and edit.

### 3. Fill in each file

- `nav.svelte`, `hero.svelte`, `course-card.svelte` — the theme's UI personality. Hero composes `{@render navigation()}` if the theme renders nav inside the hero.
- `org.svelte` — org landing composer for this theme.
- `course.svelte` — course landing composer (use any existing theme's `course.svelte` as a template; the body sequence is the same).
- `vars.ts` — exports `vars: LandingThemeVars`. Spread `...baseTokenVars` and override the differences. Use raw hex only for genuinely off-palette themes (see `terminal/vars.ts`, `editorial/vars.ts`).
- `course-tokens.ts` — exports `courseTokens: CourseLandingTokens = tokenize({ ... })`. Only override regions that differ from the base.
- `index.ts`:

  ```ts
  export { default as nav } from './nav.svelte';
  export { default as hero } from './hero.svelte';
  export { default as courseCard } from './course-card.svelte';
  export { default as org } from './org.svelte';
  export { default as course } from './course.svelte';
  ```

### 4. Wire into the central registries

`theme-style.ts`:

```ts
import { vars as newthemeVars } from './newtheme/vars';
…
export const LANDING_THEME_VARS = {
  …,
  newtheme: newthemeVars
};
```

`course-landing-page.tokens.ts`:

```ts
import { courseTokens as newthemeTokens } from './newtheme/course-tokens';
…
const TOKENS = {
  …,
  newtheme: newthemeTokens
};
```

`index.ts`:

```ts
import * as newtheme from './newtheme';
export const NewthemeLandingPage = newtheme.org;
export const NewthemeCourseLanding = newtheme.course;
export const NewthemeLandingNav = newtheme.nav;
export const NewthemeLandingHero = newtheme.hero;
export const NewthemeLandingCourseCard = newtheme.courseCard;
```

### 5. Register in the dashboard utils

`apps/dashboard/src/lib/features/org/utils/landing-page.ts`:

- Add the key to `landingPageThemes`.
- Add a `case 'newtheme'` to `importThemeBundle` (this is the only lazy-load switch — `importThemeComponent`, `importThemeNavHero`, `importThemeCourseCard`, and `importCourseLandingPageTheme` are thin adapters over it).
- If your hero composes `{@render navigation()}`, add the theme key to `NAV_SNIPPET_THEMES`.
- Add an entry to `themeCourseGridClass`.

### 6. Pick body layouts

- `course-curriculum.svelte` has a `layoutByTheme` map (`accordion` for collapsible, `chapters` for permanently expanded). Add `newtheme`.
- If the info-blocks should use a different layout, do the same in `course-info-blocks.svelte`.

### 7. Storybook

In `packages/storybook/src/templates/org-landing-page/`:

- `org-landing-page.stories.svelte` — add `<NewthemeLandingPage {...mockProps} />`.
- `course-landing-page.stories.svelte` — add `<NewthemeCourseLanding {...mockProps} />`.

### 8. Audit

- Walk the new story top-to-bottom and compare against the org story for the same theme. Surfaces should match.
- `grep -nE 'font-(black|extrabold|bold|semibold|medium)|tracking-(tight|tighter|wider|widest)|rounded-(none|sm|md|lg|xl|2xl|3xl|full)' course-*.svelte` — body components should return no matches.
- `grep -nE 'bg-\[var\(--landing-(bg-section|card-soft|card)\)' newtheme/course-tokens.ts` — confirm you only used surfaces present in the org theme.
- `pnpm exec svelte-check --threshold error` from the repo root.

That's it — one folder, two registry hooks, two Storybook entries.
