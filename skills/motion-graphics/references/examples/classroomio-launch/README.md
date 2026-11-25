# Example: ClassroomIO launch film (2026-11)

These are the scenes and sound cues behind the ClassroomIO launch video: a 1:49 talking-head film at 3840×2160 and 30 fps, with 15 graphics cues over about half its runtime. They are here to read and adapt; `../../recipes.md` maps each technique to its scene.

- `scenes-v2.js` holds B (trainer corridor), C (teach it once) and D (certificate → systems), plus `buildSlideTile`, which the wall in v3a uses for its tiles.
- `scenes-v3a.js` holds A (call wall with live tile), E (week behind the speaker), F (call dissolves), G (chat bubbles glitch and shatter) and N (the wall returns).
- `scenes-v3b.js` holds H (3D academy site with callouts), I (quiz behind the speaker → flies into the certificate) and J (seats light up).
- `scenes-v3c.js` holds K (public API terminal → tools), L (self-host → server corridor → open source), M (Approved pill) and O (academy.new → click ripple into the end card).
- `sfx-cues.py` holds every sound cue. It predates `sfxlib.py`: the library functions at the top of the file are the same, and the cues follow from `# A. Opening wall`.

Images (Unsplash faces, rooms, light, dust, ink), `img/logos.js` and the footage tiles were project-local and are not included. Company and person names in the scenes (Northwind, Acme, Lumen, Ada Obi, M. Adeyemi) are illustrative. Product facts (the `GET /public-api/v1/courses` call, the `course.certificate.issued` webhook, `./classroomio.sh start`) were checked against the repo at the time.
