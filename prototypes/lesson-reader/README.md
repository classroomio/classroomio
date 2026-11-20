# Lesson reader prototype

Gloss-style reading for ClassroomIO lessons. Learners can highlight any line and ask about it, and the answer appears in the margin next to that sentence. Highlights and questions go to a notebook, old highlights come back on the student dashboard, and teachers see which passages confuse learners.

Open [`index.html`](./index.html) in a browser. It maps every screen. Each page has a **Prototype** button (bottom right) for switching learner state, AI on or off, the completion policy and the app theme.

| Screen | File | What it shows |
| --- | --- | --- |
| Lesson (learner) | `lesson.html` | Selection toolbar (Ask, Explain, Define, Highlight, Note, Read aloud, Copy), margin answers, Map rail, ¶ numbers, Aa settings (Look / Text / Answers), Notebook panel, Focus, Listen, lesson brief, resume card, read-to-complete |
| Video lesson | `video-lesson.html` | The notebook on a video: markers on the scrub bar, Bookmark (B), Note (N), Ask about this moment (A), transcript selection toolbar, video-ordered notebook panel, YouTube and Google Drive variants, and a teacher heat strip (`view=teacher`) |
| Course notebook | `notebook.html` | Every highlight and question in the course, filters, search, export, and a quiz built from saved items |
| Student dashboard | `home.html` | "From your notebook" resurfacing card and recently asked questions |
| Mobile | `mobile.html` | The lesson at 390px in a phone frame, with docked actions, inline answers and sheets |
| Public lesson | `public-lesson.html` | Signed-out reading. Highlights stay in the browser, and AI asks visitors to sign in |
| Reading insights (teacher) | `insights.html` | Aggregated highlight and question heat per paragraph, top questions, Rewrite with AI |

Useful URL params on `lesson.html`: `state=returning`, `ai=off`, `completion=read`, `open=notebook|settings|assistant`, `focus=1`, `listen=1`, `theme=paper|sepia|snow|night`, `face=serif|book|legible`, `demo=select|explain|ask`.

On `video-lesson.html`: `state=returning`, `source=upload|youtube|drive`, `enforce=1`, `view=teacher`, `ai=off`, `open=transcript|notebook`, `t=<seconds>`, `demo=bookmark|note|ask|select|explain`.

## How it is built

- `lesson-data.js` holds the lesson body, shaped like TipTap output from `lesson_language.content`, plus canned answers, seed notebook entries and insight numbers.
- `reader.js` derives paragraph indexes at render time and never writes them into the content. Highlights are stored as text-quote anchors (block, offsets, exact text, prefix and suffix) and painted with the CSS Custom Highlight API, so the lesson DOM is never changed. A highlight whose text was edited away shows in the notebook as "passage changed".
- Read aloud uses the browser's `speechSynthesis`, one sentence at a time, with a timed fallback when no voice is available.
- The video is simulated (slides on a timer) so the page works offline. `video-data.js` holds a transcript shaped like `media_transcript.segments` and `youtube_caption.segments`. A video entry anchors to a time (`t`, optional `tEnd`) and, when made from the transcript, to segment offsets plus the exact words. YouTube and Vimeo need their player APIs before markers and seeking can work; Google Drive and generic embeds can't report time, so notes there belong to the whole video.
- Reader preferences live in `localStorage` here. In the product they would live in `profile.settings.reader`.
- `app-theme.css` is copied from `course-templates` and mirrors `packages/ui` tokens. `reader.css` mirrors the course shell (sidebar, header, page header, Ask AI bar, side panel) and adds the reader surfaces.

Real components this wraps: `apps/dashboard/src/lib/features/course/pages/lesson.svelte`, `components/lesson/video/lesson-video-player.svelte`, `transcript-side-panel.svelte`, `lesson-video-bus.svelte.ts`, `components/lesson/note/note.svelte`, `components/lesson/note/quote-selection.svelte`, `features/side-panel/side-panel-rail.svelte` and `packages/ui/src/custom/public-course/`. This folder is not wired into the dashboard.
