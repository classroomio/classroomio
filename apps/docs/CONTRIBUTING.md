# Contributing to the docs

These are the placement rules for the ClassroomIO docs. Read them before adding or moving a page. They exist so the site stays organized as more people write for it, not just as a one-time cleanup.

## The twelve rules 

1. **Audience decides the app.** Pages for people using the product in a browser split further: concept/overview pages live in Platform (this app's user zone), task-based how-tos live in the Help Center (`apps/help`, a separate app — see below). Pages for people integrating with, running, or contributing to the product go in the developer zones (Developers, Self-Hosting, API), all within this app.
2. **Intent decides the section within the tab.** Explaining what something is is a concept page and belongs in Features. Walking someone through a task is a how-to: Help Center for academy owners, Developers for contributors and integrators. Listing endpoints and parameters is reference and belongs in API. Getting the product running on someone's infrastructure is Self-Hosting.
3. **One page, one intent.** Don't explain architecture inside a how-to. Don't put a task checklist inside a concept page. If a page drifts into a second intent, split it and link the two halves.
4. **Concepts and tasks link to each other.** Each concept page links to its matching how-to, and the how-to links back.
5. **Developer surfaces live in developer zones.** API, MCP, SDKs, webhooks, and auth tokens are not end-user core features, no matter how central they are.
6. **"Developer" is three audiences.** Keep consuming the API, running the product, and contributing to the code in three separate homes.
7. **Every feature area opens with an overview page.**
8. **Order the sidebar the way people actually use the product.**
9. **Cross-cutting reference is documented once.** Auth, errors, rate limits, and pagination go in the API introduction, not repeated per endpoint.
10. **Labels are self-explanatory and consistent** in spelling and title style.
11. **Nothing unfinished ships in primary navigation.** Finish it or unlink it.
12. **Navigation comes from one source of truth.** A rename applied once should apply everywhere.

## How rules 1 and 5 actually work here

This app (`apps/docs`) has four tabs: Platform, Developers, Self-Hosting, API. Developers, Self-Hosting, and API are the three developer-facing homes rule 6 asks for: Developers covers consuming the API and contributing to the codebase, Self-Hosting covers running the product, and API is the endpoint reference itself. Platform covers what things are (concepts/overview), not how to do them.

Task-based user guides — how academy owners and admins actually run their academy day to day — live in **`apps/help`**, a separate Blume app served at `classroomio.com/help`, not a tab in this app. It has its own `blume.config.ts`, its own `content/help` tree, and its own `CONTRIBUTING.md`-equivalent conventions (currently: sidebar generated from the folder tree, group order/label from each folder's `meta.ts`, page order from `sidebar.order` frontmatter). Cross-link into it with an absolute `/help/...` path — it is a different deployed app, so a root-relative link like `/help/build-a-course/course-types` is required, not a `/build-a-course/course-types`-style path as if it were still local content.

This split happened in three stages, and it's worth knowing the history so the current shape doesn't look accidental:

- **Stage 1**: before a Developers tab existed, Token Auth and MCP (developer-integration guides, not end-user features) moved into a "Build with the API" group inside the Guides tab, the only developer-adjacent space available at the time. That was a documented stopgap, not the end state.
- **Stage 2**: once a dedicated Developers tab existed, "Build with the API" moved there along with the former Developer Guides (renamed Contributor Guides). The old Guides tab was renamed Help Center and stripped down to user guides only. The audience split now happens at the tab level, per rule 1, instead of as two sidebar groups sharing one tab.
- **Stage 3**: the Help Center tab moved out of this app entirely, into the standalone `apps/help`. It had grown a duplicated, self-nested sidebar (several groups defined twice, once at the top level and once nested inside a "Build a course" wrapper) — reason enough on its own, plus giving user help its own top-level URL and search scope, independent from developer docs.

Token Auth and MCP still don't live inside the API tab itself. Blume's Scalar-rendered API tab (`openapi.renderer: 'scalar'` in `blume.config.ts`) is a sealed, single-route embed: it cannot hold extra sidebar pages, so there's no way to put a hand-authored MDX page literally inside it. Developers is the correct zone for them regardless: rule 5 asks for developer surfaces to live in developer zones, not specifically inside the API tab, and rule 6 asks for three separate homes for consuming the API, running the product, and contributing to the code, not four. If Blume ever supports content pages alongside an OpenAPI source, that's a reason to reconsider, not the current state.

## How rule 10 actually works here

An opaque nav label is usually better fixed with a description than a rename, especially when the term is the live product's own name for the feature (renaming "Audience" in the docs when the app itself calls it Audience would just teach readers a second name for the same thing). But Blume's sidebar has no per-item description field: an explicit `navigation.sidebar` entry is a bare route string, and only page frontmatter (`label`, `icon`, `badge`, `order`) or a `selectors` entry (a different mechanism, for switching between whole site partitions) take extra fields. There's no tooltip or subtitle slot on a normal page link.

So in practice, "prefer a description" means the page's own opening line does that job instead: `audience.mdx`, `cohorts.mdx`, and `community.mdx` all open with a one-sentence, bolded definition of the term before anything else, so the ambiguity resolves the moment someone clicks through, even though the sidebar label itself stays terse. Check `terminology.mdx` too. A term used as a nav label should be defined there.

## Where things actually live

- **Platform** (this app): welcome, introduction, quickstart, and Features (the concept/overview pages).
- **Help Center** (`apps/help`, not this app): task-oriented how-tos for academy owners and admins, grouped by job. User guides only.
- **Developers**: Build with the API (Token Auth, MCP) and Contributor Guides (local setup, contributing code, design, translations, infrastructure).
- **Self-Hosting**: running ClassroomIO on your own infrastructure.
- **API**: the OpenAPI reference, generated. Don't hand-write pages here.

## Documentation types

Every page is one of three types:

- **User guide**: task-based, "how to do X." `apps/help` for academy-owner tasks, Developers for contributor and integrator tasks.
- **Feature reference**: what something is and how it behaves. Features (Platform tab) or the relevant Developers section.
- **Changelog entry**: one line, no page.

If a change doesn't cleanly fit a user guide or a feature reference, it gets a changelog line, not a page. Most PRs that touch the product surface warrant a line, not a new file.

The API reference is generated from the OpenAPI spec (`upload-openapi-spec.yml` regenerates it on every push to `main`), so it sits outside this taxonomy. Never hand-write pages there.

## Voice and style

Second person, present tense. Headings name what the reader does, not the feature's internal name: "See your food," not "Food viewing feature."

Vale (`docs-validate.yml`) checks prose for passive voice and wordiness on every PR touching `apps/docs/**`, advisory only. It doesn't check the heading rule above yet: that's still a review call, not a lint rule.

## Staying current

Give pages a `last_reviewed: YYYY-MM-DD` frontmatter field. Run `pnpm docs:check-stale` to list pages missing that date or older than 90 days.

## Before you move or rename a page

- Navigation lives in exactly one place: `blume.config.ts`. Don't add a second sidebar or route list anywhere else.
- If a page's route changes, add a manual entry to the `REDIRECTS` template in `scripts/package-assets.mjs` so the old URL doesn't 404.
- Run `pnpm validate` before you're done. It catches broken internal links and heading anchors — but not cross-app links into `apps/help`, since that's a separate Blume project; `blume validate` only checks a project's own content tree.
