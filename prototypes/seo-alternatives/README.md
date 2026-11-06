# ClassroomIO SEO strategy prototype

A clickable, no-build prototype of the SEO and content strategy for the nine competitor alternative pages and their supporting content. It is for review and refinement. It is not connected to the production website and nothing here is published.

The full research, evidence and reasoning live in Notion under "ClassroomIO SEO and Content Strategy". This prototype shows the same strategy visually, including the proposed landing page copy and structure.

## Open it

No server, build step or install is needed. Open `index.html` in a browser:

```bash
open prototypes/seo-alternatives/index.html
```

If your browser blocks local scripts, serve the folder instead:

```bash
cd prototypes/seo-alternatives && python3 -m http.server 8080
```

Then visit http://localhost:8080.

## Navigate

- The left menu (a Menu button on small screens) links every section and all nine competitor pages.
- Strategy overview: goal, audience, priorities, recommendations and what ClassroomIO can claim today.
- Alternatives hub: nine cards, filterable by group and wave. Each card opens that platform page.
- Competitor pages: hero preview with three switchable headlines, search strategy, benefits and limits, page structure, comparison table, differentiation, FAQ copy, a verify checklist and connections to related blog posts and platforms.
- Keyword research, Blog content strategy, Content roadmap, Internal linking and Measurement plan.
- Blog posts and competitor pages link to each other. Links such as `blog.html#b03` open the post directly.

Buttons that look like calls to action inside the hero preview are dashed labels, not links, because they show proposed copy.

## Folder layout

```
seo-alternatives/
  index.html                  Strategy overview
  keywords.html               Keyword research
  blog.html                   Blog content strategy
  roadmap.html                Content roadmap
  linking.html                Internal linking
  measurement.html            Measurement plan
  alternatives/
    index.html                Alternatives hub
    <platform>.html           One page per competitor (nine)
  assets/
    styles.css                Shared styles
    app.js                    Shared layout, navigation and helpers
    render.js                 Page renderers
  data/
    site.js                   Competitor list, keywords, blog posts, roadmap, linking, measurement, claims
    pages/<platform>.js       Copy, structure, comparison and differentiation for each competitor
```

## Edit the content

All copy lives in `data/`, so you rarely touch HTML.

- Change a headline, meta description, benefit, comparison row or FAQ: edit `data/pages/<platform>.js`. The `messaging.recommended` number picks which of the three headlines shows first.
- Change priorities, keywords, blog posts, roadmap items, link relationships or metrics: edit `data/site.js`.
- Reorder platforms: change `rank` and `wave` in `data/site.js`.
- Add a platform: add an entry to `competitors` and `keywordRows` in `data/site.js`, create `data/pages/<slug>.js`, copy any file in `alternatives/`, change its `data-slug` and add a script tag for the new data file to the pages that load them.
- Add a blog post: add an object to `blog` in `data/site.js`. Set `links` to platform slugs, or `hub`.

Reload the page after an edit.

## Evidence rules

- Keyword volume and difficulty are unavailable because no keyword tool was used. Do not add numbers without a source and date.
- Competitor facts carry a date checked. Re-check every price and plan limit before publishing.
- The claims table on the overview lists what ClassroomIO can and cannot claim today, checked against the repository on 2026-10-21.
