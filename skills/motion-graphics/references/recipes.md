# Recipes

Each recipe points at working code from the ClassroomIO launch film in `examples/classroomio-launch/`.

Those files ran against the project they were written for. Images came from its `img/` folders, which are not included. Treat them as code to read and adapt, not to load as is. They use the same engine helpers as `scripts/runtime/` (`scene`, `el`, `css`, `ep`, `spring`, `kick`, `cinematicPanel`, `updateCinematic`, `letters`, `lettersIn`, `scramble`, `glow`, `svgLayer`, `makeTrail`, `updateTrail`, `footageClip`, `drawFootage`, `preload`, `asset`, `brandLogo`, `seeded`).

| Recipe | Use it for | Code |
|---|---|---|
| **Wall of calls with a live tile** | "the 100th time", repetition, scale | `scenes-v3a.js`: `buildCallWall`, `setWallCamera`, `updateLiveTile`, `A-call-wall`. The shot starts as real footage at scale 4 (`WALL_FULL = canvasWidth / tileWidth`) and pulls back with a log zoom and 3D tilt. |
| **Bookend: the wall returns and resolves** | the closing argument | `scenes-v3a.js`: `N-unique`. A counter runs 100 → 001, tiles go dark from the outside in, neighbour tiles relight warm with new labels, and the camera pushes back to the live footage. |
| **Big counter with kicker** | numbers that matter | `scenes-v3a.js`: `buildCounter` |
| **Week calendar filling up, behind the speaker** | time wasted, schedules | `scenes-v3a.js`: `E-week-behind`. Blocks are timed to words, with tallies, a summary chip and a red pulse. Placement changes per camera shot. |
| **Window crumbles to dust** | endings, loss, "nothing left" | `scenes-v3a.js`: `F-call-dissolves`. A canvas-painted call window, a per-pixel release time along x plus noise, an unreleased-region mask, and additive motes with a glow pass. |
| **Chat bubbles that glitch and shatter** | "they said they understood… they didn't" | `scenes-v3a.js`: `buildBubble`, `G-understood`. Bubbles are built from four clip-path shards, then get jitter, an RGB split and a scramble, then a "?", then shatter with gravity. |
| **Corridor of people, 1 → 64** | hiring, headcount, scale | `scenes-v2.js`: `B-trainer-corridor` |
| **Swarm collapses to one point, then becomes a product** | "teach it once" | `scenes-v2.js`: `C-teach-it-once` |
| **Certificate with guilloche, stamp and routing to tools** | credentials, documents | `scenes-v2.js`: `guillochePath`, `rosettePath`, `D-certificate-to-systems` |
| **3D browser with callouts and leader lines** | branding, websites, "your domain, name, logo" | `scenes-v3b.js`: `H-your-academy`. A typed URL, a scrambled name, a logo burst, a brand-colour wash, and glowing leaders from callouts to targets found with `getBoundingClientRect`. |
| **Quiz card that locks answers, then flies into the next scene** | tests, validation | `scenes-v3b.js`: `I-the-test`. It is behind the speaker, then flies to camera and fills the frame in the next cue's colour. |
| **Seats lighting up in a cascade** | teams, enrolment, "at once" | `scenes-v3b.js`: `J-whole-team` |
| **Terminal with a real API call and light trails into tool logos** | APIs, integrations | `scenes-v3c.js`: `K-public-api` |
| **`git clone` → server corridor → open source** | self-hosting, infrastructure | `scenes-v3c.js`: `rackTexture`, `L-self-host`. It uses per-rack opacity, never opacity on the 3D group. |
| **Approval pill with a spark burst** | small endorsements beside the speaker | `scenes-v3c.js`: `M-approved` |
| **URL typed, Enter, button click, ripple into the end card** | the call to action | `scenes-v3c.js`: `O-academy-new` |
| **Sound cues for all of the above** | timing references | `sfx-cues.py` |

## Patterns worth copying

- **Named beat constants per cue**: `const SITE = { in, cut, domainAt, nameAt, logoAt, … }`.
- **Cinematic shell**: `const handles = cinematicPanel(root, { background })` in `build`, and `updateCinematic(handles, T, { start, cut, inkDuration, inks, flashIn, hardCut, effects })` first in `update`.
- **3D rig**: a perspective container, then a `.d3` rig (`transform-style: preserve-3d`) moved with translateZ, rotateX and rotateY driven by `spring`, plus a slow drift: `lerp(..., prog(T, in, out))`.
- **Canvas for heavy drawing**: particles, painted windows, rack textures. Size the canvas from its on-screen scale (see `drawFootage`) so it stays sharp when the camera pushes in.
- **Async assets**: register with `preload(src)` (awaited before the first frame). Per-frame assets go in `prepare(T, state)`, which the renderer awaits before `renderAt`.
