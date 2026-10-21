# Explainers

When the speaker mentions something, show it. Each explainer is tied to the phrase that introduces it, so it lands on the word, not seconds later.

```json
{
  "trigger": "there was a report last month",
  "duration": 6.0,
  "kind": "browser",
  "mode": {"16x9": "full", "9x16": "full"},
  "props": {
    "eyebrow": "IN THE NEWS",
    "image": "explainer-assets/news-headline.png",
    "url": "example-news.com/business",
    "credit": "SOURCE · OUTLET NAME · DD MON YYYY"
  }
}
```

## Timing

- `trigger`: the visual starts 0.25 s before these words. Matching ignores case and punctuation, and uses the cleaned transcript (corrections applied).
- End it with `duration` (seconds), or with `until` (a later phrase) plus `hold` (seconds after that phrase). Use `until` when the visual should stay up for exactly what the speaker is listing.
- Items inside a visual (`rows`, `items`, `nodes`, `blocks`, `lines`) take `at`: a phrase that makes that item appear when it's said. Items without `at` stagger in.
- Rules the planner enforces:
  - at least 1.6 s of speaker between visuals
  - 16 s maximum per visual
  - a visual within 1.2 s of the clip's end runs into the sign-off
  - `plan` warns when an `at` phrase falls after the visual has ended; fix it by moving the trigger later or using `until`
- Aim for 2–4 visuals per clip and 3–7 s each. The speaker should be on screen about half the time.

## Modes

| Mode | 16:9 | 9:16 |
|---|---|---|
| `split` | The speaker eases into the left half (cropped on `cx`, or fitted for screen recordings) and the panel fills the right half. | The panel slides down over the top 820 px; the video shrinks to 1080×608 below it. |
| `full` | The panel pushes the video out. Its content keeps the bottom 220 px clear for captions. | The panel covers everything above the captions (top 1440 px). |

Defaults that work:
- News screenshots, the main diagram and the pitch: `full`.
- Lists, event logs and step flows: `full` on 9:16 and `split` on 16:9, since a half-height panel is too small on a phone.
- Short accents (comparisons, a progress bar, a statement): `split` everywhere.
- Never put two `full` visuals back to back.

## Kinds

| Kind | Props | Use for |
|---|---|---|
| `browser` | `eyebrow`, `image`, `url`, `credit`, optional `stamp: ["TOP LINE", "BOTTOM"]` (for example a date) | Real screenshots: news, help-center notices, product pages, competitor sites. Drawn in the design system's BrowserFrame, with a slow 3.5% push-in. |
| `rows` | `eyebrow`, `rows: [{label, value, at, blue, dim, strike}]` | DetailRows: comparisons, "where people went", before/after. `strike` draws a line through the value. |
| `numbered` | `eyebrow`, `items: [{text, at}]` | A hairline numbered list (01, 02, 03): reasons, steps, constraints. |
| `flow` | `eyebrow`, `nodes: [{label, title, at, blue}]`, optional `image`, `image_label`, `image_title` | Notch blocks joined by dashed blue FlowLines: pipelines, processes, integrations. Horizontal in wide boxes (up to 3 nodes, or 4 in full 16:9); vertical otherwise. |
| `blocks` | `eyebrow`, `blocks: [{kind, title, at, blue}]` | A BlockStack building upward: a pitch, a course track, a value stack. |
| `statement` | `eyebrow`, `lines: [...]`, `swipe: [line_index, "word."]`, `swipe_at` | One big claim with a sky marker swipe. Use for the punchline. |
| `progress` | `eyebrow`, `start`, `end`, `marker`, `marker_at` (0–1), `marker_label` | A course or onboarding track with a "you are here" marker. |
| `prompt` | `eyebrow`, `prompt`, `reply`, `label`, `reply_label` | An AI prompt typing out with a caret, then a reply card. |
| `eventlog` | `eyebrow`, `lines: [{text, at}]` | An ink terminal log typing in (API, MCP, agent events). Text before ` · ` is sky. Mark it illustrative if it isn't real output. |

## Design rules

- One blue element per visual: the most important row, node or block (`blue: true`). The rest stays sand, paper or ink.
- Eyebrows are uppercase Geist Mono and say what the panel is ("IN THE NEWS", "THE PITCH", "WHY ONBOARDING FAILS").
- Values and titles are short: 2–5 words per row or block.
- No made-up numbers, customer names or quotes. Illustrative visuals (a sample log, a sample prompt) must not look like real customer data.

## Real screenshots

1. Verify the claim with web search. Note the outlet and date.
2. Capture it with `cio-video screenshot <url> raw.png`, then open `raw-preview.png` and pick the crop around the headline (CSS pixels): `--crop 30,228,415,330`.
3. Many outlets block headless Chrome or never settle. Try `--no-js`, then another outlet that covered the same story.
4. For banners, logged-in pages or anything else the web won't give you, ask the user for a screenshot.
5. Always set `credit`: `SOURCE · OUTLET · DD MON YYYY`.
