---
name: ahrefs-research
description: "Pulls Ahrefs data through the official MCP server or API v3 and ships a competitor gap Kanban with scaffolded pages, a clean link-replication CSV, Reddit-mined page specs, and exact link-insertion target URLs. Use when the user asks for competitor research, content gaps, top pages, backlink audits, 'is this DR real', Reddit topic mining, or picking a page on a prospect site for a link insertion."
---

# Ahrefs Research for Coding Agents

Ahrefs data is only worth the API units if it ends as a file in the repo. Every workflow below terminates in a Markdown roadmap, a CSV, or a scaffolded route. Never stop at "here is what I found".

**When invoking:** On first use, state which connection path you detected and which workflow you are running, then run it. On repeat use, go straight to the output.

## Step 0: Pick the Connection Path

```
Is an Ahrefs tool in your tool list (names mirror v3 paths, e.g. site-explorer-top-pages)?
├── Yes → use the MCP tools. Same params as the REST calls below.
└── No → is $AHREFS_API_KEY set? (run: test -n "$AHREFS_API_KEY" && echo set)
    ├── Yes → use the `ahrefs` shell helper below (REST v3).
    └── No → CSV fallback:
        1. Ask the user to export the matching Ahrefs report as CSV (UTF-8).
        2. Save to seo/data/ahrefs/<report>-<domain>.csv
        3. Parse the CSV columns (URL, Traffic, Top keyword, Value, Referring domains)
           and continue the same workflow from the "Filter" step.
```

Why the order: MCP needs zero glue code, REST is scriptable and repeatable, CSV is slow but keeps the workflow alive when the user has a UI seat and no API plan.

### REST helper

Paste into the shell session once:

```bash
ahrefs() { # usage: ahrefs <endpoint> key=value ...
  local ep="$1"; shift
  local args=(); for kv in "$@"; do args+=(--data-urlencode "$kv"); done
  curl -sS --get "https://api.ahrefs.com/v3/$ep" \
    -H "Authorization: Bearer $AHREFS_API_KEY" \
    -H "Accept: application/json" "${args[@]}"
}
mkdir -p seo/data/ahrefs
TODAY=$(date +%F)
```

### Unit budget rules

- Each call costs `max(50, per_row_cost × rows)` units. `sum_traffic` and `value` cost 10 units per row, `referring_domains` costs 5, `url` and `top_keyword` cost 1.
- Always set `limit`. Default to 100 rows, never above 500 without the user's OK. Why: one unbounded `top-pages` call on a large domain burns a monthly allowance.
- Always set `select` to the exact fields the workflow uses. Extra columns are paid columns.
- Cache every raw response to `seo/data/ahrefs/*.json` and reuse it within 7 days. Why: Ahrefs refreshes traffic estimates slowly, so a re-pull within a week buys nothing.
- To confirm a `where` field name, apply the same filter in the Ahrefs UI and click the `API {}` button. Why: field names differ per endpoint (`traffic` on `organic-competitors`, `sum_traffic` on `top-pages`).

## Workflow A: Competitor Top-Pages Gap Diffing

**Output:** `seo/competitor-gaps.md` Kanban + 1-3 scaffolded pages.

1. **Pull the target's ranking pages.**

   ```bash
   ahrefs site-explorer/top-pages target=example.com mode=subdomains country=us date=$TODAY \
     select=url,top_keyword,sum_traffic,value,referring_domains \
     order_by=sum_traffic:desc limit=200 > seo/data/ahrefs/top-pages-example.com.json
   ```

2. **Find competing domains.**

   ```bash
   ahrefs site-explorer/organic-competitors target=example.com mode=subdomains country=us date=$TODAY \
     select=competitor_domain,domain_rating,keywords_common,keywords_competitor,share,traffic \
     order_by=keywords_common:desc limit=25 > seo/data/ahrefs/competitors-example.com.json
   ```

3. **Filter competitors to 5-10 real peers.**
   - Drop UGC and platform giants: `reddit.com`, `youtube.com`, `quora.com`, `medium.com`, `wikipedia.org`, `linkedin.com`, `github.com`, `stackoverflow.com`. Why: you cannot copy their ranking power by publishing a page.
   - Keep domains with `keywords_common >= 50` and `keywords_competitor >= 200`. Why: low overlap means a different market, and a low `keywords_competitor` means nothing to steal.
   - Cap at 10. Why: past 10, the marginal competitor adds noise and units, not new topics.

4. **Pull each competitor's top pages** with a traffic floor:

   ```bash
   ahrefs site-explorer/top-pages target=<competitor> mode=subdomains country=us date=$TODAY \
     select=url,top_keyword,sum_traffic,value,referring_domains \
     where='{"field":"sum_traffic","is":["gte",50]}' \
     order_by=sum_traffic:desc limit=100 > seo/data/ahrefs/top-pages-<competitor>.json
   ```

5. **Normalize topics.** Topic key = `top_keyword` lowercased, with competitor brand names, years, and the modifiers `best`, `free`, `online`, `top`, `2026` removed.

6. **Classify every competitor page:**

   ```
   competitor page
   ├── URL is homepage, /pricing, /login, /signup, or top_keyword contains the competitor brand
   │   └── Skip. Navigational traffic, not stealable.
   ├── target has a top-pages row with the same topic key
   │   └── Covered. Skip.
   ├── repo already has a route/content file for the topic (grep app/, pages/, content/, sitemap)
   │   └── Refresh column. The page exists but does not rank: fix it, do not duplicate it.
   ├── competitor URL contains /tools/, /calculator, /generator, /checker
   │   └── Build Tool column. Run dataforseo-serp Workflow B before building.
   └── everything else
       └── New Page column.
   ```

   Why the repo grep: Ahrefs only lists pages that already rank, so a missing row can mean "unranked page", and shipping a second page for the same topic cannibalizes the first.

7. **Score and sort.**
   `score = value_usd_sum × competitors_ranking ÷ (1 + median_referring_domains ÷ 10)`
   - `value` comes back in USD cents. Divide by 100.
   - `competitors_ranking` = how many filtered competitors have a page on that topic. Why: a topic three peers rank for is proven demand, a topic one peer ranks for can be a fluke.
   - Dividing by referring domains pushes topics that rank on content alone to the top.

8. **Write `seo/competitor-gaps.md`:**

   ```markdown
   # Competitor Gaps: example.com (pulled 2026-11-12, US)

   ## Backlog
   | Score | Topic | Best competitor URL | Traffic | Value | RDs | Type |
   |---|---|---|---|---|---|---|
   | 412 | preview deployments | https://rival.dev/docs/previews | 3,100 | $2,480 | 4 | New Page |

   ## Next (top 3, scaffolded in this PR)
   ## Refresh
   ## Build Tool
   ## Shipped
   ```

9. **Scaffold the top 1-3 rows** from Next in the user's framework (detect from `package.json`):
   - Route path copies the winning URL pattern (`/docs/...`, `/vs/...`, `/tools/...`, `/blog/...`).
   - `<title>` and `<h1>` contain the exact `top_keyword`.
   - Outline lists every H2 found on the top competitor page plus one section they lack (pricing table, code sample, or comparison grid).
   - Add the route to the sitemap and link it from 2 existing related pages.

**Pass/fail:** Done only when `seo/competitor-gaps.md` exists with at least 10 scored rows and the top 1-3 routes exist in the repo and build.


## Workflow B: Fake DR vs. Real Best Links Audit

**Output:** `seo/link-targets.csv`, a list of links a competitor earned that you can replicate.

### Why raw DR lies

- **Sitewide footer and sidebar links:** one network of sites links from every template, which inflates referring domains overnight with zero editorial intent.
- **Cookie widgets, "powered by" scripts, and free themes:** an injected link lands on thousands of tiny sites, so DR climbs while no human ever chose to link.
- **Popunder and bot traffic spoofing:** sellers pump cheap traffic so third-party traffic panels look healthy. Ahrefs organic traffic comes from rankings, so check the organic keyword curve, not a traffic screenshot.

A real site shows a multi-keyword organic curve: traffic spread across hundreds of keywords, rising or flat over 12 months. A fake one shows DR 50+ with a handful of keywords or a single spike.

### Procedure

1. **Check the competitor itself is real.** (`site-explorer/metrics` returns a single `metrics` object and rejects `select=`, so filter with `jq`.)

   ```bash
   ahrefs site-explorer/metrics target=<competitor> mode=subdomains country=us date=$TODAY \
     | jq '.metrics | {org_keywords, org_keywords_1_3, org_traffic}'
   ```

   ```
   competitor
   ├── org_keywords >= 300 and org_keywords_1_3 >= 20 → real, replicate its links
   └── fails either → skip it. Its links are not why it ranks, so copying them buys nothing.
   ```

2. **Pull one live link per referring domain, filtered to editorial links.**

   ```bash
   ahrefs site-explorer/all-backlinks target=<competitor> mode=subdomains \
     aggregation=1_per_domain history=live \
     select=url_from,url_to,anchor,domain_rating_source,traffic,positions,is_dofollow,is_content,links_external \
     where='{"and":[{"field":"is_dofollow","is":["eq",true]},{"field":"is_content","is":["eq",true]},{"field":"traffic","is":["gt",10]},{"field":"positions","is":["gte",5]}]}' \
     order_by=traffic:desc limit=300 > seo/data/ahrefs/best-links-<competitor>.json
   ```

   Why each filter:
   - `is_dofollow=true`: nofollow links pass little ranking value.
   - `aggregation=1_per_domain`: one row per site, so a sitewide footer counts once.
   - `is_content=true`: links inside the article body, not footers or sidebars.
   - `traffic > 10`: the referring page itself gets Google visits, so Google trusts it.
   - `positions >= 5`: the referring page ranks for 5+ keywords, the per-page version of the multi-keyword curve.

3. **Drop link farms in post-processing:**
   - `links_external > 150` → drop. Why: pages linking out to 150+ sites are "write for us" farms.
   - `domain_rating_source >= 70` with `traffic < 50` → drop. Why: high DR with no page traffic is the inflated pattern above.
   - URL contains `/tag/`, `/author/`, `/page/`, `?replytocom` → drop.

4. **Classify the replication path from `url_from`:**

   ```
   url_from
   ├── /integrations, /partners, /marketplace → partner listing (build the integration)
   ├── /write-for-us, /guest, author bio link → guest post
   ├── directory or review site (g2, capterra, alternativeto, saashub) → directory-submissions skill
   └── editorial article mention → contextual link insertion
   ```

5. **Write `seo/link-targets.csv`:**

   ```csv
   competitor,referring_domain,url_from,url_to,anchor,dr,page_traffic,page_keywords,link_type,replication_path,status
   rival.dev,devtoolsweekly.io,https://devtoolsweekly.io/best-ci-tools,https://rival.dev/,Rival,58,1240,87,listicle,pitch editor,todo
   ```

   Sort by `page_traffic` desc. Mark domains that link to 2+ competitors and not to you as `priority=high`. Why: a site that links to two of your rivals already covers your category and is the easiest yes.

**Pass/fail:** Done when `seo/link-targets.csv` exists with every row classified. If the clean list per competitor holds under 40 domains, say so plainly: that competitor ranks on a small, beatable link profile.


## Workflow C: Subreddit Pain and Topic Mining

**Output:** `seo/reddit-topics.md` + 1-2 scaffolded comparison or tool pages.

Reddit threads that rank in Google are proof that a buyer question has search volume and that Google wants an experience-led answer. Mine them, then answer with a page that names your product honestly.

1. **Pull the subreddit's ranking threads in Path mode:**

   ```bash
   ahrefs site-explorer/top-pages target=reddit.com/r/devops/ mode=prefix country=us date=$TODAY \
     select=url,top_keyword,top_keyword_volume,sum_traffic,keywords \
     order_by=sum_traffic:desc limit=200 > seo/data/ahrefs/reddit-devops.json
   ```

2. **Strip the slug:** remove `https://www.reddit.com/r/devops/comments/<id>/`, replace `_` with spaces. `.../comments/1abc2d/best_log_monitoring_tool_for_small_team/` becomes `best log monitoring tool for small team`.

3. **Cluster by `top_keyword`,** not by thread title. Why: the title is what one user typed, `top_keyword` is what Google searchers type, and the page must target the searcher.

4. **Keep only buyer questions:**
   - `top_keyword_volume >= 50`
   - `top_keyword` or slug matches `best|alternative|vs|recommend|tool for|cheapest|self-hosted|without|switch from`
   - Drop memes, career, and news threads.

5. **Map each cluster to a page type:**

   ```
   cluster pattern
   ├── "<tool> alternative", "switch from <tool>" → /alternatives/<tool>
   ├── "<a> vs <b>" → /vs/<a>-vs-<b>
   ├── "best <category> for <segment>" → /best/<category>-for-<segment>
   ├── "how to <task> without <cost/pain>" → /tools/<task> (free tool) or a guide
   └── no product fit → skip. Why: a page you cannot tie to the product earns traffic and zero signups.
   ```

6. **Write `seo/reddit-topics.md`** with: cluster keyword, volume, thread count, top 3 thread URLs, quoted pain points (copy 1-line complaints verbatim from the slugs and titles), target page type, slug.

7. **Scaffold the top 1-2 pages.** Use the verbatim pain points as H2s. Include a comparison table with real pricing and limits. Why: Reddit users ask for specifics, and the same specifics are what AI answers quote.

**Pass/fail:** At least 5 clusters with volume, and the top page scaffolded.

## Workflow D: Link-Insertion Page Matcher

**Output:** `seo/insertion-targets.md` with the exact URL on the prospect site where a contextual mention fits.

Insertions on a page that already ranks pass more value than a fresh guest post on a page with no traffic, and editors approve edits faster when the mention fits the existing paragraph.

1. **Fetch the prospect's top 30 content URLs:**

   ```bash
   ahrefs site-explorer/top-pages target=<prospect-domain> mode=subdomains country=us date=$TODAY \
     select=url,top_keyword,sum_traffic,referring_domains \
     where='{"and":[{"field":"url","is":["regex","/(blog|guides?|docs|learn|resources)/"]},{"field":"sum_traffic","is":["gt",0]}]}' \
     order_by=sum_traffic:desc limit=30 > seo/data/ahrefs/insertion-<prospect>.json
   ```

2. **Exclude** homepage, and any URL matching `login|signin|signup|privacy|terms|legal|cookie|careers|tag|category|author`.

3. **Pick the match:**

   ```
   candidate page
   ├── top_keyword is one step upstream of your product (logpulse.dev → "how to monitor docker logs")
   │   └── Best match. Reader has the problem your product solves.
   ├── top_keyword names your category ("log management tools")
   │   └── Good match, likely a listicle. Ask for a listed entry.
   ├── top_keyword is adjacent but no natural sentence fits
   │   └── Skip. Forced mentions get removed in the next content refresh.
   └── sum_traffic < 20
       └── Skip. The page does not rank, so the link passes little.
   ```

4. **Write `seo/insertion-targets.md`:** per prospect, list the chosen URL, its `top_keyword`, traffic, the paragraph heading where the mention fits, and a ready insertion sentence:

   ```markdown
   ## devtoolsweekly.io
   - URL: https://devtoolsweekly.io/blog/docker-logging-guide
   - Ranks for: "docker logs" (1,900/mo est. page traffic)
   - Insert under: "Shipping logs off the host"
   - Sentence: "For small teams, [LogPulse](https://logpulse.dev) tails container logs into one searchable view without running an ELK stack."
   ```

**Pass/fail:** Every prospect gets one chosen URL or an explicit "no fit" line. No prospect gets the homepage.


## Shipped Outputs Checklist

- [ ] `seo/data/ahrefs/*.json` raw pulls cached
- [ ] `seo/competitor-gaps.md` scored Kanban + 1-3 routes scaffolded
- [ ] `seo/link-targets.csv` classified replication list
- [ ] `seo/reddit-topics.md` + top page scaffolded
- [ ] `seo/insertion-targets.md` with exact URLs and insertion sentences
- [ ] All new routes added to sitemap and linked from 2 existing pages

## Related

- Live SERP checks, keyword clustering, and AI citation sources: [dataforseo-serp](../dataforseo-serp/SKILL.md)
- Full revenue-first teardown: [seo-roast](../seo-roast/SKILL.md)
