# Project file

One JSON file per editing job. Paths are relative to the file. A path that starts with `design:` points into `skills/classroomio-design/assets/images/`, for example `design:integration-hubspot.png`.

## Top level

| Field | Default | Meaning |
|---|---|---|
| `source` | required | The full recording. Any resolution; it's normalised to 1920×1080 30 fps. |
| `transcript` | required | Word-timed VTT (YouTube auto-captions), plain VTT, SRT, or JSON `[[seconds, "word"], …]` covering the whole source. |
| `series` | `CLASSROOMIO` | Uppercase mono eyebrow on title cards, vertical headers, thumbnails and the guide. For example: `PRODUCT TOUR`, `CHANGELOG`, `CUSTOMER STORY`, `HOW TO`, `INSIGHTS`. |
| `kind` | `talking-head` | `talking-head` crops on the speaker and punches in. `screen` keeps the whole frame and fits it into splits. |
| `output` / `work` | `edited` / `work` | Deliverables, and caches with QA sheets. |
| `formats` | `["16x9", "9x16"]` | Which cuts to render. |
| `corrections` | `{}` | Word fixes for the cleaned transcript: `{"SAS": "SaaS", "classroom": "ClassroomIO"}`. Keys match the bare word, case-sensitive first, and trailing punctuation is kept. |
| `phrase_corrections` | brand defaults | Multi-word fixes such as `{"classroom io": "ClassroomIO", "class room": "ClassroomIO"}`. Applied before `corrections`. |
| `drop_words` | `um uh erm hmm` | Words removed from captions only. The audio is untouched. |
| `audio` | see below | `denoise`, `trim_pauses`, `pause_db` (−35), `pause_min` (0.4 s), `pad_before` (0.12), `pad_after` (0.08), `loudness` (−14). |
| `sign_off` | ClassroomIO default | `headline` (lines), `swipe` (the word that gets the sky marker), `url`, optional `blocks` (`kind`, `title`, `tone`: sand, tint or blue). `enabled: false` skips it. `file` reuses an existing sign-off: name the 16x9 file, and the 9x16 file is found by swapping the suffix. |
| `url` | `CLASSROOMIO.COM` | Mono footer on vertical cuts. |
| `thumbnail` | | `label` and `url` for the thumbnail's colour rows. |
| `guide` | | `title`, `lede`, `band`, `schedule_intro`, `notes: [{title, text}]` and `youtube_footer` for the posting-guide PDF. |
| `clips` | required | List of clips (below). |

## Clip

| Field | Meaning |
|---|---|
| `id` | File stem, for example `01-why-onboarding-fails`. Number-prefix it so the CLI can select it by prefix. |
| `start`, `end` | The window in source seconds. `end` can fall anywhere inside the last word; the cut extends to that word's end. |
| `file` | Instead of `start`: a pre-cut clip, located in the source by audio alignment. `trim_start` adds seconds. |
| `start_phrase`, `end_phrase` | Instead of seconds: the first and last words of the clip as spoken. `search_from` (seconds) disambiguates repeats. |
| `duration` | Instead of `end`. |
| `title` | Headline on the 16:9 title card and the 9:16 header. A plain claim in sentence case, 4–9 words. |
| `thumbnail` | Thumbnail headline, at most 6 words. |
| `thumbnail_frame` | `{"time": 8.0, "top": 0.08}`: which trimmed-clip frame to use, and how far down to crop. |
| `framing` | `cx` speaker x (0–1). `vx` the left edge of the 4:3 vertical crop in source pixels. `zoom` turns punch-ins on or off. `vertical_crop` is `4:3` or `16:9`. `split` is `crop` or `fit`. Defaults come from `kind`. |
| `hook` | Exact words from the clip for the 9:16 pre-roll (2–5 s). |
| `corrections`, `phrase_corrections`, `drop_words` | Per-clip overrides, merged over the project's. |
| `explainers` | Visual events: see `explainers.md`. |
| `posts` | Copy for the guide: `order`, `date`, `youtube_title`, `youtube_description`, `x`, `linkedin`, `instagram`. |

## Picking good windows

- Run `cio-video words` around the moment, then end on the word that finishes the sentence. A clip that stops mid-sentence feels cut off on its own.
- Overlapping windows are fine (one clip can repeat the previous clip's last line), but give each clip its own opening.
- Short is fine. A strong 15 s clip beats a 60 s ramble.
- After `plan`, read the cleaned transcript and add corrections until it reads like the speaker meant it.
