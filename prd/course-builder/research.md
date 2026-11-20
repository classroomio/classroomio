# Course builder: research

Evidence for the [course builder plan](README.md). Checked on 18 November 2026.

**Markers:**
- **[Test]**: something we measured ourselves that day.
- **[Unconfirmed]**: a claim found only in secondary sources.

**Earlier rounds:**
- [website-sources-research.md](website-sources-research.md): homepage vs llms.txt vs help center, reading services, video sources.
- [academy-course-research.md](academy-course-research.md): how 11 top academies shape their courses.

## 1. Our customers' sites: what is actually there

### 1.1 Survey of 16 ICP-like companies [Test]

These are energy, operations, compliance, field-service and workplace software companies, the kind of organisation ClassroomIO sells to.

| Company | Public help center | Platform | Found by | llms.txt | YouTube |
|---|---|---|---|---|---|
| energis.cloud | Yes | Confluence (behind a Jira Service Management portal) | Probing `support.`, then following a redirect. **The homepage doesn't link it** | Yes | Yes |
| fieldwire.com | Yes | Zendesk | Homepage link | No | Yes |
| deputy.com | Yes | Zendesk | Homepage link | No | Yes |
| vanta.com | Yes | Zendesk (+ an academy on Sana) | Homepage link | No | Yes |
| workiva.com | Yes | Zendesk | Homepage link | Yes | Yes |
| tulip.co | Yes | Freshdesk | Homepage link | Yes | Yes |
| gridx.ai | Yes | Intercom | Homepage link | No | Yes |
| sitemate.com | Yes | Intercom | Probe (the homepage blocks us with 403) | No | No |
| servicetitan.com | Yes | Document360 | Probe | Yes | Yes |
| eniris.be | Yes | Custom docs site | Homepage link | No | Yes |
| process.st | Yes (`/help`) | Unknown | Homepage link. **Every subdomain answers, so probes give false hits** | No | Yes |
| safetyculture.com | Partly | Links a sister brand's help center (help.mitti.com) | Homepage link. **Wrong brand** | No | Yes |
| planon.com | Interactive content only | — | `support.` redirects to TeamViewer. **False hit** | No | Yes |
| spacewell.com, dexma.com | Not public | — | — | No | Yes |
| enablon.com | Not reachable (403) | — | — | No | No |

**What it means:**

- **Help centers:** about 11 of 16 have a public one. It is the richest source, and often the only place real procedures live.
- **Platforms:** a handful cover most cases (Zendesk, Intercom, Freshdesk, Document360, Confluence), so dedicated adapters pay off.
- **Discovery:** must probe subdomains, follow meta-refresh redirects, and then guard against wildcard DNS, wrong brands and parked redirects.
- **llms.txt:** much rarer here (4 of 16) than on big SaaS sites (27 of 36), so it can't be the main source.
- **YouTube:** 14 of 16 link a channel.

### 1.2 Case study: Energis.Cloud [Test]

Energis is the best test case we have: a process-heavy product, a public knowledge base, and a **human-made course for the same product** on its ClassroomIO academy. That course is our ground truth.

**The human-made course** (*Energis.Cloud Foundations: Administrator*, academy.energis.cloud):

- **Size:** 16 sections and 36 video lessons of 2–11 minutes (about three hours).
- **Checks:** a "Check yourself" quiz after almost every section, plus a final exam.
- **Sections:**
  1. Welcome
  2. Find your way
  3. Read a dashboard
  4. Build your own charts and dashboards
  5. Understand your metrics
  6. Work anomalies and actions
  7. Write anomaly conditions
  8. Schedule reports
  9. Report templates and data exports
  10. Your portfolio: the asset tree
  11. Change the structure
  12. Correct data that is wrong
  13. Connect your data, and check it arrives
  14. Who is in your platform, and what they see
  15. Add metrics with templates
  16. The Energy Engagement Portal
- **Sources:** "Every lesson links to the Support Center page it comes from."

**The public sources:**

| Source | What's there |
|---|---|
| energis.cloud | **Product:** 13 product pages, 5 pre-built apps and 4 solution pages. **Reference:** glossary, FAQ, product updates and case studies. **llms.txt:** 40 KB with 194 links. Sitemap at `/sitemap-index.xml`; `/sitemap.xml` returns 404 |
| support.energis.cloud | A meta-refresh to `energiscloud.atlassian.net/servicedesk/customer/portals` (Jira Service Management, login screen) |
| energiscloud.atlassian.net/wiki | **Confluence REST API open without login.** Spaces "Energis Support Center" (English, 140 pages) and "Centre de Support Energis" (French, 48 pages). Full page tree with ancestors, page HTML, versions |
| Knowledge base images | 404 screenshots, publicly downloadable |
| Knowledge base videos | A YouTube tutorial playlist and some HTML5 videos |
| YouTube | @energiscloud |

**The English knowledge base, by area:**

| Area | Pages | Words |
|---|---|---|
| Energis.Cloud Documentation (Administration, Setup, Standard Analysis, eApps, Other) | 49 | 43,088 |
| How-to Articles | 32 | 17,524 |
| Release Content (release notes) | 27 | 31,408 |
| Tutorials (by role: Administrator, Energy Manager, Operator, Occupant) | 18 | 2,035 |
| FAQ | 13 | 3,854 |

**Findings:**

1. **The knowledge base covers every section of the human course.**
   - Dashboards: Dashboards, Custom dashboards, Dashboard templates, Views.
   - Metrics: Metrics, Metrics setup, Metric Templates.
   - Anomalies and actions: Anomalies, Actions, Anomaly templates, Action templates.
   - Reports: Reports, Report schedules, Report layouts, Data Exports.
   - Asset tree: Assets, Asset tags.
   - Changing the structure: "Create a new site" tutorials and file import.
   - Correcting data: "How to fix issues in my data" and "How to get rid of peaks".
   - Connecting data: Data sources and the FTP/HTTP/MQTT how-tos.
   - Users: Users and the roles FAQ.
   - Energy Engagement Portal: its pages.

   **A complete read of the knowledge base is enough to reach human-course scope.** The homepage alone covers maybe a fifth of it.
2. **One page is not one course item.** Many pages are whole topics ("Metric Templates" is 6,121 words, "Dashboard templates" 5,713), and areas have children. Courses must be built from areas and their child pages, not from single articles.
3. **There are no fixed counts.** The human course has 16 sections with 1–4 lessons each.
4. **Some pages are wrong to teach from.**
   - Three are marked obsolete or deprecated in the title ("Data sources [Deprecated]", "(OBSOLETE) How to format data…", "…via HTTP (OBSOLETE)"), sometimes next to a "- NEW" replacement.
   - Five are empty ("Test", "Untitled live doc").
   - Release notes are 31% of all words.
5. **Names drift between sources.** The website's "pre-built apps" (Energy Overview, Solar Performance, Waste Finder…) appear to be the knowledge base's "eApps" (ePV, eGuardian…) under new names. Procedures must use the names the product screens show.
6. **The usable corpus fits a model easily:** 111 pages, about 64,000 words (about 87,000 tokens), plus about 20 product and app pages.
7. **Roles matter.** The tutorials are grouped by role, and so is the human course ("Administrator").

## 2. Help-center platforms: reading them completely

### 2.1 Live tests [Test]

Tested at about 1 request per second, one connection, with an honest user agent.

| Platform | Site tested | What worked | Counts | Blocking |
|---|---|---|---|---|
| Zendesk | support.thinkific.com | Public Help Center API (`/api/v2/help_center/en-us/{categories,sections,articles}.json`) and `/hc/sitemap.xml` | 11 categories, 95 sections, 1,112 articles. The sitemap has 1,118; the 6 extra return 401 (restricted) | **Every `/hc/*` HTML page returned a Cloudflare challenge (403).** The API and sitemap returned 200 |
| Intercom | support.teachable.com | Page data (`__NEXT_DATA__`) on the home and collection pages, `/llms.txt`, `/en/articles/*.md`, sitemap | 9 collections, 195 articles. Tree, declared counts, sitemap and llms.txt all agree | None (`Crawl-delay: 1`) |
| Help Scout Docs | docs.helpscout.com | Home and category pages, sitemap | 282 articles from category pages vs **309 in the sitemap** | None |
| Freshdesk | support.freshdesk.com | Portal pages under `/support/solutions…`, `/support/sitemap.xml` | 1,251 articles linked vs 1,305 in the sitemap (needs subfolder recursion) | API needs a key (401) |
| GitBook | gitbook.com/docs | `/llms.txt`, `/llms-full.txt`, `.md` pages, sitemap index | 765 llms.txt links; Documentation space 190 = its sitemap | None |
| Mintlify | mintlify.com/docs | `/llms.txt` → `/_llms/*.txt` split indexes, `/llms-full.txt`, `.md` | 286 pages × 4 locales; full navigation tree as heading levels | None |
| Docusaurus | docusaurus.io | Sitemap, "Next" link chain, BreadcrumbList JSON-LD | 93 current-version docs pages, matching across methods | None |
| Confluence | warsaw-dynamics.atlassian.net, energiscloud.atlassian.net | Anonymous REST API (v1 and v2): spaces, pages with parent and position, page bodies | Energis: 140 + 48 pages | None |

### 2.2 How each platform is organised and read

| Platform | Detect by | Tree | Best public route | Watch out for |
|---|---|---|---|---|
| Zendesk Guide | CNAME `*.zendesk.com`, `/hc/{locale}/` URLs | Category → section (nested) → article, each with a `position` (the manual order) | Public API with the locale in the path; cursor pagination; HTML `body`; `updated_at` ([API](https://developer.zendesk.com/api-reference/help_center/help-center-api/articles/)) | HTML pages may be challenged. Budget about 100 API calls a minute. Each brand has its own subdomain. Skip drafts and restricted articles |
| Intercom | `x-intercom-version` header, `intercom.help` / `intercomassets.com` assets | Collection → subcollection → article, in display order | `__NEXT_DATA__` page data, then `.md` articles. The REST API needs a token | **Image URLs are signed and expire, so download them while reading.** llms.txt and `.md` are undocumented, but present on several sites |
| Help Scout Docs | CNAME `*.helpscoutdocs.com`; `/collection/`, `/category/`, `/article/` URLs | Collection → category → article | Home and category pages (manual order) **plus the sitemap**: 27 articles were only in the sitemap | API needs a key |
| Freshdesk | CNAME `*.freshdesk.com`, `/support/solutions` | Category → folder → subfolder → article | Portal pages, following subfolders and pagination, plus `/support/sitemap.xml` | API needs a key |
| HubSpot KB | `generator` meta "HubSpot", `x-hs-*` headers | Category → subcategory → article | Sitemap and category pages | Large multi-locale sitemaps |
| Document360 | llms.txt; per-language sitemaps in robots.txt | Category → article | llms.txt `.md` links | `/sitemap.xml` is 404 |
| GitBook | `generator` "GitBook", `x-gitbook-route-site` | Sections → spaces → page groups | `.md` pages, llms.txt, llms-full.txt ([docs](https://gitbook.com/docs/getting-started/llm-ready-docs)) | Deep nesting only in URL paths or the sidebar |
| Mintlify | `x-mintlify-client-version`, `Link: rel="llms-txt"` | Tab → group → subgroup | `/_llms/` split indexes keep the full tree, plus `.md` | — |
| ReadMe | llms.txt on by default | — | `.md` pages ([docs](https://docs.readme.com/main/docs/llmstxt)) | — |
| Docusaurus | `generator` meta | Sidebar categories | Follow "Next" links per sidebar; BreadcrumbList on each page | The sitemap holds every docs version; keep the current one only |
| MkDocs / Material | `generator` mkdocs | Nav | `/search/search_index.json` | — |
| Sphinx / ReadTheDocs | RTD meta tags, `searchindex.js` | Table of contents | Sidebar and `rel=next` | — |
| VitePress / Starlight / Nextra | `generator` meta | Sidebar | Sidebar HTML, `/hashmap.json` (VitePress), sitemap | Nextra's order isn't published |
| Confluence (incl. Jira Service Management help centers) | `atlassian.net`, `/wiki/` | Space → page tree with positions | Anonymous REST API when the space allows it ([Atlassian](https://support.atlassian.com/confluence/kb/how-to-give-non-confluence-users-access-to-a-space/)) | Storage format contains `ac:` macros; the service-desk API itself needs login |
| Zoho Desk | `server: ZGS` | Category → section → sub-section | No confirmed complete public route **[Unconfirmed]** | JS app |
| Crisp | `crisp.help` | Category → article | Sitemap index | — |
| Featurebase | Next.js, llms.txt | — | llms.txt and `.md` | — |
| Salesforce Experience Cloud, ServiceNow | Platform URLs | — | Sitemap where enabled; API access is configured per instance | Pages rendered by JavaScript; may need a browser **[Unconfirmed]** |
| Notion public sites | `notion.site` | Page tree | Only an unofficial internal API | Unstable |

### 2.3 Rules that apply everywhere

- **Order of preference:**
  1. A public API.
  2. Structured data embedded in the page.
  3. A hierarchical llms.txt.
  4. Sitemap plus breadcrumbs.
  5. A bounded crawl of navigation links.
  6. A headless browser only for JavaScript-only platforms.
- **Content per article, in order:** the API body, then `.md`, then embedded blocks, then the main content area of the page.
- **Completeness check on every run:**
  - Compare the tree's articles with the sitemap and with declared counts: Zendesk `count`, Intercom `articleCount`, llms.txt links, Mintlify page counts.
  - **Sitemap-only articles:** probe them. A 401 or 403 marks them restricted and they are excluded; a 200 means they are attached through their breadcrumbs.
  - **Pass** at 98% or more of public sitemap articles; otherwise mark the site "partial" and report the gap.
  - Results by platform:
    - Intercom and Docusaurus reached 100%.
    - Zendesk reached 100% of public articles.
    - Help Scout (91%) and Freshdesk (96%) need the sitemap union.
- **Politeness:**
  - Obey robots.txt (RFC 9309):
    - Cache it for up to 24 hours.
    - A 4xx means we may crawl.
    - A 5xx means we must not.
  - Honour `Crawl-delay` too.
  - One connection per host, at least 1 second apart.
  - An identifiable user agent with a contact URL.
  - Back off on 429 and 503.
  - **Never work around a bot challenge;** use the API, sitemap or llms.txt instead.
- **Content signals:** GitBook, Mintlify and others publish `Content-Signal` lines in robots.txt. Building a course is `ai-input`. Record the signal, and skip or flag sites that set `ai-input=no` ([Cloudflare](https://blog.cloudflare.com/content-signals-policy/)).
- **Prompt injection is real here.** GitBook's and Mintlify's `.md` and llms.txt files include "Agent instructions" blocks. Strip leading instruction preambles, and always treat fetched text as data.
- **Noise to drop:**
  - Blog, changelog, release notes, legal, careers, press, pricing, status, tag and author pages.
  - Dated paths.
  - Older docs versions.
  - API reference, which is optional and not a core course for end users.
- **A course maps naturally to one top-level area:**
  - Zendesk category
  - Intercom or Help Scout collection
  - Freshdesk category
  - GitBook section or space
  - Mintlify tab or top group
  - Docusaurus sidebar category
  - Confluence top page

  Large areas are split, and small related areas are merged by the lead.

## 3. Orchestrating Claude: one planner, parallel writers, an independent checker

### 3.1 Anthropic's guidance

**Workflows vs agents** ([Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)):
- A workflow is model calls connected by code paths you control. An agent picks its own steps.
- For a pipeline we control, the fitting patterns are prompt chaining with gates, parallel sections, orchestrator-workers and evaluator-optimizer.
- Start simple; add steps only when they measurably help.

**Multi-agent research system** ([post](https://www.anthropic.com/engineering/built-multi-agent-research-system)):
- An Opus lead with Sonnet subagents beat single-agent Opus by 90.2% on Anthropic's research eval.
- It used about 15× the tokens of chat.
- Running 3–5 subagents in parallel cut research time by up to 90%.
- Early failures:
  - Too many subagents.
  - Duplicate work from vague briefs.
  - The lead waiting for a whole batch.
- **A good brief has four parts:** the objective, the output format, the sources to use and clear boundaries.

**When multiple agents pay off** ([post](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)):
- The gain is "thoroughness, not speed", at 3–10× the tokens.
- **Split by context, not by type of work.** The agent writing a module should also write its quiz.
- A separate verifier is a good split, but watch for "early victory", where it passes work after a shallow check.

**Evaluators** ([harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps)):
- Models judging their own work tend to praise it.
- A separate, skeptical evaluator with explicit, weighted criteria works far better.

**Evals** ([post](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)):
- Give each quality dimension its own isolated judge, with an "Unknown" option.
- Calibrate the judges against humans.

**Mixing models** ([cost guide](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence)):
- An Opus 5.5 orchestrator with Sonnet 5.5 workers at medium cost about a third less than Opus alone, for about the same score.
- Haiku workers cut cost 32% but lost about 4 points.
- Re-running only the failures at a higher level was about 40% cheaper.

### 3.2 Models, prices and speed

Prices are per 1M tokens ([pricing](https://platform.claude.com/docs/en/about-claude/pricing)). Speed and latency are from Artificial Analysis, late 2026 ([comparison](https://artificialanalysis.ai/models/comparisons/claude-opus-5-5-medium-vs-claude-sonnet-5-5-high)); the input length is not stated, and figures drift ±10–20%.

| Model | Input | Cache read | Output | Output speed | First token (medium / high) |
|---|---|---|---|---|---|
| Claude Opus 5.5 (`claude-opus-5-5`) | $4 | $0.20 | $20 | ~106 tok/s | 11.6 s / 20.4 s |
| Claude Sonnet 5.5 (`claude-sonnet-5-5`) | $2 | $0.10 | $10 | ~137 tok/s | 5.0 s / 9.3 s |
| Claude Haiku 5.5 (`claude-haiku-5-5`) | $0.10 | $0.01 | $0.50 | ~225 tok/s | 10.0 s / 20.2 s |

- **Haiku price cliff:** Haiku 5.5 costs **5× more (on every token) when a prompt is over 100k tokens**. Keep Haiku prompts small.
- **Thinking:** it can't be turned off on Opus 5.5; effort is the control, and its default is `medium`.
- **Batches:** half price but asynchronous (most finish within an hour). Fine for nightly re-syncs, not for onboarding.
- **Rate limits** ([limits](https://platform.claude.com/docs/en/api/rate-limits)):
  - The Start tier gives each 5.5 model 4,000 requests, 2M input tokens and 400k output tokens per minute.
  - **Monthly spend caps: Start $500, Build $1,000, Scale $200,000.**
  - Sudden bursts can return 429 even under the limits ("ramp limits"), so stagger fan-outs.
  - Cache reads don't count toward input-token limits.
- **Speed sums:**
  - One Opus call writing four courses (about 60k visible tokens plus thinking) would take about 18 minutes and hit the 128k output cap.
  - Sixteen section writers in parallel finish the writing in about 1.5 minutes.

### 3.3 Claude features for accuracy

- **Citations** ([docs](https://platform.claude.com/docs/en/build-with-claude/citations)):
  - Available on all models.
  - Each citation is guaranteed to point to a real location in the documents.
  - Cited text costs no output tokens.
  - Anthropic found built-in citations cite the most relevant quote more often than prompt-based citing.
  - **They can't be combined with structured outputs** (a 400 error).
- **Search-result blocks** ([docs](https://platform.claude.com/docs/en/build-with-claude/search-results)): each source is a block with our own `source` URL and `title`, so citations point straight back to the help article. One block per article, one inner block per paragraph or step.
- **Prompt caching** ([docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)):
  - A cache entry is readable only after the first response starts streaming, so parallel requests sent together all pay full price.
  - Send one, wait for its first token, then send the rest.
  - Changing thinking or effort settings can invalidate the cache.
  - The minimum cacheable prefix on the 5.5 models is 512 tokens.
- **Structured outputs** guarantee schema-valid JSON. Use them for plans, quizzes and verdicts.

## 4. Checking grounding and quiz answers

**Methods:**
- **FActScore** ([paper](https://arxiv.org/abs/2305.14251)) and **RAGAS faithfulness** ([docs](https://docs.ragas.io/en/latest/concepts/metrics/faithfulness.html)) split text into atomic claims and check each against the source. FActScore's automatic estimate was within about 2% of human judgment.
- **MiniCheck** ([paper](https://arxiv.org/abs/2404.10774)): a small checker matched GPT-4 on grounding checks. Checking a claim against a given source is an easy task, so **Haiku 5.5 at high effort is a fair checker** when it sees only the relevant pages.
- **SelfCheckGPT** ([paper](https://arxiv.org/abs/2303.08896)): consistency across samples. Useful for answer keys: solve each question blind several times and compare.
- **Anthropic's anti-hallucination steps** ([docs](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations)):
  - Allow "I don't know".
  - Quote first, then write.
  - Withdraw any claim without a quote.
  - Restrict the model to the documents given.

**Error rates seen in practice:**
- A study of ChatGPT-written exam questions found more factual errors than in human ones, and a drift toward low-level recall ([study](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11806894/)).
- One small study reported 15% of AI questions with two right answers and 15% with a wrong key **[Unconfirmed]**.
- **No benchmark exists for source-grounded course content. We must measure our own rate.**

**Recipe for checking quizzes:**
1. The answer key cites its source, and a checker confirms the source supports it.
2. A blind solve, three times, from the source alone. Any disagreement is flagged.
3. Each wrong option is checked for being actually wrong. "Unknown" counts as a flag.
4. Wrong options must be plausible. Troubleshooting pages are a good source of real mistakes.
5. Ordering questions are compared in code with the numbered steps in the source.

## 5. Instructional design evidence

- **Objectives:**
  - Revised Bloom's taxonomy runs remember → understand → apply → analyse → evaluate → create ([Krathwohl](https://doi.org/10.1207/s15430421tip4104_2)).
  - AI-written questions drift toward "remember", so require scenario questions at "apply" and "analyse".
- **Lesson length:**
  - No controlled optimum exists ([review](https://pubmed.ncbi.nlm.nih.gov/39882484/)).
  - edX engagement data favours videos under 6 minutes ([Guo et al.](https://up.csail.mit.edu/other-pubs/las2014-pguo-engagement.pdf)).
  - Topic matters more than a word count. The Energis course runs 2–11 minutes a lesson.
- **Checks:**
  - Practice tests beat re-studying across 272 effect sizes ([review](https://education.wsu.edu/documents/2018/01/rethinking-use-tests.pdf/)).
  - Practice testing is rated a high-utility technique ([APS](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html)).
  - Quizzes between segments reduce mind-wandering ([study](https://pmc.ncbi.nlm.nih.gov/articles/PMC3631699)).
  - So: a check after each section, plus a final quiz.
- **Practice in the real product:**
  - Merrill's principles are task-centred, activation, demonstration, application and integration into the learner's own work ([summary](https://www.learningguild.com/articles/research-for-practitioners-are-there-basic-principles-across-all-instructional-design-models)).
  - Hence "do it in your own account" tasks.
- **Multiple-choice items:**
  - One clearly correct answer, plausible distractors, no "all of the above" ([Haladyna rules](https://cpl.health.unm.edu/AssetListing/Writing-Questions-for-Learning-and-Assessment-2573/Rules-for-Multiple-Choice-Items-Haladyna-et-al-2002-5943)).
  - Three options (two good distractors) are usually enough ([Rodriguez summary](https://u.osu.edu/cvmofficeofteachingandlearning/2018/02/02/how-many-options-should-a-multiple-choice-question-have-maybe-just-3/)).
- **Worked examples:** they help beginners and stop helping experts ([expertise reversal](https://link.springer.com/doi/10.1007/s11251-009-9107-8)), so fade them in advanced courses.

## 6. What comparable products do

- **Inputs:**
  - Almost no product turns a whole help center or docs section into courses.
  - Most take uploaded documents.
  - A few read a single URL: Synthesia and Colossyan ([Synthesia](https://www.synthesia.io/tools/url-to-video), [Colossyan](https://colossyan.com/features/url-to-video/)).
  - Disco crawls at most 5 links ([docs](https://docs.disco.co/ai-program-generator)).
  - Docebo now drafts from Confluence, Drive and SharePoint ([Inspire 2026](https://www.docebo.com/learning-network/blog/inspire-2026-announcements/)).
- **Accuracy:**
  - Colossyan is the only one found that cites a source per generated piece and records the page version.
  - Others rely on "review the draft".
- **Keeping courses current:** nobody detects source changes on a generated course yet. Colossyan lists it as "coming soon".
  - Intercom Fin re-crawls websites weekly ([Intercom](https://www.intercom.com/help/en/articles/9357945-sync-and-manage-websites)).
  - Swimm, for code docs, auto-fixes small changes and flags big ones for review ([Swimm](https://docs.swimm.io/features/keep-docs-updated-with-auto-sync)). That is the model to copy.
- **What buyers say:**
  - In a 2025 survey of 274 customer-education professionals, 45% named content quality and accuracy their top concern ([LearnWorlds survey](https://aijourn.com/?p=497619)).
  - "Creation time goes down with AI, but review time goes up" (Atlassian, same source).
  - In a survey of 421 L&D professionals, 52% named accuracy a blocker ([Synthesia report](https://www.synthesia.io/reports/ai-in-learning-and-development-report-2026)).
  - The main complaint is generic content and recall-only quizzes ([Mindsmith](https://www.mindsmith.ai/blog/the-end-of-elearning-slop)).
- **Where we can be clearly better:**
  1. Complete scope from the help center's own structure.
  2. A citation on every block, so a reviewer checks in one click.
  3. A report of gaps and contradictions between pages.
  4. Process and scenario questions instead of recall.
  5. Real screenshots and official videos.
  6. Change detection that regenerates only what changed.

## 7. Crawling responsibly

- **robots.txt** is a convention, not access control ([RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html)).
  - Firecrawl and Diffbot obey it by default.
  - Intercom's website sync has it off by default.
  - Respect it, and use a named user agent with per-host rate limits.
- **Bot blocking:** since July 2025, Cloudflare blocks AI crawlers by default on new domains ([Cloudflare](https://cloudflare.com/press-releases/2025/cloudflare-just-changed-how-ai-crawlers-scrape-the-internet-at-large)). Expect some blocks, and publish allowlist instructions for our crawler.
- **Proving ownership:**
  - Algolia only crawls domains you verify you own ([Algolia](https://www.algolia.com/doc/tools/crawler/getting-started/verify-domain/)).
  - We found no course vendor that checks ownership.
  - Onboarding is low-risk, because the person enters their own company's site.
  - A public service should verify the domain or record an ownership statement.
- **Third-party material:** help centers can hold user comments and partner material. Leave out comments, and flag embedded third-party media.

## 8. API patterns for a standalone service

- **Firecrawl crawl jobs** ([docs](https://docs.firecrawl.dev/features/crawl)):
  - Create, poll status, cancel.
  - Include and exclude path patterns.
  - Page and depth limits.
  - Sitemap mode.
  - Signed webhooks per page and on completion.
  - Blocked-by-robots list.
  - **A 402 error up front when credits can't cover the limit.**
- **Apify:** a per-run cost cap and graceful abort ([docs](https://docs.apify.com/platform/actors/running/runs-and-builds)).
- **Stripe:** `Idempotency-Key` header ([docs](https://docs.stripe.com/error-low-level)).
- **Synthesia:** signed webhook events with retries ([docs](https://docs.synthesia.io/reference/webhooks)).
- **Formats:**
  - cmi5 imports only the course structure ([xAPI.com](https://xapi.com/cmi5/technical/)).
  - Most vendors export SCORM 1.2/2004.
