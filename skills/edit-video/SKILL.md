---
name: edit-video
description: Edit ClassroomIO videos (talking heads, team discussions, product demos, screen recordings, tutorials, webinars) into branded, professional cuts for YouTube, Shorts, Reels, LinkedIn and X using the ClassroomIO design system. Covers pause trimming, noise removal, word-by-word captions, explainer split screens and full-screen takeovers (news screenshots, flows, lists), short-form hooks, the ClassroomIO sign-off, thumbnails, QA and a posting-guide PDF. Use when the user asks to edit, cut, clip, caption, brand, repurpose or prepare a ClassroomIO video for social media or YouTube.
user-invocable: true
---

# Edit ClassroomIO videos

Turn a recording into short, independent clips that look like ClassroomIO made them. One JSON project file describes the job, and `scripts/cio-video` does the editing. The look comes entirely from the `classroomio-design` skill; this skill adds the steps and the motion.

Nothing here depends on a particular machine or account. Every input path comes from the project file the user gives you, and the tool only needs the requirements below.

## Requirements

- **ffmpeg 6+** with the `arnndn`, `afftdn`, `silencedetect`, `loudnorm` and `ebur128` filters.
- **Python 3.10+.** `scripts/cio-video` creates its own venv and installs `scripts/requirements.txt` on first run.
- **Chrome or Chromium** for screenshots and the guide PDF. It's found on PATH, or set `CIO_VIDEO_CHROME`.
- **Network on first run** to download the RNNoise `sh` model.
- **The `classroomio-design` skill** next to this one (`skills/classroomio-design/`). Fonts, logo geometry and image assets are read from it.
- Caches live in `$CIO_VIDEO_CACHE`, or `$XDG_CACHE_HOME/cio-video`, or `~/.cache/cio-video`.

Run `skills/edit-video/scripts/cio-video check` first. It names anything missing.

## The design system in video

Load `classroomio-design` before choosing any colour, type, copy or layout. This is how the skill maps it to video:

| Design system | Used for |
|---|---|
| Palette (`tokens/colors.css`, `docs/visual.md`): paper, sand, ink, one blue #0233BD, sky #ADC3FF | Panels on paper or sand, the vertical background and caption chips in ink, the current caption word and swipes in sky. One blue element per visual. |
| Geist 700 / 800 and Geist Mono (`fonts/`) | Headlines and captions in Geist 700, the wordmark in Geist 800, uppercase eyebrows and labels in Geist Mono with 0.12em tracking. |
| Logo (`assets/logo-mark.svg` + lowercase wordmark) | Built from the SVG geometry. Never lift a logo or animation from old footage. |
| Block / BlockStack (notch cards) | Explainer flows and stacks, and the sign-off's Lesson / Quiz / Certificate blocks. |
| BrowserFrame, DetailRows, FlowLines, Stamp | Screenshot panels, comparison rows, dashed connectors, date stamps. |
| Launch-gallery frame 02 “Pain” (`templates/launch-gallery/`) | The YouTube thumbnail layout. |
| Motion (`docs/visual.md`): block drop with bounce, marker swipe, typed caret | Every entrance animation. |
| Voice (`docs/content.md`) | Titles, hooks and social copy: sentence case, plain claims, no emoji, no exclamation marks, no em dashes. |
| Rules (`docs/brand-assets.md`) | No shadows, no decorative gradients, square corners except BrowserFrame and Stamp, one idea per clip. |

## Steps

1. **Collect inputs.** You need the source recording and a transcript with word timings. A YouTube auto-caption VTT is best (`yt-dlp --write-auto-subs --sub-format vtt --skip-download <url>`). SRT or `[[seconds, "word"], …]` JSON also work; SRT words are spread across each cue, so they land less precisely. Ask the user where the files are. Never assume a path.
2. **Look before you cut.**
   - Grab a few frames from the source to learn the framing: talking head or screen, and where the speaker sits.
   - Read the transcript with `cio-video words project.json --start 0 --end 300`.
   - Pick windows that stand alone: one idea, a strong first line, a full-sentence ending.
3. **Write `project.json`** next to the source. Start from `templates/project.example.json` (talking head) or `templates/project.screen.example.json` (screen recording). `references/project-file.md` lists every field.
4. **Plan and clean.** Run `cio-video plan project.json --transcript`. It trims pauses and removes noise (cached), prints each cleaned transcript, and lists every explainer and hook with its timing. Add `corrections` until the transcript reads right, then fix every `!` warning.
5. **Add explainers and hooks.** See `references/explainers.md`.
   - Tie each visual to the phrase that introduces it.
   - For news, verify the claim with web search, capture the real article with `cio-video screenshot`, crop it, and credit it on screen.
   - Ask the user for anything the web won't give you, such as banners or logged-in pages.
   - The hook is a 2–5 s line from the same clip.
6. **Preview one clip** with `cio-video render project.json --clip 01 --out preview/`, then build its QA sheet. Show the user before rendering the rest: hooks, visual choices and split versus full are taste calls.
7. **Render everything.** Run `cio-video render project.json --jobs 3`, then `captions`, `thumbnails` and `guide`. Write the copy in each clip's `posts`, following `docs/content.md`.
8. **QA.** Run `cio-video qa project.json`. Every row must read `ok`: loudness within 1 LU of target and at least 90% of words landing on speech. Then look at every contact sheet in `<work>/qa/`:
   - captions don't cover a visual
   - text is legible at phone size
   - nothing sits in the 9:16 platform UI zones
   - one blue element per visual
9. **Report back.** Give the output folder, what changed, the QA numbers, and what the user must check before posting:
   - consent from everyone on camera or named
   - facts and sources
   - visuals that are illustrative rather than real

## Ask the user, don't assume

- Where the source and transcript are, and where the output should go.
- News and third-party pages: real credited screenshots, or brand cards that quote the headline.
- Which formats get the hook (the default is 9:16 only).
- The sign-off headline and the series eyebrow (`INSIGHTS`, `PRODUCT TOUR`, `CHANGELOG`, …).
- Anything said on camera about customers, numbers or other companies that will be published.

## References

| Need | File |
|---|---|
| Every project-file field | `references/project-file.md` |
| Explainer kinds, props, modes, timing rules | `references/explainers.md` |
| Audio, captions, layout safe zones, hooks, sign-off | `references/editing-rules.md` |
| Platform specs, posting guide, copy | `references/publishing.md` |
| Errors and fixes | `references/troubleshooting.md` |

## Commands

```bash
V=skills/edit-video/scripts/cio-video
$V check
$V words project.json --start 120 --end 240          # source transcript with times
$V plan project.json [--clip 01 02] [--transcript]    # trim, denoise, print timelines and warnings
$V render project.json [--clip 01] [--format 9x16] [--jobs 3] [--out preview/]
$V sign-off project.json [--force]                    # standalone sign-off clips (16:9 and 9:16)
$V thumbnails | captions | qa | guide project.json [--clip …]
$V screenshot <url> out.png [--crop x0,y0,x1,y1] [--no-js]
```

Clip ids match by prefix, so `--clip 01` selects `01-why-onboarding-fails`. Outputs go to the project's `output` folder; caches, timelines and QA sheets go to its `work` folder.
