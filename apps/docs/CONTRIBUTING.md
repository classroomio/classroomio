# Contributing to the docs

These are the placement rules for the ClassroomIO docs. Read them before adding or moving a page. They exist so the site stays organized as more people write for it, not just as a one-time cleanup.

## The twelve rules 

1. **Audience decides the tab.** Pages for people using the product in a browser go in the user zones (Platform, Help Center). Pages for people integrating with, running, or contributing to the product go in the developer zones (Developers, Self-Hosting, API).
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

The docs have five tabs: Platform, Help Center, Developers, Self-Hosting, API. Help Center is single-audience: academy owners and admins, running their academy day to day. Developers, Self-Hosting, and API are the three developer-facing homes rule 6 asks for: Developers covers consuming the API and contributing to the codebase, Self-Hosting covers running the product, and API is the endpoint reference itself.

This split happened in two stages, and it's worth knowing the history so the current shape doesn't look accidental:

- **Stage 1**: before a Developers tab existed, Token Auth and MCP (developer-integration guides, not end-user features) moved into a "Build with the API" group inside the Guides tab, the only developer-adjacent space available at the time. That was a documented stopgap, not the end state.
- **Stage 2**: once a dedicated Developers tab existed, "Build with the API" moved there along with the former Developer Guides (renamed Contributor Guides). The old Guides tab was renamed Help Center and stripped down to user guides only. The audience split now happens at the tab level, per rule 1, instead of as two sidebar groups sharing one tab.

Token Auth and MCP still don't live inside the API tab itself. Blume's Scalar-rendered API tab (`openapi.renderer: 'scalar'` in `blume.config.ts`) is a sealed, single-route embed: it cannot hold extra sidebar pages, so there's no way to put a hand-authored MDX page literally inside it. Developers is the correct zone for them regardless: rule 5 asks for developer surfaces to live in developer zones, not specifically inside the API tab, and rule 6 asks for three separate homes for consuming the API, running the product, and contributing to the code, not four. If Blume ever supports content pages alongside an OpenAPI source, that's a reason to reconsider, not the current state.

## How rule 10 actually works here

An opaque nav label is usually better fixed with a description than a rename, especially when the term is the live product's own name for the feature (renaming "Audience" in the docs when the app itself calls it Audience would just teach readers a second name for the same thing). But Blume's sidebar has no per-item description field: an explicit `navigation.sidebar` entry is a bare route string, and only page frontmatter (`label`, `icon`, `badge`, `order`) or a `selectors` entry (a different mechanism, for switching between whole site partitions) take extra fields. There's no tooltip or subtitle slot on a normal page link.

So in practice, "prefer a description" means the page's own opening line does that job instead: `audience.mdx`, `cohorts.mdx`, and `community.mdx` all open with a one-sentence, bolded definition of the term before anything else, so the ambiguity resolves the moment someone clicks through, even though the sidebar label itself stays terse. Check `terminology.mdx` too. A term used as a nav label should be defined there.

## Where things actually live

- **Platform**: welcome, introduction, quickstart, and Features (the concept/overview pages).
- **Help Center**: task-oriented how-tos for academy owners and admins, grouped by job. User guides only.
- **Developers**: Build with the API (Token Auth, MCP) and Contributor Guides (local setup, contributing code, design, translations, infrastructure).
- **Self-Hosting**: running ClassroomIO on your own infrastructure.
- **API**: the OpenAPI reference, generated. Don't hand-write pages here.

## Before you move or rename a page

- Navigation lives in exactly one place: `blume.config.ts`. Don't add a second sidebar or route list anywhere else.
- If a page's route changes, check `scripts/package-assets.mjs`. Guides moved out of the root already redirect automatically (it diffs slugs between `content/docs/` and `content/docs/guides/`), but a move anywhere else needs a manual entry in the `REDIRECTS` template so the old URL doesn't 404.
- Run `pnpm validate` before you're done. It catches broken internal links and heading anchors.
