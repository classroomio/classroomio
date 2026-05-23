---
name: add-landing-template
description: Add a new org landing-page template to the ClassroomIO monorepo. Use when the user asks to "create/add a new landing template", "add a new template like X to the org landing pages", "build a new theme for the org landing page", or hands over a design reference (image, URL, prototype) for a new landing visual style.
---

# Add a new org landing-page template

Adds one new theme (e.g. `editorial`, `vibrant`) to the org landing-page system. The work spans three packages — `prototypes/`, `packages/ui/` + `packages/storybook/`, and `apps/dashboard/` — and **must be done in three phases with approval gates between them**. Do not skip ahead.

## Workflow

Use `AskUserQuestion` to gate each phase transition. The user must confirm before you move from Phase 1 → 2 → 3. If the user types a custom answer instead of selecting an option, treat any negative response as "not yet" and iterate within the current phase.

Track the work with `TaskCreate`/`TaskUpdate` — one task per numbered step below so progress is visible.

## Phase 1 — Prototype (approval required)

**Goal:** lock the visual design before any framework code.

1. Pick a short, descriptive name for the template (`editorial`, `vibrant`, `terminal`, etc.). Avoid generic adjectives.
2. Build a single-file HTML mockup at `prototypes/org-landing-page/<theme>.html`. Match the conventions of the other prototypes there (Inter font, inline CSS in `<style>`, no JS frameworks).
3. **Color discipline**: define one `--primary` CSS variable for the accent. Derived shades use `color-mix(in oklab, var(--primary) X%, ...)`. Other neutrals (bg, fg, borders, cards) live as CSS variables too. Never hardcode hex inline — the Phase-2 port to `var(--landing-*)` becomes mechanical.
4. Compose the page sections an org landing page actually needs: nav, hero, course catalog grid (this is the centerpiece — orgs sell courses), resources/links, FAQ or callout, footer. Do **not** invent sections without a data source in `OrgLandingPageProps` (no per-org testimonials, no faculty cards, no instructor bios — they have no prop backing and will be misleading).
5. Open it in the browser. Iterate with the user on typography, spacing, color, hierarchy, layout.

**Phase 1 approval gate** — call `AskUserQuestion`:

> Question: "Phase 1 complete — the prototype at `prototypes/org-landing-page/<theme>.html` matches your direction. Move on to Phase 2 (build the template in packages/ui + Storybook)?"
> Options: "Yes, proceed to Phase 2" / "Not yet — keep iterating on the prototype"
> Header: "Phase 1 → 2"

If the user picks "not yet" or writes a correction, stay in Phase 1 and iterate.

## Phase 2 — packages/ui + Storybook (approval required)

**Goal:** the template renders correctly in Storybook with the shared `mockOrgLandingPageProps` fixture, fully isolated from dashboard.

6. Add `'<theme>'` to `OrgLandingPageTheme` in `packages/ui/src/custom/org-landing-page/types.ts`.
7. Add the theme's entry to `LANDING_THEME_VARS` in `packages/ui/src/custom/org-landing-page/theme-style.ts`. The 20 variables fall into two groups:
   - **Surfaces** — `--landing-bg`, `--landing-bg-section`, `--landing-card`, `--landing-card-soft`, `--landing-fg`, `--landing-fg-muted`, `--landing-fg-faint`, `--landing-border`, `--landing-border-soft`, `--landing-accent`, `--landing-accent-fg`
   - **Buttons** — primary/secondary/tertiary with `-bg`, `-fg`, `-bg-hover`, plus `-border` on secondary

   If the theme shares the app's chrome (light bg, dark fg, app primary): use `baseTokenVars` and override only what differs. If the theme has its own palette (cream like editorial, dark like terminal): declare all hex/values explicitly. **Decide what each button tier means per theme** — for vibrant, primary = accent; for editorial, primary = fg-inverse (dark on cream); for terminal, primary = light pill on dark.

8. Build three subcomponents in `packages/ui/src/custom/org-landing-page/<theme>/`:
   - `nav.svelte`
   - `hero.svelte` — **defensive defaults are required**: `courses = []`, `orgName = ''`, `labels` optional. These heroes are mounted from course pages that won't pass the full prop set.
   - `course-card.svelte` — accepts `course`, optional `disableCourseLinks`, optional `labels`. Used both inside the template's own catalog grid AND on the `/courses` listing page.

   **Color rule**: read every color from `var(--landing-*)`. The only allowed inline hex is decorative (painterly gradients, Mac traffic-light dots, dark IDE mockup overlays) where the value is intentionally invariant of theme. No `bg-background`, `text-foreground`, `bg-primary`, etc. — those are app-theme tokens, not landing-theme tokens.

   **Text rule**: hardcoded user-facing strings route through `labels?.foo ?? 'English default'`. See the existing `OrgLandingPageLabels` fields in `types.ts`.

   **Button rule**: for any CTA that isn't the template's signature primary CTA, use `<LandingButton variant="primary|secondary|tertiary">` from `@cio/ui/custom/org-landing-page` — it automatically adopts the theme's button palette.

9. Build the top-level composer `packages/ui/src/custom/org-landing-page/<theme>.svelte`:
   - Wrap the root in `style={themeStyle('<theme>')}` plus `class="ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)]"`
   - Render in order: `<ThemeNav>` (or as a snippet inside `<ThemeHero>`) → `<ThemeHero>` → catalog section (using `<ThemeCourseCard>`) → `<OrgLandingPageLinks variant="<theme>" {labels} {links} />` → `<OrgLandingPageEmbed variant="<theme>" {labels} {embed} />` → `<OrgLandingPageCallout variant="<theme>" {labels} {callout} />` → `<OrgLandingPageFooter variant="<theme>" {orgName} {logoUrl} {footer} />`

10. Wire variant branches into shared section components:
    - `callout.svelte` — add entries to all 5 token maps (`sectionClasses`, `headingClasses`, `descriptionClasses`, `buttonClasses`, `eyebrowClasses`) and update the `defaultEyebrow` switch
    - `links.svelte` — add an `{:else if variant === '<theme>'}` branch
    - `landing-page-footer.tokens.ts` — add an `if (variant === '<theme>')` block in `getFooterTokens`
    - `secondary-action-button.svelte` — add an entry to `themeButtonClasses`
    - `embed.svelte` — only add a branch if the theme needs distinct embed styling (terminal/editorial do; most templates fall through to the default)

11. Export from `packages/ui/src/custom/org-landing-page/index.ts`:
    - `<Theme>LandingPage`, `<Theme>LandingNav`, `<Theme>LandingHero`, `<Theme>LandingCourseCard`

12. Add a Storybook story in `packages/storybook/src/templates/org-landing-page/org-landing-page.stories.svelte` — import the new page component and add `<Story name="<Theme>"><<Theme>LandingPage {...mockProps} /></Story>`.

13. Verify Phase 2: `pnpm --filter @cio/ui build`, open Storybook (`pnpm --filter @cio/storybook dev`), navigate to **Templates → Org Landing Page → <Theme>**, click around all sections. Run `npx --no-install svelte-check --workspace=packages/ui --no-tsconfig > /tmp/check.log 2>&1` once, then `grep org-landing-page /tmp/check.log` — zero errors expected in any file under `org-landing-page/`.

**Phase 2 approval gate** — call `AskUserQuestion`:

> Question: "Phase 2 complete — the template renders in Storybook. Move on to Phase 3 (wire it into the dashboard so it shows up in org settings + the live org pages)?"
> Options: "Yes, proceed to Phase 3" / "Not yet — fix things in Storybook first"
> Header: "Phase 2 → 3"

## Phase 3 — Dashboard integration (final approval)

**Goal:** the template selectable in `/settings/landingpage`, rendering correctly on `/`, `/courses`, `/course/[slug]`, and the course editor preview.

14. Add `'<theme>'` to `OrgLandingPageTheme` in `apps/dashboard/src/lib/utils/types/org.ts`.

15. **Three lazy switches + one eager map** — all four must include the new theme or things will silently fall back to minimal:
    - `apps/dashboard/src/lib/features/org/utils/landing-page.ts`:
      - `landingPageThemes` const array
      - `importThemeComponent(theme)` switch — used by the public org root page
      - `importThemeNavHero(theme)` switch — used by `/courses`, `/course/[slug]`, course-landing editor
      - `importThemeCourseCard(theme)` switch — used by `/courses` per-card rendering
      - `themeCourseGridClass(theme)` — only update if the template uses a non-default grid (segmented borders, special gap)
    - `apps/dashboard/src/lib/features/org/utils/landing-page-components.ts`:
      - All three eager maps: `landingPageThemeComponents`, `landingPageNavComponents`, `landingPageHeroComponents`
      - **Critical**: this map is only used by the settings-page live preview. The org-site routes use the lazy switches above. Forgetting the lazy ones means /settings looks right but the live page renders minimal.

16. Theme picker in settings: `apps/dashboard/src/lib/features/settings/pages/landingpage.svelte` → append to `themeCards` with `preview: '/templates/<theme>.png'` and translation keys.

17. Translations: `apps/dashboard/src/lib/utils/translations/en.json` → add `settings.landing_page.theme.cards.<theme>.title` and `.description`.

18. Preview image: drop `apps/dashboard/static/templates/<theme>.png`. **Must be under 500KB.** If the source is larger, compress with `sips -Z 900 source.png --out target.png` (resizes to max 900px wide while preserving aspect ratio). JPEGs are acceptable when PNG compression isn't enough — update the `themeCards` `preview` path accordingly.

19. Verify Phase 3:
    - `pnpm --filter @cio/ui build`
    - `npx --no-install svelte-check --workspace=apps/dashboard --no-tsconfig > /tmp/dash-check.log 2>&1` (run once)
    - `grep -E "(landing-page-components|landingpage\.svelte|types/org\.ts|org/utils/landing-page\.ts)" /tmp/dash-check.log` — zero errors expected in any touched file
    - Run the dashboard and click through: select the new template in settings, view it on the live org root, `/courses`, `/course/[slug]`. Verify the nav/hero, course cards, Filter aside, Clear Filters button, and footer all render with the right colors on each route.

**Phase 3 final approval** — call `AskUserQuestion`:

> Question: "Phase 3 complete — the <theme> template is live in the dashboard and renders on all org-site routes. Anything else?"
> Options: "All good, we're done" / "There's a visual issue to fix"
> Header: "Final check"

## Anti-checklist (mistakes to prevent)

Read this before starting. These are real bugs that have appeared in this codebase:

- **Inline hex in components** — the wrapper sets `--landing-*` vars; components read from them. Hardcoded hex breaks theme switching and the `/courses` cross-page rendering. Exception: decorative painterly fills, Mac traffic-light dots, and dark IDE mockup overlays that are intentionally invariant of theme.
- **Missing defensive defaults** — heroes that consume `courses` or `orgName` must default them (`courses = []`, `orgName = ''`). They crash when mounted from course pages that don't pass the full prop set.
- **Per-call-site button styling** — use `<LandingButton variant="...">` instead. The /courses Filter aside's Clear Filters button is the canonical example.
- **Hardcoded user-facing strings** — route through `labels?.X ?? 'Default'`. The labels surface is consumed by the dashboard's translations layer.
- **Only updating one of the dashboard registries** — `landingPageThemeComponents` (eager, settings preview) and the three `importTheme*` switches (lazy, public routes) must all include the new theme. Forgetting `importThemeComponent` makes the live org page silently render minimal.
- **Re-running expensive checks** — `svelte-check` typechecks the whole package on each invocation. Run it once, capture to `/tmp/check.log`, grep the captured output as many times as you need.
- **Adding non-prop-backed sections** — testimonials, instructor cards, faculty bios, statistics aren't in `OrgLandingPageProps`. Either drop them, or extend the props type for everyone (significant API surface change — discuss before doing).
- **Changing the layout pattern when extracting a cell** — if the original catalog uses `border-t/border-l` on the grid + `border-r/border-b` on each child (bordered-cell pattern), preserve that pattern. Two failure modes to avoid:
  - Don't swap it for `gap-px bg-border` — that loses the outer top/left border and breaks visually when there are fewer cards than fill the grid.
  - Don't move the right/bottom border from the card to the grid via `[&>*]:border-r [&>*]:border-b`. If a `<BlurFade>` (or any wrapper) sits between the grid and the card, the `[&>*]:` selector lands on the wrapper, not the card — different render. Keep `border-r/border-b` ON the card component itself; the parent owns only `border-t/border-l`.

## File-touch summary (~30 files for a typical theme)

| Path | Purpose |
|---|---|
| `prototypes/org-landing-page/<theme>.html` | Phase 1 design mockup |
| `packages/ui/src/custom/org-landing-page/types.ts` | Theme union |
| `packages/ui/src/custom/org-landing-page/theme-style.ts` | CSS variable contract |
| `packages/ui/src/custom/org-landing-page/<theme>/nav.svelte` | Nav component |
| `packages/ui/src/custom/org-landing-page/<theme>/hero.svelte` | Hero component |
| `packages/ui/src/custom/org-landing-page/<theme>/course-card.svelte` | Card component |
| `packages/ui/src/custom/org-landing-page/<theme>.svelte` | Page composer |
| `packages/ui/src/custom/org-landing-page/callout.svelte` | Variant branch |
| `packages/ui/src/custom/org-landing-page/links.svelte` | Variant branch |
| `packages/ui/src/custom/org-landing-page/landing-page-footer.tokens.ts` | Footer tokens |
| `packages/ui/src/custom/org-landing-page/secondary-action-button.svelte` | Button variant |
| `packages/ui/src/custom/org-landing-page/embed.svelte` | Optional variant branch |
| `packages/ui/src/custom/org-landing-page/index.ts` | Exports |
| `packages/storybook/src/templates/org-landing-page/org-landing-page.stories.svelte` | Storybook story |
| `apps/dashboard/src/lib/utils/types/org.ts` | Dashboard theme union |
| `apps/dashboard/src/lib/features/org/utils/landing-page.ts` | Lazy switches + themes array |
| `apps/dashboard/src/lib/features/org/utils/landing-page-components.ts` | Eager maps (settings preview) |
| `apps/dashboard/src/lib/features/settings/pages/landingpage.svelte` | Theme picker card |
| `apps/dashboard/src/lib/utils/translations/en.json` | Title + description |
| `apps/dashboard/static/templates/<theme>.png` | Preview image (<500KB) |
