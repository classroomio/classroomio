# Contributing to the docs

These are the placement rules for the ClassroomIO docs. Read them before adding or moving a page. They exist so the site stays organized as more people write for it, not just as a one-time cleanup.

## The eleven rules

1. **Audience decides the app.** Task-based how-tos for people using the product in a browser live in the Help Center (`apps/help`, a separate app — see below), including its Glossary. Pages for people integrating with, running, or contributing to the product go in Developers (this app), which now covers consuming the API, self-hosting, and contributing to the codebase.
2. **Intent decides the section within Developers.** Consuming the API is Build with the API. Getting the product running on someone's infrastructure is Self-Hosting. Working on the codebase itself is Contributing. Listing endpoints and parameters is reference and belongs in API, the sealed OpenAPI tab.
3. **One page, one intent.** Don't explain architecture inside a how-to. Don't put a task checklist inside a concept page. If a page drifts into a second intent, split it and link the two halves.
4. **Concepts and tasks link to each other.** A concept page links to its matching how-to, and the how-to links back.
5. **Developer surfaces live in Developers.** API, MCP, SDKs, and auth tokens are not end-user core features, no matter how central they are.
6. **"Developer" is three jobs, one home.** Consuming the API, running the product, and contributing to the code are three sections inside Developers, not three separate tabs — see rule 1's history below for why.
7. **Every section opens with an overview page.**
8. **Order the sidebar the way people actually use the product.**
9. **Cross-cutting reference is documented once.** Auth, errors, rate limits, and pagination go in the API introduction, not repeated per endpoint.
10. **Labels are self-explanatory and consistent** in spelling and title style.
11. **Navigation comes from one source of truth.** A rename applied once should apply everywhere.

## How rules 1 and 6 actually work here

This app (`apps/docs`) has three tabs: Help Center (an external link out to `apps/help`), Developers, and API. Developers nests three sections: Build with the API (Token Auth, MCP — consuming it), Self-hosting (running the product on your own infrastructure), and Contributing (working on the codebase). API is the endpoint reference itself, rendered from the OpenAPI spec.

There used to be a fourth tab, Platform, holding concept/overview pages (what a course, cohort, or organization *is*) and a Self-Hosting tab holding self-hosting guides. Both are gone: Platform's content either had no substance beyond linking out to Help (so the pages were deleted and the links folded into Help's own onboarding flow) or became the Glossary, now in Help's Reference section. Self-Hosting moved from a peer tab into a nested section under Developers — it's still a developer-facing job (running the product), just no longer a fourth top-level audience.

Task-based user guides — how academy owners and admins actually run their academy day to day — live in **`apps/help`**, a separate Blume app served at `classroomio.com/help`, not a tab in this app. It has its own `blume.config.ts` with an explicit `navigation.sidebar` (group label/order/membership declared directly there, not derived from folder `meta.ts` files), its own `content/help` tree, and its own `CONTRIBUTING.md`-equivalent conventions. Cross-link into it with an absolute `/help/...` path — it is a different deployed app, so a root-relative link like `/help/build-a-course/course-types` is required, not a `/build-a-course/course-types`-style path as if it were still local content.

This split happened in four stages, and it's worth knowing the history so the current shape doesn't look accidental:

- **Stage 1**: before a Developers tab existed, Token Auth and MCP (developer-integration guides, not end-user features) moved into a "Build with the API" group inside the Guides tab, the only developer-adjacent space available at the time. That was a documented stopgap, not the end state.
- **Stage 2**: once a dedicated Developers tab existed, "Build with the API" moved there along with the former Developer Guides (renamed Contributor Guides). The old Guides tab was renamed Help Center and stripped down to user guides only. The audience split now happens at the tab level, per rule 1, instead of as two sidebar groups sharing one tab.
- **Stage 3**: the Help Center tab moved out of this app entirely, into the standalone `apps/help`. It had grown a duplicated, self-nested sidebar (several groups defined twice, once at the top level and once nested inside a "Build a course" wrapper) — reason enough on its own, plus giving user help its own top-level URL and search scope, independent from developer docs.
- **Stage 4**: Platform was dropped and Self-Hosting was folded into Developers as a nested section, collapsing four developer/product-facing tabs down to two (Developers, API) plus the external Help Center link. A Glossary replaced Platform's role as the place terminology lives, moved into Help's Reference section since it serves the same broad audience Help already targets.

Token Auth and MCP still don't live inside the API tab itself. Blume's Scalar-rendered API tab (`openapi.renderer: 'scalar'` in `blume.config.ts`) is a sealed, single-route embed: it cannot hold extra sidebar pages, so there's no way to put a hand-authored MDX page literally inside it. Developers is the correct zone for them regardless: rule 5 asks for developer surfaces to live in Developers, not specifically inside the API tab. If Blume ever supports content pages alongside an OpenAPI source, that's a reason to reconsider, not the current state.

## How rule 10 actually works here

An opaque nav label is usually better fixed with a description than a rename, especially when the term is the live product's own name for the feature (renaming "Audience" in the docs when the app itself calls it Audience would just teach readers a second name for the same thing). But Blume's sidebar has no per-item description field: an explicit `navigation.sidebar` entry is a bare route string, and only page frontmatter (`label`, `icon`, `badge`, `order`) or a `selectors` entry (a different mechanism, for switching between whole site partitions) take extra fields. There's no tooltip or subtitle slot on a normal page link.

So in practice, "prefer a description" means the page's own opening line does that job instead: `token-auth.mdx` and `self-hosted/enterprise.mdx` both open with a one-sentence definition of the term before anything else, so the ambiguity resolves the moment someone clicks through, even though the sidebar label itself stays terse. Help's `reference/glossary.mdx` (a separate app, but the natural place to check first) is the canonical definition source for product terminology — link to it rather than redefining a term locally.

## Where things actually live

- **Help Center** (`apps/help`, not this app): task-oriented how-tos for academy owners and admins, grouped by job, plus the Reference/Glossary section for terminology. User-facing content only.
- **Developers** (this app): Build with the API (Token Auth, MCP), Self-hosting (running ClassroomIO on your own infrastructure), and Contributing (local setup, contributing code, design, translations, infrastructure).
- **API** (this app): the OpenAPI reference, generated. Don't hand-write pages here.

## Documentation types

Every page is one of three types:

- **User guide**: task-based, "how to do X." `apps/help` for academy-owner tasks, Developers for contributor and integrator tasks.
- **Feature reference**: what something is and how it behaves. The relevant Developers section, or Help's Reference/Glossary for terminology.
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
