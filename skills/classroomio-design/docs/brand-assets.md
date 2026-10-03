# Brand assets: launch images, social posts, thumbnails, ads, decks

**Do not invent a layout.** Every marketing asset outside the website starts from a frame in `templates/launch-gallery/LaunchGallery.dc.html`. Pick the frame whose story fits yours, copy its markup, change the copy and data, and resize if needed. If nothing fits, combine two frames' parts. Don't fall back to generic centred-headline-on-gradient layouts.

## Workflow
1. Name the **one idea** the asset says (one sentence). If you have three, make three assets.
2. Choose a frame from the catalogue below by story type.
3. Copy the frame's outer `1270×760` div and its data arrays. Keep the geometry: 80px margins, headline size and tracking, the visual's position.
4. Rewrite the copy in the voice from `docs/content.md`. Headlines are a plain claim of 5–9 words. Body is one sentence.
5. Resize for the target format (below), then run the checklist.

## Frame catalogue
| # | Frame | Use when the story is… | Structure |
|---|---|---|---|
| 01 | **Promise** (hero) | the core value; launch day; YouTube thumbnail | Paper bg. Wordmark → 78px H1 → one-line lede on the left. **PersonFan** of 3 tilted person cards on the right; the centre card wears the CertifiedRibbon. |
| 02 | **Pain** | "sound familiar?"; the problem before the product | Ink bg. Sky mono eyebrow → 80px H2 → lede pinned to bottom. Photo on the right 520px with stacked colour rows (paper/sky/blue) bleeding over its bottom. |
| 03 | **Enrolment** (flow) | automation; integrations; "X happens, then Y" | Paper. H2 and lede split across the top. Source card (HubSpot) → dashed blue **FlowLines** fan out → avatar list → solid blue result panel with a big number. |
| 04 | **Certificate** | credentials; proof; outcome for one person | Tint #EEF2FF. Full-height portrait left with ribbon. Mono eyebrow → H2 → **DetailRows** (label/value hairline rows) pinned to the bottom. |
| 05 | **API** | developer and integration stories | Sand #F6F2E9. Copy on the left. On the right: person ticket card → blue status bar → dashed connector → ink event log in mono. |
| 06 | **Breadth** | feature overview; "everything included" | Paper. 64px H2 top-left. A 4×2 grid of numbered features on hairlines pinned to the bottom. No boxes. |
| 07 | **White-label** | branding; custom domain; "looks like you" | Half paper copy with a strikethrough→new domain line. Half in the *customer's* colour (green example) showing their academy. |
| 08 | **Offer** | pricing; launch offer; open source | Paper. Copy and ink offer chip on the left. Pricing as **BookSpines** on a **Shelf** (Growth is the blue spine), with a rotated outline **Stamp**. |
| 09 | **Blocks** | product model; "build a track"; brand moment | Paper. H2 on top. **BlockStack** of interlocking notch blocks (lesson→quiz→certificate) + a 2-column **BlockGrid**. |

The components in bold live in `components/brand/` (read each `.prompt.md`). The frames inline the same geometry, so copying either is fine.

## Formats
Keep the frame's composition and scale it. Don't re-flow it into a centred stack.
- **Launch / OG / X / LinkedIn landscape** 1270×760 (native) or 1200×630: same layout, trim 40px top and bottom.
- **YouTube thumbnail** 1280×720: use 01, 02, 04 or 08. Headline ≥ 96px, max 6 words, cut the lede, and make the person or object 20% larger.
- **Square** 1080×1080: stack copy on top (80px margins) and put the visual in the bottom 55%. 01, 04, 06 and 09 work best.
- **Portrait / story** 1080×1350 or 1080×1920: same as square, but the visual gets the bottom 60% and the headline goes up to 96px.
- **Deck slide** 1920×1080: scale the frame 1.5×.

## Rules (non-negotiable)
- **No box shadows.** Depth comes from flat colour blocks, hairline borders, or a photo bleeding under a panel.
- **Square by default.** Only `PersonCard`/`PersonFan` (30px radius), circular avatars and `Stamp` are round. Book spines use 3px. Everything else is square.
- **One idea per asset.** One headline plus one visual (a person, a flow, a book shelf, a row list).
- **People over screenshots.** Use a real portrait when the story is about someone being trained or certified. Use screenshots only for product-UI stories, and put them in a `BrowserFrame`.
- **Rows over boxed stat grids.** Use `DetailRows` and hairline grids, never bordered stat boxes.
- **One blue element per asset**, for the most important fact. The rest stays paper, sand or ink. (Ink frames may use sky #ADC3FF for the eyebrow.)
- **One scheme per asset** from `tokens/schemes.css`: paper, sand, ink, tint or blue. Frame 07's customer colour is the only exception.
- **Type:** Geist 700 for headlines at 60–80px (≥ 96 on thumbnails), tracking -0.05em, line-height 0.96–1. Geist Mono for eyebrows (14px, 0.12em, uppercase) and labels. Body 18–20px, line-height 1.5.
- **Banned:** gradient backgrounds (except a dark protection gradient on photos), emoji, glows, drop shadows, glassmorphism, centred-everything layouts, icon-in-circle feature rows, stock 3D illustrations.

## Checklist before shipping
- [ ] Started from a numbered frame (say which one)
- [ ] One idea, one blue element, one scheme
- [ ] No shadows and no rounded panels
- [ ] Headline readable at 25% size
- [ ] Portraits and names are placeholders until approved
