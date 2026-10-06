# Editing rules

## Audio

- **Noise removal runs before the cuts and before compression.** The chain is `arnndn` with the RNNoise `sh` model (speech in noisy rooms), then `afftdn=nf=-35`. The compressor runs afterwards; run it first and it lifts the noise back up. Denoising after the cuts produced NaN audio, which broke the AAC encoder.
- **Measured on a multi-speaker room recording:** the noise floor dropped from −50 dB to −82 dB, the main speaker was unchanged, and teammates' quieter replies dropped 2–3 dB (mostly the noise under them). If quiet voices matter, compare a reply's level with and without the filter before shipping.
- **Mastering:** `highpass 80 Hz → lowpass 14 kHz → compressor (−22 dB, 3:1) → loudnorm I=−14 TP=−1.5 LRA=9`. Accept −13.5 to −14.8 LUFS.
- **Pause trimming:** silences under −35 dB lasting at least 0.4 s are cut, keeping 0.12 s before and 0.08 s after. A cut never covers a word start; it stops 0.12 s before the word. Expect 15–30% shorter clips.
- Cut with `select`/`aselect` from a cleaned WAV. Using `split` plus `trim` branches buffers every frame and stalls.
- The QA sync check reads the audio at every caption word start. At least 90% should be above −45 dB; softly spoken words make up the rest.

## Captions

- Clean the transcript, not the audio:
  - drop fillers
  - collapse stutters ("they they")
  - fix brand and product names (ClassroomIO, SaaS, and any company the speaker names)
  - capitalise the first word and end on a full stop
  - add per-clip corrections for words the transcript misheard
- **16:9:** Geist 700 50 px, max 820 px wide, 2 lines, ink chip (78% opacity, square corners), bottom-left at the 108 px margin. The width stays under half the frame, so captions never reach into a split panel.
- **9:16:** Geist 60 px on the ink background, 3 lines, top at y 1460.
- Pages break at sentence ends, at gaps over 1.2 s, or when the lines overflow. The current word is sky blue (#ADC3FF); the rest are paper.

## Layout (9:16, 1080×1920)

| Area | Position |
|---|---|
| Platform UI (keep clear) | top 110 px, bottom ~300 px, right ~120 px |
| Logo + series eyebrow + headline | y 130–520 (headline Geist 700 76 px, max 3 lines) |
| Video (4:3 crop, 1080×810) | y 560–1370, blue progress bar underneath |
| Captions | y 1460–1660 |
| Split panel | y 0–820, video moves to 820–1428 |
| Full panel | y 0–1440 |

## Layout (16:9, 1920×1080)

- **Title card** for the first 4.75 s, unless a visual starts before 5.2 s: an ink card top-left with `CLASSROOMIO · SERIES` in sky mono, the clip title in Geist 700 64 px, and a 6 px blue underline.
- **Logo** top-right at 90%. It fades out while a panel is on screen.
- **Punch-ins** for talking heads: a 1.2× crop around the speaker, switching at sentence starts (3 s minimum) and at pause cuts (2 s minimum) to hide the jump.

## Hooks (short-form)

- The clip's strongest line, 2–5 s long, played before the clip starts: a question, a contrarian claim, or a number.
- A full-bleed 9:16 crop on the speaker with a slow 4% push-in, Geist 700 88 px word-by-word over a bottom protection gradient, then a 0.14 s paper flash cut into the normal opening.
- The vertical SRT starts with the hook line, and every later cue shifts by the hook's length.

## Sign-off

- 5 s on paper:
  1. the logo mark's three shapes drop in with the brand bounce
  2. the lowercase "classroomio" wordmark rises in
  3. the Lesson / Quiz / Certificate notch blocks drop in and interlock
  4. the headline lands with a sky swipe under one word
- It's silent, so it can go after any recording. The video crossfades into it over 0.5 s.
- Rendered once per project into `output/sign-off/` and reused.
- Use the logo built from `assets/logo-mark.svg` plus the Geist 800 wordmark. Never lift a logo or animation from old footage.

## Brand

- Colours, type and copy come from `classroomio-design`: paper, sand, ink, one blue (#0233BD), sky for highlights, Geist and Geist Mono.
- No shadows, no gradients except photo protection, square corners except BrowserFrame (18 px) and Stamp (round).
- Copy rules (docs/content.md): sentence-case headlines, no emoji, no exclamation marks, no em dashes, no "seamless/powerful/leverage/unlock".
