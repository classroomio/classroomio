---
name: directory-submissions
description: Launch and submit a startup, SaaS, AI tool, or MCP server across 50+ high-DR software review sites, startup launchpads, MCP registries, and GitHub Awesome lists using a single Product Manifest and autonomous browser/PR submission workflow. Use when launching a new product from DR 0, building foundational dofollow backlinks, publishing one repo to 15+ MCP & agent registries, or running directory submissions.
---

# Autonomous Startup, AI & MCP Directory Submissions

Every software review site, startup launchpad, AI tool directory, MCP registry, and GitHub Awesome list asks for the same ~25 product fields in slightly different character lengths and aspect ratios.

Instead of rewriting copy 100 times by hand, prepare **one `submission-manifest.json`**, propagate your repo across **15+ MCP & agent registries in one step**, and work through the **5-wave directory sequence** below while logging every submission idempotently in `submissions-log.json`.

---

## Step 1: Prepare `submission-manifest.json` Once

Before opening any form or Pull Request, build `submission-manifest.json` in your project root (inspecting the codebase, `package.json`, landing page metadata, and public `/images` assets first, and asking the user only for missing facts):

```json
{
  "product": {
    "name": "YourProduct",
    "slug": "yourproduct",
    "domain": "yourproduct.com",
    "url": "https://yourproduct.com",
    "pricing_url": "https://yourproduct.com/pricing",
    "contact_email": "press@yourproduct.com",
    "contact_page": "https://yourproduct.com/contact",
    "privacy_url": "https://yourproduct.com/privacy",
    "terms_url": "https://yourproduct.com/terms"
  },
  "copy": {
    "tagline_40c": "Punchy plain-English value prop (<=40c)",
    "tagline_60c": "Search-intent headline naming what the tool does (<=60c)",
    "mcp_description_100c": "Strict <=100 character summary required by Official MCP Registry validator.",
    "awesome_list_bullet": "- [YourProduct](https://yourproduct.com) - Factual one-line description with zero hype.",
    "description_160c": "15-25 word summary stating who it is for, what input it takes, and what output it produces (<=160c).",
    "description_500c": "Two-paragraph factual overview (minimum 510 chars) covering the core workflow, supported integrations/formats, and concrete differentiators, with zero em dashes or AI buzzwords.",
    "key_features": [
      "Concrete input -> output capability",
      "Verification, speed, or accuracy guarantee",
      "API, CLI, SKILL.md, or MCP integration support",
      "Export formats or team controls"
    ]
  },
  "taxonomy": {
    "primary_category": "Developer Tools / AI Tools / SaaS",
    "tags": ["ai", "saas", "developer-tools", "automation", "seo"],
    "competitors_replaced": ["CompetitorA", "CompetitorB", "CompetitorC"],
    "pricing_model": "Freemium",
    "starting_price_usd": 19,
    "free_tier_details": "Exact free tier or trial allowance"
  },
  "assets": {
    "favicon_64": "https://yourproduct.com/favicon.ico",
    "logo_square_512": "https://yourproduct.com/logo-512x512.png",
    "og_image_1200x630": "https://yourproduct.com/og.png",
    "screenshots_16x9": [
      "https://yourproduct.com/screenshots/01-hero-1280x800.png",
      "https://yourproduct.com/screenshots/02-workflow-1280x800.png",
      "https://yourproduct.com/screenshots/03-output-1280x800.png"
    ]
  },
  "agent_and_mcp": {
    "mcp_endpoint": "https://yourproduct.com/mcp",
    "github_repo": "https://github.com/yourorg/yourproduct"
  }
}
```

---

## Step 2: One Repo → 15+ MCP & Agent Registries (If You Ship an MCP Server or `SKILL.md`)

Adding six tiny files to your public GitHub repository lets agent marketplaces index your product automatically:

1. **`server.json`:** Keep `description` **strictly ≤ 100 characters** or the Official MCP Registry validator rejects it.
2. **`glama.json`:** `{ "$schema": "https://glama.ai/mcp/schemas/server.json", "maintainers": ["your-github-handle"] }` (required to claim on Glama and pass `awesome-mcp-servers` CI).
3. **`.cursor-plugin/plugin.json` + `.mcp.json`:** Indexed by **Cursor Marketplace** (`cursor.com/marketplace`) and **`cursor.directory`**.
4. **`.claude-plugin/plugin.json` + `.mcp.json`:** Indexed by **Claude Code** plugin directories.
5. **`gemini-extension.json` + repo topic `gemini-cli-extension`:** Auto-indexed within 24 hours by Google's **Gemini CLI Extensions** gallery.
6. **`SKILL.md`:** Auto-indexed by **`skills.sh`**, **ClawHub (`clawhub.ai`)**, and **MCP Market (`mcpmarket.com`)**.

Then publish once to the Official MCP Registry so downstream directories (`glama.ai`, `pulsemcp.com`, `mcp.directory`, `apitracker.io`, `claudemcp.org`) sync automatically:

```bash
brew install mcp-publisher
mcp-publisher login github
mcp-publisher publish
```

---

## Step 3: Work Through the 5-Wave Directory Sequence (50 High-Signal Picks)

### Wave 1: Software Review & Entity Verification Sites (Do First)
Google's Knowledge Graph, ChatGPT, and Perplexity cross-check these domains when users search *"best X"* or *"X alternatives"*:

| Directory | DR | Submit URL | Notes |
| --- | --- | --- | --- |
| **AlternativeTo** | 81 | `https://alternativeto.net/manage-item/` | Free `dofollow` link · 1–5d moderator review · Top LLM citation source for *"X alternatives"* |
| **SaaSHub** | 80 | `https://www.saashub.com/submit` | Free `dofollow` link (2–4w) or paid fast-track |
| **GoodFirms** | 86 | `https://www.goodfirms.co/get-listed` | Free vendor profile · 3–7 business days |
| **G2** | 91 | `https://sell.g2.com/create-a-profile` | Free vendor profile · #1 B2B citation source in ChatGPT & Perplexity |
| **Capterra / GetApp / Software Advice** | 90 | `https://www.gartner.com/en/digital-markets/Role-Selection` | One Gartner Digital Markets application lists on all 3 sites |
| **ProvenExpert** | 81 | `https://www.provenexpert.com/en-us/registration/` | Free profile · Live right after registration |
| **StackShare** | 78 | `https://stackshare.io/submit` | Free developer tool profile · 1–5d review |
| **SoftwareWorld** | 74 | `https://www.softwareworld.co/register/` | Free vendor listing · 3–7 business days |
| **Alternative.me** | 73 | `https://alternative.me/how-to/submit-software/` | Free software listing · 3–7d review |
| **LibHunt** | 72 | `https://www.libhunt.com/repo/submit` | Free developer & open-source tool tracking |
| **Tekpon** | 68 | `https://tekpon.com/get-listed/` | Free SaaS vendor profile · 3–7 business days |

### Wave 2: MCP & AI Agent Registries
- **GitHub MCP Registry** (`https://github.com/mcp` · DR 98, pulls from Official MCP Registry)
- **OpenAI ChatGPT App Directory** (`https://platform.openai.com/plugins` · DR 93, verify `/.well-known/openai-apps-challenge`)
- **Cursor Marketplace** (`https://cursor.com/marketplace/publish` · DR 84) & **`cursor.directory`** (`https://cursor.directory/` · DR 69)
- **ClawHub Skills Registry** (`https://clawhub.ai/` · DR 83)
- **Official MCP Registry** (`https://modelcontextprotocol.io/registry/quickstart` · DR 82)
- **Smithery** (`https://smithery.ai/` · DR 79), **Glama** (`https://glama.ai/mcp/servers` · DR 77), **LobeHub MCP** (`https://lobehub.com/mcp` · DR 76)
- **`mcpservers.org`** (`https://mcpservers.org/submit` · DR 71) & **MCP Market** (`https://mcpmarket.com/submit` · DR 62)

### Wave 3: Startup & Developer Launchpads
- **Hacker News (`Show HN`)** (`https://news.ycombinator.com/submit` · DR 91) & **Product Hunt** (`https://www.producthunt.com/posts/new` · DR 91)
- **Fazier** (`https://fazier.com/submit` · DR 84), **Twelve Tools** (`https://twelve.tools/submit` · DR 83), **Findly.tools** (`https://findly.tools` · DR 82)
- **Peerlist Launchpad** (`https://peerlist.io/user/projects/add-project` · DR 78), **BetaList** (`https://betalist.com/submit` · DR 77), **PeerPush** (`https://peerpush.com/submit` · DR 77)
- **Uneed** (`https://www.uneed.best/submit-a-tool` · DR 76), **LaunchIgniter** (`https://launchigniter.com/submit` · DR 75), **DevHunt** (`https://devhunt.org/account/tools/new` · DR 68)

### Wave 4: AI Tool Directories
- **ShowMeBest.AI** (`https://showmebest.ai/submit` · DR 77), **Good AI Tools** (`https://goodaitools.com/submit` · DR 75), **AI Agents Directory** (`https://aiagentsdirectory.com/submit-agent` · DR 75)
- **Supertools / The Rundown** (`https://www.therundown.ai/tools` · DR 72), **Insidr.ai** (`https://www.insidr.ai/submit-tools/` · DR 71), **`aidirectori.es`** (`https://www.aidirectori.es/submit-ai-tool` · DR 71)
- **AItrendytools** (`https://www.aitrendytools.com/submit` · DR 69), **Foundr.ai** (`https://foundr.ai/submit` · DR 64), **DokeyAI** (`https://dokeyai.com/submit` · DR 62), **Easy With AI** (`https://easywithai.com/submit-tool/` · DR 60)

### Wave 5: Curated Web Design Galleries (Once Your Landing Page Is Polished)
- **One Page Love** (`https://onepagelove.com/submit` · DR 79), **Land-book** (`https://land-book.com/submission-guidelines` · DR 66), **Recent Design** (`https://recent.design/signup` · DR 64)
- **Lapa Ninja** (`mailto:hi@lapa.ninja` · DR 61), **Minimal Gallery** (`https://minimal.gallery/submit/` · DR 61), **Hover States** (`https://www.hoverstat.es/about/` · DR 56)
- **Curated Design** (`https://www.curated.design/submit` · DR 52), **Footer Design** (`https://www.footer.design/submit` · DR 52), **TOOOLS.design** (`https://www.toools.design/submission` · DR 48)


---

## Step 4: Hard Operational Rules for Autonomous Agent Submissions

When running browser or GitHub PR submissions as an AI coding agent, enforce all 10 rules:

1. **Zero Unapproved Spend:** Submit only to free tiers unless the user explicitly approves a paid fast-track checkout. If a submission lands on a Stripe/PayPal paywall with no free path, record `status: "skipped_paid_only"` and continue.
2. **Privacy & Anti-Scraper Contact Hygiene:** Directories get scraped across 500+ aggregator sites. Never submit personal phone numbers, home/registered-agent street addresses, or internal holding LLC names. Always use the **product brand name**, `"Media Relations"`, a generic role email (`press@<domain>`), empty phone/address fields, and `https://<domain>/contact`.
3. **Human-Written Factual Copy:** Never use em-dashes, emojis, or hype buzzwords (*"unleash"*, *"revolutionize"*, *"seamless"*, *"game-changing"*). Editors and Awesome-list maintainers auto-reject AI-sounding marketing fluff.
4. **Check Agent-First Endpoints Before Browser Forms:** Check whether the directory exposes a direct JSON/MCP/agent endpoint first (for example `/api/tools/submit`, `/agent`, `/api/mcp`, or `/llms.txt`) before driving a browser UI.
5. **Strict Anti-Honeypot Filter:** Never fill any input that is hidden (`!isVisible()`, `aria-hidden="true"`, `tabindex="-1"`, `type="hidden"`, `style*="scale(0)"`, `display:none`) or carries spam-trap names/labels (`opl_hp_field`, `_honeypot`, `bot-field`, `website_url` alongside a visible `url` field, or *"Leave this empty"*).
6. **Unwrap Cross-Origin Embedded Forms:** If a `/submit` page renders an embedded widget (`[data-paperform-id]`, `tally.so`, `typeform.com`, `airtable.com`, `embed.fillout.com`), open the standalone form URL directly in a top-level tab so inputs and file uploads work cleanly.
7. **Asset Readiness:** Keep `512×512` PNG + `48×48` WebP logos, a `1200×630` OG image, and three `1280×800` screenshots (`<300 KB` WebP + PNG) ready before starting batch submissions.
8. **Close Email Verification & OTP Loops:** Poll or check `press@<domain>` for magic links and 6-digit verification codes immediately so listings don't stall in `unverified` state.
9. **GitHub Awesome PR Etiquette:** Before opening any Awesome-list PR:
   - Read `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/workflows/`, and the last 3 merged PRs. Respect any repo that restricts AI-submitted PRs or SaaS products.
   - Edit the real source-of-truth file (`README.md`, `applications.json`, `data/*.csv`, or multi-locale READMEs), match exact ordering (alphabetical vs. end-of-section) and dash/punctuation style, and strip all `?ref=` / UTM parameters.
   - Use a collision-safe fork name (`<repo>-<upstream-owner>`).
10. **Idempotent `submissions-log.json` Tracking:** Check `submissions-log.json` before every target and append a structured receipt after each attempt:

```json
{
  "name": "AlternativeTo",
  "url": "https://alternativeto.net",
  "submissionUrl": "https://alternativeto.net/manage-item/",
  "wave": 1,
  "status": "submitted",
  "liveOrPrUrl": "https://alternativeto.net/software/yourproduct/",
  "submittedAt": "2026-11-11T16:00:00Z",
  "notes": "Free dofollow path"
}
```
