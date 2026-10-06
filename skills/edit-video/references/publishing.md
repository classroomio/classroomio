# Publishing

Platform limits change. These were checked in October 2026; search again before quoting them to the user.

| Platform | File | Notes |
|---|---|---|
| YouTube Shorts | 9x16 | Vertical uploads up to 3 min publish as Shorts. Captions are burned in, so leave auto-captions off by default. |
| YouTube (regular) | 16x9 + thumbnail + `-16x9.srt` | Upload the SRT for search. Put the end screen over the 5 s sign-off. Keep a series in one playlist. |
| Instagram Reels | 9x16 | Up to 3 min can be recommended to new audiences. Use the first frame as the cover; the headline reads in the square grid crop. |
| LinkedIn | 9x16 | Native vertical reaches furthest; 30–90 s works best. Post from a person's profile, reshare from the company page, and put the link in the first comment. |
| X | 16x9 | Standard accounts allow up to 2 min 20 s. Upload natively; don't link to YouTube. |

## Posting guide PDF

`cio-video guide project.json` builds a branded A4 PDF from each clip's `posts` copy and the render metadata:
- cover
- what's in the folder
- which file goes where
- schedule (sorted by `posts.order`, with both durations)
- how to post on each platform
- "before you post" notes
- one page per clip with every caption, ready to paste

## Writing the copy

- Follow `classroomio-design/docs/content.md`: confident, plain, a little dry.
  - YouTube titles under 70 characters.
  - X posts under 280 characters (the guide flags overruns).
  - LinkedIn in the first person for the speaker's profile.
  - Instagram: one or two lines plus 5 hashtags.
- Run the `humanizer` skill over the copy before the PDF.
- Check every factual claim in the copy and say where it came from. If the speaker states something as news, verify it. If it can't be verified, attribute it ("my read:") or flag it in the guide notes.
- Order the schedule as a story: news → evidence → argument → what ClassroomIO does. Time-sensitive clips go first.
- Always add notes for consent (people on camera, names said aloud), sources, and any illustrative visuals.
