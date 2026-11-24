# Course builder: results

What was built and measured against the [plan](README.md), and what is left. The proposed code is in [implementation.md](implementation.md); where the code differs from it, the reason is recorded there or below.

Last measured: 2026-11-24, on branch `feat/onboarding-v2`.

## 1. Targets (plan §13)

| Metric | Target | Development | Held-out | Gold organisation |
|---|---|---|---|---|
| Discovery precision (accepted sources that belong to the organisation) | ≥ 98% | **100%** (36 of 36) | **100%** (26 of 26) | — |
| Discovery recall (the organisation's real sources found) | ≥ 90% | 56.1% (32 of 57); 62.5% without bot-challenged sources | 68.8% (22 of 32) | the knowledge base is found |
| Reading: share of each source's read target read | ≥ 98% | 12 of 34 sources; mean 78.5% | 3 of 10 sources that finished in time; see §3 | 95 of 140 pages in the 6-minute eval limit |
| Tree: pages under the right parent, in the right order | ≥ 95% | **99.1%** (4 labelled sources) | not labelled | 90 of 95 parents right |
| Coverage of the gold course at plan level | ≥ 90% | — | — | **90.6%** |
| Groundedness after repair (independent judge) | ≥ 98% | **100%** (Raken, 16 of 33 lessons, 502 claims) | not measured (budget) | **99.7%** |
| Answer keys correct | 100% | — | — | wrong keys caught and repaired by the checks (§6) |

Not met: discovery recall and reading on part of the sources. Why, and what would close the gap, is in §2 and §3. Held-out numbers were measured once, after all rules were fixed on development sites, and no rule was changed for them.

## 2. Discovery

Scored by `eval/score-discovery.mjs` against each site's reviewed ground truth (customer sample). Precision counts a source as belonging when it is one of the organisation's reviewed sources or reviewed non-sources, or sits on its own domain; "source precision" also asks that it be one of the reviewed sources.

| | Recall | Readable recall | Precision | Source precision | Slowest site |
|---|---|---|---|---|---|
| Development, first score | 40.7% | — | 52.5% | — | > 300 s |
| Development, after the fixes | 56.1% | 62.5% | 100% | 83.3% | 149 s |
| Held-out | 68.8% | 66.7% | 100% | 80.8% | 92 s |

Fixed on development sites:
- **Product-site pages with documentation words are hubs.** `/support`, `/faq`, `/developers` are read for their links to other hosts; the page itself is a source only when it is a section with at least 10 child pages (one buildertrend and one mrpeasy source are).
- **Script-shell landings are kept** for the reader to render instead of skipped as empty (7 development misses).
- **A source's own landing page is read for the organisation's other documentation** (a help centre's link to its API reference), on the brand's domain or the source's own.
- **Link text counts only as a navigation label** (at most 4 words), so a news headline containing "help" is not a help centre. YouTube links are channels, not sources. A host whose title or canonical address is the product site's is a copy of it.
- **Speed:** a TLS or certificate failure, or a missing host, fails at once (Raken's wildcard DNS made every probed subdomain refuse the handshake, about 122 s each: 249 s → 8.6 s), and a host that never answers gets no robots.txt patience after its retries time out (a 9-minute wait became about 2).

What recall still misses, on both splits:
- **Sources behind a bot challenge**: their hubs cannot be read, so nothing inside them is found (8 product help centres of one development site).
- **Sources held for confirmation** (`probe-only`): found by a guessed subdomain that does not name itself after the brand (3 development, 2 held-out).
- **Documentation the organisation never links** from its homepage, its support pages or its help centres; a person found these while reviewing the ground truth. Closing this needs the organisation to tell us: open question 7 and 8 (§8).

## 3. Reading

Measured by `eval/read-sites.mjs` against each source's verified read target, in runs of at most 7 minutes, then replayed from the disk cache.

**Development** (34 sources, 11,710 pages read): 12 sources read ≥ 98% of their target and 15 account for ≥ 98% (read, or seen to hold no article); mean completeness 78.5%. Every shortfall was examined; none is content the reader can see but loses:
- **Script shells, need the renderer:** Buildium's help centre (837 pages), Samsara Academy (202), Power Factors (13 of 34), Ideagen's 8 help centres (section pages list their articles only after a script runs).
- **Behind a login or a bot challenge:** UpKeep's lectures; project44's support centre (72% after the language fix below).
- **Stopped by the time limit:** Samsara's developer docs (963 of 1,205), Housecall Pro (638 of 673, 1 s crawl delay).
- **Not losses:** canonical duplicates, dead pages, pages no page or sitemap links to, a target that redirects to another site.

**Held-out** (three passes, 4,705 pages read): of the 10 sources that were not stopped by the page cap or the time limit, 3 read ≥ 98% (Facilio developers 100%, Facilio help 100%, MaintainX help 100%), and greenlight.guru's academy 95.7%, Kissflow developers 92.9%, Onfleet docs 88.1%, Onfleet help 77% (87% accounted). Two read nothing without the renderer (SimPRO 871 empty pages, Enverus 307 failed). On Kissflow's help centre 62 URLs name one article as their canonical page, so 53% is read; recorded, not tuned on. 1,033 shell pages wait for the renderer.

**Scale sample, development split** (46 sources, one run): no errors; every large failure is a script shell (Avalara, BambooHR, ServiceNow, GitLab University, Airtable developer docs, HubSpot Academy); robots-excluded sources recorded as such.

**Speed:** the crawl delay is counted from the previous request's start, as crawlers read `Crawl-delay`. A Raken page takes two requests (the HTML for links, structure and images; the `.md` copy for cleaner text): 2.5 s a page against a 1 s crawl delay, about 4 s before. Sources on different hosts read in parallel.

**Language:** a page that declares no language is named from its text (function words of seven European languages, only on a clear lead). The gold organisation's wiki serves a French twin with no language markup; it used to take a third of the read.

**Fixes from the live measurement** (all tested): retries for network failures and timeouts; robots.txt patience (10, 20, 30 s) for short failures; memory kept flat by dropping each page's HTML once parsed; a small cache so a page found during discovery is not downloaded twice; the Markdown form that worked tried first; real articles no longer rejected as empty (headers inside `main`, the innermost container holding the `h1`, entity decoding); small collections read as groups; login redirect loops recorded as restricted; redirectors and other-language URLs skipped once proven; sign-in links never queued; a per-source time budget; one broken page never fails a source; generated API references read by the section the URL names; empty pages recorded as `empty`, not `failed`; several `h1` resolved by the one repeating `<title>`; replacement by the version a title names.

**Politeness:** warming the cache over extra connections made three sites refuse the crawler for a while. Warming is off; reruns replay the cache (`--offline`).

## 4. Tree and exclusions

Four development sources were labelled blind by a separate agent, from cached pages, before any reader output was opened (`eval-data/<site>/tree-labels.json`, `exclusion-labels.json`; scored by `node eval/score-labels.mjs`, no requests). The before and after numbers and every remaining disagreement are in [implementation.md §13](implementation.md#13-evaluation). In short: tree accuracy 6.5% → 99.1% (embedded page data listed breadcrumb trails as top-level siblings; the unlinked last breadcrumb item became a group; home-page previews tied with full lists; a breadcrumb repeated in a dropdown looped), and exclusion agreement 93.1% → 96.0% with no product page wrongly excluded (a page's own words exclude headings, bare video URLs, related-article lists and feedback widgets).

## 5. Renderer and the gold organisation (items 4 and 5)

`apps/jobs/src/services/course-builder/renderer.ts`: headless Chromium per render context, private networks blocked before each request and checked again on every response, images and fonts refused, the browser recycled after 200 renders. Shell pages render at about 8 s each and need the machine to themselves.

**The browser's user agent** carries our name and contact inside a standard Chrome string (`Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClassroomIO-CourseBuilder/0.1; +https://classroomio.com) Chrome/<version> Safari/537.36`), as rendering crawlers send it. With only our name, the gold organisation's wiki answered "Browser not supported". robots.txt is still matched on our name.

**Gold organisation:** its knowledge base sits on a hosted wiki that nothing on its site links to; its `support.` name leads to a login-only service desk; robots.txt allows `/wiki/`, a script app. With the renderer, the reader goes from the service desk's host to the space directory and into the knowledge base: 153 pages in the 6-minute eval limit, 95 of the snapshot's 140, 90 of them under the right parent, stopped by the time limit, not by a failure (`eval-data/energis/item5-read.json`). A build has no such limit.

**Rollout (deploy):** the renderer is on by default and the jobs image installs Chromium (build with `INSTALL_CHROMIUM=false` only when `COURSE_BUILDER_RENDERER_CDP_URL` points at a hosted browser); size about 1 GB per browser. About 2,000 development and 1,000 held-out pages need it.

## 6. Gold course (items 7–11)

Measured on the gold organisation's snapshot (140 pages, 123 teachable; `eval/plan-gold.mjs`, `write-gold.mjs`, `check-gold.mjs`).

| Stage | Result | Cost |
|---|---|---|
| Page cards (Haiku, effort low) | 123 cards, no failures | $0.096 (target < $0.10) |
| Plan: 4 courses, 28 section briefs | gold coverage 90.6%: 13 of 16 gold sections covered, 3 partly | $0.98 |
| Writing the Administrator course | 8 sections, 31 lessons, 327 of 329 text blocks cited, 31 screenshots placed, 39 check questions, 16-question final quiz | $1.68 |
| Checks, repair, review | 99.4% grounded as written, **99.7%** after; citations right 99.4%; nothing removed | $0.34 |
| Import | imports and renders in ClassroomIO: callouts, screenshots, auto-graded checks, quiz of 13 | — |

- **Judge validated** against labels a separate agent made blind and the product owner adopted: the judge agrees on 89.4% (47 sentences) and 84.0% (50, first run); every disagreement was traced to the judge's input (sibling pages it was not given, sentences about the course itself) and fixed, except one context-free sentence. An optional re-judge of the 11 lessons behind the disagreements (about $1.25) was not run.
- **The Haiku checker catches 1–4 of the 7 subtle overstatements** the judge finds; acceptable at 99.4% before repair. Its value is citation corrections, wrong keys and wrong options, which repair fixes.
- Fixed during the measurement: the checker reads the section's sources, so "supported elsewhere" corrects a citation instead of deleting grounded text; repair rewrites only flagged passages; a lesson title repeated as its first heading is dropped; a section past the output limit reports why instead of vanishing.

## 7. Live builds (item 12) and cost

| Build | What | Pages | Courses | Time | Cost |
|---|---|---|---|---|---|
| linear.app, through onboarding on a fresh account (2026-11-20) | the production worker | 306 read, 135 teachable | 3 ready, 79 lessons, 27 exercises | 16 min | **$3.93** |
| rakenapp.com (development, eval) | one course of a 4-course plan, then the judge | 334 read, 202 teachable | 1 written, 6 sections, 33 lessons | 7 min of model time | $3.14 build + $1.58 judge (16 lessons) |
| getmaintainx.com (held-out, eval) | a 1-course plan | 329 read, 288 teachable | 1 written, 12 sections, 42 lessons; stopped at review by the budget | 8 min of model time | $3.08 |

- **Cost by stage** (Linear and Raken): cards $0.14–0.25; plan $0.74 (3 courses) to $1.61 (4 courses); writing $0.73–1.84 a course; checks, repair and review $0.25–0.33 a course. A 4-course build is about $6–10, under the $15 cap. The independent judge is measurement only: about $0.10 a lesson.
- **The Linear build** queued one ready email listing all three courses (the local worker has no mail transport, so it was not delivered), and each course appeared unpublished on the Courses page as soon as it was ready.
- **Found by the held-out run:** when a build's budget ran out during the final review, the course failed although its checks and repairs were done. Fixed: the checked course is kept unreviewed (below).

**Speed and cost (2026-11-24, measured).** Model stages spend their time waiting on the API, and this key's limits (10,000 requests, 5M input and 1M output tokens a minute on each model) leave wide headroom, so more requests now run at once; the client retries a rate-limited request up to 8 times, waiting as the API asks:

| What runs at once | Before | Now |
|---|---|---|
| Worker jobs per stage (discover, read, understand, plan, write, finish, export) | 2, 3, 1, 1, 2, 2, 2 | 4, 6, 4, 4, 8, 8, 4 |
| Page cards in a build | 16 | 96 |
| Sections written in a course | 4 | 12 |
| Lesson checks / repairs in a course | 8 / 4 | 24 / 12 |

Measured on Raken (paid, `eval/build-site.mjs`, which now writes a timeline of every call):

| Stage | Before | Now | Cost now |
|---|---|---|---|
| Page cards and glossary (202 pages) | 96 s | 55 s at 48 at once (cards done at 37 s, then one glossary call of 17 s); 96 at once now | $0.21 |
| Plan (4 courses) | 156–173 s, $1.58 | **83 s, $1.13**: course list 41 s, section plans 34–42 s in parallel, no re-plan | $1.13 |
| Writing course 1 | 82 s (6 sections) | 67 s (8 sections); the longest section alone is 60 s | $0.92 |
| Checks, repair, review of course 1 | 98 s | 64 s at checker effort high; checks about 17% faster at medium | $0.26 |

- **Settings adopted:** planner Opus at effort medium, checker Haiku at effort medium; writer Sonnet and repair Sonnet stay at high, reviewer Opus at medium.
- **The re-plan was impossible to satisfy:** a course with no overview or concept page was asked for a product-knowledge first section, and failed again. That rule now applies only when the course has such a page. Re-plans for a procedure another course already teaches stay.
- **A local Linear build** (the user's, 2026-11-24, with the first concurrency change) took 12.5 min and $4.60 for 4 courses: reading 6.3 min (307 pages on one host, one connection), page cards 65 s, plan 157 s, writing 54–59 s and finishing 51–79 s for all 4 courses at once. Before, 3 courses took 16 min.
- **Time after reading is now about 3.5 min** (cards about 40 s, plan about 85 s, writing about 65 s, finishing about 55 s), each step waiting on the one before; each is set by the longest single answer the model writes.
- **Reading:** one connection per host; requests at least 200 ms apart (was 350 ms), or the site's crawl delay; a host that answers 429 or 503 is read at 1 s apart, doubled on each later one, for the rest of the build. From Lagos a Linear page takes about 1.1 s (latency, not the gap); near the site, about 0.4–0.6 s a page with its markdown copy. Not measured from a server.
- **Reading without the markdown copy was tested and rejected** (cache replay, 150 pages a source): Arcadia lost all 213 code, 173 table and 350 step blocks, Samsara all 450 code blocks, Limble its 6 code blocks, and Eptura read no page at all. Raken lost nothing. The second request a page stays.

**Model and effort tests (gold, `eval/plan-gold.mjs` coverage of the gold course; `eval/write-gold.mjs`; `eval/check-gold.mjs`):**

| Planner | Gold coverage per run | Average | Plan time | Planner cost |
|---|---|---|---|---|
| Opus, effort high | 84.4, 87.5, 81.3, 90.6% | 85.9% | 92–132 s | $0.90–1.03 |
| Opus, effort medium (adopted) | 90.6, 81.3, 81.3, 84.4% | 84.4% | 77–84 s | $0.79–0.83 |
| Sonnet, effort high | 84.4, 78.1, 84.4% | 82.3% | 76–78 s | $0.40 |

- Medium is 1.5 points lower on average, inside the run-to-run spread (81–91% at both efforts), and never missed a gold section; Sonnet missed one in a run, so it is not used. Coverage on today's corpus is below the 90.6% measured earlier on the older one (target ≥ 90%).
- **Checker at medium effort** (same gold course, against the judge's verdicts on 1,113 claims): claims it passed that the judge did not, 5 (6 at high); both flagged 2 (1 at high); issues found nearly the same. 54 s against 65 s, 11% cheaper. Adopted.
- **Writer at medium effort:** 69 s and $0.96 against about $1.68, the same 31 lessons and screenshots, but 5% less text and twice the gaps (6 against 3), most of them empty "not covered in the documentation" headings. Not adopted.
- **Prompt caching:** the writer already sends one section first and the rest after its first token, so they read the shared prompt from cache. A cache breakpoint before a re-plan's problems would save about as much as it costs in cache writes; not added.

**Budget (default now $12, was $15).** A build spends $4.60 (Linear, 4 courses) to about $7.10 (Raken, 4 courses, 121 lessons: cards $0.21, plan $1.13, about $0.048 a lesson after). Writing and finishing cost $0.04–0.065 a lesson across Linear, Raken, MaintainX and the gold course, so after planning each course is priced at $0.07 a lesson, and the courses the remaining budget could not finish are set aside before anything is spent on them (recorded in the build's course list as `droppedForBudget`); the first course is always kept. A build that still reaches the cap at the final review keeps its checked and repaired course, unreviewed, instead of failing it. No request is ever sent past the cap. Raken's plan prices at $8.47 after $1.34 spent, so all four courses are built.

Paid tests: $9.50 in the first round; $4.02 in this one (three gold plans $2.64, two checker runs $0.25, the Raken plan $1.13).

## 8. Open

**Decisions for the product owner** (plan §16):
1. Anthropic tier before launch (the Start tier's $500 a month is about 60 onboardings at today's build cost).
2. YouTube: channel videos need a YouTube Data API key (YouTube's robots.txt refuses its channel feed to named crawlers, and its terms forbid reading video lists from its pages), and the legal check of embedding in completion-tracked courses (§16 question 4). Until both, no channel videos are matched; matching thresholds are untuned.
3. Held sources (§16 question 7) and sources the organisation never links (§2): decided, no question to the admin; see Next work 2.
4. Private and blocked sources (§16 question 8), and building in the site's language when the organisation's locale is missing (§16 question 9).

**Deploy:** the renderer (§5).

**Not measured** (spend held to $8 for this round): groundedness on a held-out site (about $0.40 to finish the MaintainX course, then about $0.10 a lesson to judge); answer keys and 50-claim human samples on development and held-out sites; the optional gold re-judge.

**Next work, to meet the unmet targets** (the owner allows spending past $8 as far as meeting them needs, without cutting the measurement to the bare minimum):
1. **Groundedness on held-out sites:** finish the held-out course (MaintainX) and judge it whole, then at least one more held-out site, each with the independent judge on every lesson (about $0.10 a lesson).
2. **Discovery recall:** decided 2026-11-24: do not ask the admin for anything beyond the website they gave. Next is the option that adds no model cost and only a few requests: read the product app's sign-in page and the product site's sitemap for support and documentation hosts the homepage menu does not link, measured on development first. Web search stays out (it costs per query and adds a wait). Sources behind a bot challenge stay missed unless their organisation allows our reader.
3. **Reading:** rerun development and held-out with the renderer on, and without the 7-minute eval limit on the sources it stopped.
4. **Answer keys and the 50-claim human samples** on one development and one held-out course.

**Outside the course builder, on this branch:** unverified accounts can trigger AI generation; terms enforcement and the `changeEmail` concern; throwaway accounts and test starter jobs in the local development database.

**Known gaps:** reading stays below 98% on script-shell sources until the renderer is on, and on large sources within the time limit; company pages (support hours, plans, ticket portals) stay in the corpus, since no neutral signal separates them from short answers; MATCHING questions are dropped, because the question type is disabled in the product.

## 9. Ground truth

Two samples, each split 25 development / 15 held out by SHA-256 of the domain before any site was read:

| Sample | Development | Held out |
|---|---|---|
| Customer (`sites-icp.json`, primary: process-heavy vertical B2B) | 25 sites, 57 sources, 23,444 pages, 23 without a count | 15 sites, 32 sources, 10,277 pages, 13 without a count |
| Scale (`sites-scale.json`: large software companies) | 25 sites, 55 sources, 231,003 pages, 9 without a count | 15 sites, 34 sources, 183,795 pages, 3 without a count |

- Each source's inventory comes from what it publishes (sitemaps and indexes, llms.txt, links), filtered to one language; a source behind a login, a challenge or with no published inventory has no count and a recorded reason, never a guess.
- Every customer site was reviewed by hand against the live site (four reviewers, ten sites each, written criteria; decisions with evidence in `eval/truth-curation.json`): marketing pages counted as sources were dropped, help centres the collector missed were added, sign-in URLs are never pages.
- `verify-truth.mjs` removes pages robots.txt forbids to our reader and fetches a fixed sample of the rest: each source's **read target** is what a complete reader should read. Low targets are real (pages that redirect out of their source, login-only lessons, bot challenges).

Rerun, development first; `--write` is refused for held-out domains:

```bash
export PATH="$HOME/.nvm/versions/node/v24.22.1/bin:$PATH"
cd packages/course-builder && pnpm build
node eval/collect-truth.mjs --write --concurrency=8
node eval/audit-truth.mjs
node eval/verify-truth.mjs --write
node eval/score-discovery.mjs dev
node eval/read-sites.mjs dev --workers=5
node eval/score-labels.mjs
```

After deleting `dist`, also delete `tsconfig.tsbuildinfo`, or `tsc` skips unchanged files and the build is incomplete.

## 10. Evaluation data and scripts

Data in `packages/course-builder/eval-data/` is git-ignored: it holds other organisations' content and must stay out of git.

| File | What it does |
|---|---|
| `eval/sites-icp.json`, `eval/sites-scale.json` | The customer and scale samples, 40 sites each, split 25/15 by SHA-256 of the domain before any site was read |
| `eval/collect-truth.mjs`, `audit-truth.mjs`, `verify-truth.mjs`, `truth-curation.json` | Ground truth per site: sources and page lists from sitemaps, llms.txt and links, reviewed decisions, robots.txt filtering and the live-verified read target |
| `eval/score-discovery.mjs` | Discovery recall and precision against the ground truth; `--public-dns` for runs on an unreliable local resolver (`eval/public-dns.mjs`) |
| `eval/read-sites.mjs` | Reading completeness, recall, outcomes and the corpus per source; `--offline` replays the disk cache (`eval/http-cache.mjs`); `--render` uses the jobs renderer |
| `eval/score-labels.mjs` | Tree accuracy and exclusion agreement against the blind labels, from the cache |
| `eval/card-sites.mjs`, `plan-gold.mjs`, `write-gold.mjs`, `check-gold.mjs`, `validate-judge.mjs` | Cards, plan, writing, checking and the judge on the gold organisation's snapshot |
| `eval/snapshot-energis.mjs` | Evaluation-only capture of the gold knowledge base through its host's API; never copy its approach into `src/` |
| `eval/build-site.mjs` | The build stages on one live site, step by step, under a `--budget`; `judge` scores a finished course with the independent judge |
| `apps/api/scripts/import-learning-package.ts` | Evaluation-only import of a learning package through the worker's publisher |

Never change a rule because of a held-out site: add a similar case to the development set or the tests, fix it there, and rerun the held-out set only to confirm.
