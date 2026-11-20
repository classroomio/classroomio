# Starter courses from a website: research

First research round for the [course builder plan](README.md), on reading a website with one or two pages. The [main research file](research.md) supersedes its recommendations where they differ. Checked on 18 November 2026. Facts carry a source link. **[Test]** marks something we measured ourselves on that date, against live sites and the model the starter job uses today (`gemini-3.1-flash-lite`). **[Unconfirmed]** marks claims we could only find in secondary sources.

## 1. What the job does today

- The job reads one page, the homepage, through Jina Reader, and keeps up to 48,000 characters of it.
- It writes four courses in parallel, sending the whole page with each of the four prompts.
- The four course titles are fixed per slot ("Getting Started with {Product}", "Core Workflows, Step by Step", "Collaborating with Your Team", "Getting Help and Next Steps"). Only descriptions and lessons are generated.

**Why 48,000 characters?** Nothing in the code, the plan or the git history records a reason. At about 4 characters per token ([Google](https://ai.google.dev/gemini-api/docs/tokens)), it is roughly 12,000 tokens. Because the page is sent four times, that is about 48,000 input tokens per job. **[Test]** Homepages, as markdown, measured 3,900 to 86,500 characters; the median was about 9,000. The cap only bites on unusually long pages (featurebase.app was 86,530 characters). Long, noisy input also hurts quality:

- Chroma's tests on 18 models found answers get worse as input grows, even on simple tasks ([Chroma](https://www.trychroma.com/research/context-rot)).
- Models use information at the start and end of a prompt best, and miss what is in the middle ([Liu et al.](https://arxiv.org/abs/2307.03172)).

**Bugs found on the way:**

1. **Fixed:** the product name was the workspace name. The business step's brand read had usually not finished when the job started. A test job for linear.app now names "Linear" in every course.
2. **Open:** a bot-challenge page counts as a successful read. moodle.org returns a Cloudflare "Just a moment..." page. Jina answers HTTP 200 for it, so the job sends a CAPTCHA page to the model as "product material".

## 2. Which pages carry the most useful material

### 2.1 Candidate sources

| Source | What it gives | Cost to read | How often it exists |
|---|---|---|---|
| `/llms.txt` | A summary the company wrote for AI, plus a map of its key pages ([llmstxt.org](https://llmstxt.org/)) | Free direct fetch, about 400 to 3,000 tokens | 9.3% of the top 1,000 domains, at the root only ([Rankability](https://www.rankability.com/data/llms-txt-adoption/)). **[Test]** 27 of 36 well-known SaaS sites we checked; this sample is biased toward large, AI-aware companies. Only half of all files follow the full format ([Common Crawl](https://commoncrawl.org/blog/a-content-analysis-of-llms-txt-files-from-the-july-2026-crawl-archive)) |
| Homepage | What the product is for, who it is for and its headline features. Little "how to" | Free if the site serves markdown, otherwise one Jina read | Always |
| Help-center or docs **home page** | The categories and article titles customers actually need, which is close to a syllabus | One read | **[Test]** Found a usable one on 21 of 22 SaaS homepages by link heuristics |
| One help **article** | Real steps, screen names and settings | One read each | Varies |
| `sitemap.xml` | Every URL, no content | Free, often huge | Common |
| YouTube channel | Official tutorial videos | Free RSS feed (15 latest) or YouTube API | **[Test]** 16 of 22 homepages link a channel; 86% of 36 SaaS homepages in a second sample |

### 2.2 Which source gives the best course plan [Test]

We asked the starter model to plan four courses from each source, for five SaaS companies (Tally, lemlist, Plausible, SavvyCal, Teachable).

| Source given to the model | Result |
|---|---|
| Homepage only | Product-specific, but leans on marketing claims ("Leveraging AI for intent-driven sales") |
| llms.txt only | Cheapest (400 to 850 input tokens) and accurate topics, but thin |
| Help-center home only | The most practical topics (lemlist: "Maintaining sender reputation with lemwarm"). **Fails badly** when discovery lands on one article instead of the home: SavvyCal became four courses about custom domains, and Tally's included one built around its fair-use policy |
| **Homepage + help-center home** | The best balance: what the product is for, plus what customers actually do. 1,650 to 4,450 input tokens |

**Every source beat the fixed titles.** Examples of free titles: "Migrating from Google Analytics to Plausible", "Defending your time with buffers and limits" (SavvyCal), "Maintaining sender reputation with lemwarm".

### 2.3 Full pipeline prototype [Test]

We ran one planning call, then four parallel writing calls. The input was homepage plus help-center home, with the company's YouTube feed. Results:

| Site | Material | Time (fetch, plan, write) | Tokens in / out | Cost | Videos attached |
|---|---|---|---|---|---|
| tally.so | 9,500 chars | 2.1 s, 6.4 s, 11.4 s | 13,974 / 13,751 | $0.024 | 14 lessons (Stripe payments, NPS, CSAT, file uploads, Claude connector) |
| calendly.com | 18,500 chars | 11.1 s, 7.0 s, 10.6 s | 22,829 / 13,653 | $0.026 | 9 lessons (sharing links, website embed, Zoom setup, meeting packages) |
| lemlist.com | 13,800 chars | 1.9 s, 7.2 s, 9.7 s | 18,797 / 13,044 | $0.024 | 0. Its channel is a podcast, and the model correctly matched nothing |

Costs use Gemini 3.1 Flash-Lite's $0.25 per 1M input tokens and $1.50 per 1M output tokens ([pricing](https://aistudio.google.com/docs/pricing)).

What we learned:

1. **Titles and structure feel tailored.** Examples:
   - Calendly: "Meeting Callie" lessons, routing forms and meeting packages.
   - Tally: "Answer piping", "Building a calculator form" and "Leveraging the MCP server".
   - lemlist: "Using lemwarm for warm-up" and the "Deliverability Hub".
2. **Lessons invent click paths.** Two examples:
   - A Calendly lesson tells the learner to "access the payments or billing section… select the option to create a new invoice".
   - A Tally lesson says "Open the Custom CSS section in your form settings".

   Neither path is in the material. The homepage and help-center home say *what* exists, not *how* to do it. Steps must come from the real help article, or the lesson must link to it instead.
3. **Quizzes default to true/false.** Across three runs, about 45% of questions were true/false and there was 1 ordering question. The mix has to be required in the prompt and checked.
4. **Flash-Lite ignores `minItems` and `maxItems`.** It returned one section per course until the counts were in the prompt text. Counts must be in the prompt and checked in code.
5. **The model reused videos.** The same Stripe video was attached to two lessons. Code must allow each video only once.
6. **Speed and cost are fine.** 20 to 30 seconds and about $0.025 per new organization, inside the job's 55-second budget.

### 2.4 Finding the help center [Test]

Rules that worked:

- A homepage link whose host starts with `help.`, `support.`, `docs.`, `learn.`, `academy.` or `knowledge.`, at the root path.
- Or a homepage link whose path is exactly `/help`, `/docs`, `/support`, `/guides`, `/academy` or `/hc/<locale>`.
- Or link text such as "Help center", "Docs" or "Support".
- Then a probe of `help.`, `docs.` and `support.` subdomains.

Misses to guard against:

| Site | What discovery picked | Problem |
|---|---|---|
| cal.com | `/docs` | Developer API docs; detect "API" in the title |
| docs.savvycal.com | `/custom-domains` | A deep article; prefer the root path |
| featurebase.app | `/help-center` | Their marketing page for a help-center product |
| support.thinkific.com | the help center | Behind a bot challenge |

llms.txt files often link straight to the help center, as Thinkific's and Notion's do ([research](#5-reading-services-compared)).

## 3. Bot challenges

Jina returns HTTP 200 even when the target site blocked it. The real status sits in `data.httpStatus` when you send `Accept: application/json`. Its CAPTCHA warning only appears when the page is under 200 tokens and the HTML contains `captcha` or `cf-turnstile-response` ([Jina source](https://github.com/jina-ai/reader/blob/main/src/services/snapshot-formatter.ts)).

**[Test]** Jina's handling of challenged sites:

| Site | `httpStatus` | Title | CAPTCHA warning |
|---|---|---|---|
| thinkific.com | 403 | "Just a moment..." | None |
| moodle.org | 200 | "Just a moment..." | Yes |

Treat a read as **blocked** when any of these holds:

- The status is not 2xx.
- Jina adds a warning.
- The text is under about 200 tokens.
- The page matches a known challenge marker:
  - Cloudflare: header `cf-mitigated: challenge` ([Cloudflare](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/detect-response/)), title "Just a moment...", or "Enable JavaScript and cookies to continue".
  - Anubis: "Making sure you're not a bot!" ([Anubis](https://github.com/TecharoHQ/anubis/blob/main/lib/localization/locales/en.json)).
  - Vercel: `x-vercel-mitigated: challenge` or "Vercel Security Checkpoint".
  - DataDome: `captcha-delivery.com`.
  - Akamai: "Access Denied … Reference #".
  - HUMAN: "Press & Hold".

  The Vercel, DataDome, Akamai and HUMAN markers come from community and vendor blogs **[Unconfirmed]**.

**Free workaround [Test]:** Cloudflare's "Markdown for Agents" lets a site serve markdown to a request with `Accept: text/markdown` ([Cloudflare](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents)). Thinkific returned 13 KB of clean markdown this way, while Jina got a 403 challenge on the same site. Linear does the same. Notion and Tally return HTML.

## 4. Videos without making them up

Only attach videos that are proven to exist and belong to the company.

- **Finding the channel:** use the YouTube link on the company's own site: the footer, or JSON-LD `sameAs`. **[Test]** 31 of 36 SaaS homepages had one; 22 listed it in `sameAs`. Watch for parent-company channels (Hotjar links to Contentsquare) and regional channels (Shopify).
- **Listing the channel's videos:** the YouTube Data API is the reliable route.
  - Cost: `channels.list` (1 unit) gives the uploads playlist; `playlistItems.list` costs 1 unit per 50 videos; `videos.list` (1 unit) confirms each video is public and `embeddable`.
  - Quota: 10,000 units a day by default ([quota](https://developers.google.com/youtube/v3/determine_quota_cost)). A 500-video channel costs about 21 units.
  - Search is different: since 1 June 2026, `search.list` has its own cap of 100 calls a day ([revision history](https://developers.google.com/youtube/v3/revision_history)).
  - Price: Google states none. Third parties say the API is free **[Unconfirmed]**.
- **Without an API key:** the channel RSS feed (`/feeds/videos.xml?channel_id=UC…`) returns the latest 15 videos. It is undocumented, and developers reported intermittent 404s in 2026 ([forum](https://discuss.ai.google.dev/t/youtube-rss-feed-endpoint-returns-404-errors/113379)). oEmbed confirms a single video's title with no key.
- **Videos embedded on the help pages we read** (YouTube, Vimeo, Loom, Wistia, Vidyard, Arcade, Supademo) are official by definition.
  - Detect them in the HTML by URL pattern: `youtube.com/embed`, `player.vimeo.com/video`, `loom.com/embed`, `fast.wistia.com`, `play.vidyard.com`, `demo.arcade.software`, `app.supademo.com/embed`.
  - The importer already accepts YouTube, Vimeo and generic links on a lesson.
- **Third-party videos found by search:**
  - Prices: Serper (2,500 free queries, then $0.30 to $1.00 per 1,000) ([Serper](https://serper.dev/)) and SerpApi's YouTube engine (250 free a month) ([SerpApi](https://serpapi.com/pricing)).
  - Brave's API forbids storing results without a custom plan ([Brave](https://brave.com/search/api/)).
  - Third-party videos are only "probably right" at best, so they need human review. Leave them out of starter courses.
- **Embedding rules to check with legal:**
  - YouTube's developer policies forbid charging users to watch an embedded video, gating playback behind any action other than pressing play, and rewarding viewing ([policies](https://developers.google.com/youtube/terms/developer-policies) III.F.3).
  - Whether that covers a plain embedded player, and so course-completion credit, is **[Unconfirmed]**.
  - Data fetched through the API may be kept 30 days before it must be refreshed.

## 5. Reading services compared

| Service | Free tier | Paid, per 1,000 pages | Renders JavaScript | Gets past bot challenges | Discovery | Notes |
|---|---|---|---|---|---|---|
| Direct fetch (ours) + `Accept: text/markdown` | Free | $0 | No | No | Our own link heuristics | Already have SSRF-safe fetching in `safe-fetch.ts` |
| **Jina Reader** (in use) | 20 requests/min with no key; 500/min with a free key ([limits](https://jina.ai/api-dashboard/rate-limit)); 10M free tokens **[Unconfirmed]** | About $0.50 at 10,000 tokens a page **[Unconfirmed]** | Yes | No ([Jina](https://jina.ai/reader/)) | Links summary | Useful headers: `X-Retain-Images: none`, `X-Max-Tokens`, `X-Timeout`, `X-Remove-Selector: nav, footer`. Never remove `header`: it cut Notion's page to 784 bytes **[Test]** |
| **Firecrawl** | 1,000 credits | $0.83 to $5.00 (1 credit a page) | Yes | Retries with stronger proxies on 401/403/429 at no extra credit ([docs](https://docs.firecrawl.dev/features/enhanced-mode)) | `/map` with `search: "help"`, 1 credit | Best paid fallback for blocked sites; JSON-schema extraction is 5 credits |
| Tavily | 1,000 credits a month | $1.00 to $1.60 (1 credit per 5 URLs) | Advanced mode | Reports failures | `/map` with path filters | Reranks content against a query |
| Exa | $10 a month | $1.00 for contents | Live crawl | Not documented | `subpages` with a "docs" target | Can drop navigation and footer sections |
| Cloudflare Browser Rendering | 10 minutes a day | About $0.13 **[estimate]**, at $0.09 per browser hour | Yes | No; it identifies itself as a bot ([docs](https://developers.cloudflare.com/browser-rendering/reference/automatic-request-headers/)) | `/links`, `/crawl` | Cheapest renderer |
| Spider.cloud | — | $0.02 to $0.16 plus $1/GB | Yes | Escalates to a browser with proxies | Crawl | Cheapest paid reader |
| ScrapingBee | 1,000 trial credits | $0.24 to $1.27 | Yes | Premium proxies cost extra | No | |
| Browserbase Fetch | — | $1.00, or $4.00 with extraction | No | Only in browser sessions | No | |
| Apify Website Content Crawler | $5 a month | $0.20 (HTTP) to $5.00 (browser) | Optional | Browser mode | Uses sitemaps | |
| Diffbot | 10,000 credits a month | About $1.00 | Yes | Proxy costs 2 credits | No | Returns structured output |
| Crawl4AI | Open source | Our servers | Yes (Playwright) | Stealth mode | Sitemap + Common Crawl seeding | Self-hosted; more to run |
| Gemini URL context tool | Billed as input tokens | — | Uses Google's index cache, then a live fetch | **[Unconfirmed]** | — | Up to 20 URLs a request; Gemini-only ([docs](https://aistudio.google.com/docs/url-context)) |
| Serper / Brave search | 2,500 queries / $5 credit a month | $0.30 to $1.00 / $5.00 | — | — | `site:example.com help` | For finding a help center when links fail |

**Recommendation:**

- **Default:** our own fetch (free, with `Accept: text/markdown`), then Jina with an API key (free tier, 500 requests/min) and its status checks.
- **Optional paid fallback, only when a site blocks us:** Firecrawl.

At a few hundred signups a month, all of this stays within free tiers. The model call, about $0.025 per organization, is the main cost.

## 6. What top customer academies look like

The full survey of 11 academies (HubSpot, Trailhead, Canva, Webflow, Zapier, Asana, Miro, Semrush, Atlassian, Notion, monday.com) and their flagship courses is in [academy-course-research.md](academy-course-research.md). In short:

- **Titles** are short, outcome-led and name real features: "Get started quickly with Jira", "Set up your team in Webflow", "Welcome to HubSpot: What to Do in Your First Week".
- **The usual first four:**
  1. Orientation (13–30 min)
  2. Core workflow
  3. Admin or team track
  4. Advanced, automation or certification
- **Checks:** a quiz at the end of each course is universal. Many add a check after each module. The best add hands-on work in the learner's own account.
- **What makes them feel tailored:**
  - A named audience
  - "You'll be able to…" outcomes
  - Exact click paths linked to help articles
  - Real customer builds
  - A "what's next" pointer
