# Craft: making graphics feel cinematic

What separated the rejected first pass from the version the user called "much better", and what made the later additions land.

## Contents

1. Why the first pass failed
2. The look
3. Planning cues
4. Timing to the voice
5. Type
6. Motion
7. Transitions in and out
8. Behind, beside or full frame
9. Endings
10. Review loop

## 1. Why the first pass failed

The first version used flat cards on brand colours, icons drawn as simple shapes, illustrated avatars, simple slide-ins and one blue everywhere. Each cue was correct but forgettable. The feedback was blunt: "nothing wow, not magical", use real faces and real logos.

What fixed it was not more animation. It was **depth, light, real material and consequence**:
- **Depth.** 3D space, perspective, camera moves.
- **Light.** Glow, flashes, light trails, bloom.
- **Real material.** Photos, logos, live footage, grain.
- **Consequence.** Something happens because of the word: a wall of calls, a week that fills up, a call that turns to dust.

## 2. The look

- **Dark cinematic panels.** Deep radial gradients (near-black with a coloured core), film grain (`grain` 0.2) and a vignette. Each cue gets its own temperature: cool blue-black for problems, warm amber for payoffs, and the brand colour only where the brand is the subject.
- **Light is the accent colour.** Glowing text (`glow(rgb, strength)`), screen-blended light plates, SVG light trails with a bright head, flashes between scenes.
- **Real material.**
  - Unsplash portraits for anonymous people (attendees, learners, trainers).
  - Simple Icons for real tools (Zapier, HubSpot, Notion, GitHub…).
  - Real UI chrome: browser bars, terminals, chat bubbles, calendars.
  - The speaker's own footage inside a graphic, which is the strongest trick in the set.
- **Truthful product detail.** When showing an API call, a webhook name, a CLI command or a domain, check it against the codebase or docs first. Use real endpoint paths and real field names, and say which names are illustrative (company names, people).
- **Restraint.** One idea per cue, and one hero object per frame. Supporting detail is smaller, dimmer and slower.

## 3. Planning cues

- Read the whole transcript first and mark the lines that carry the argument: the problem, the turn, the payoff and the call to action.
- A good cue **visualises consequence or scale**:
  - "the 100th time" became one call among a hundred;
  - "8 hours here, 10 hours there" became a week calendar filling up;
  - "nothing to follow up on" became a call window crumbling into dust;
  - "they say they understood" became chat bubbles that glitch and shatter.
- Use **bookends**. The opening wall of calls returns near the end and resolves (100 → 1, unique tiles glow, the camera lands back on the speaker). Callbacks make a film feel authored.
- **Rhythm.** Alternate full-frame cues with stretches of the speaker on camera. Two or three seconds of face between cues lets the audience breathe. About half the runtime as graphics worked well.
- **The cue table** you show the user needs these columns:
  - id;
  - in → out;
  - the line;
  - what happens, in one vivid sentence;
  - type.
  Then describe the motion in plain words, so the user can say yes or no to the idea before any rendering.

## 4. Timing to the voice

- Every beat starts on a word from `transcript/words.txt`. Store beats as named constants, for example `const QUIZ = { in: 54.0, lock1: 55.0, … }`, so retiming is a one-line change.
- Things appear **on** the word, or 2–4 frames before it for big hits. Typing finishes as the word ends. Counters land on the stressed syllable.
- Make the cut back to the speaker on a phrase boundary, never mid-word.
- Watch the burned-in captions: a full-frame cue hides them, so the graphic must carry the line's meaning, often by quoting it.

## 5. Type

- **Sans for statements**: Geist 700–800, tight tracking (−0.045em to −0.05em), large (100–150 px on a 1920 canvas).
- **Serif italic for the payoff word**: Instrument Serif italic, in a warm light colour with glow. Examples: *once.*, *at once.*, *open source.*, *.new*.
- **Mono for labels and kickers**: Geist Mono, uppercase, 0.26–0.42em tracking, 18–22 px, at reduced opacity.
- **Reveal letter by letter**: `letters()` plus `lettersIn()` blur up from below. Use `scramble()` for things that "resolve" (names, glitches).
- Text over busy material sits on an opaque or near-opaque surface. Translucent glass is only for empty backgrounds (see gotchas).

## 6. Motion

- **Springs, not linear moves.** Use `spring(T, start, freq, damping)` for arrivals and `kick(T, at, decay)` for punches, presses and flares.
- **Camera moves sell space.** Push in, pull back or tilt in 3D with a perspective container. Logarithmic zoom (scale interpolated in log space) looks natural for big scale changes.
- **Stagger by distance.** Cascades ripple out from a centre: `delay = distance * k`.
- **Motion blur** (4 sub-frames, 180° shutter) makes fast moves feel filmed. Always render finals with it.
- **Overshoot sparingly.** `ease.outBack` for pills and buttons, never for big panels.
- **Particles with purpose.** Dust, sparks and motes should come from something that is ending or igniting.

## 7. Transitions in and out

- **In:** an ink reveal (`updateCinematic` with `inkDuration` 0.45–0.55), a white-blue flash in (`flashIn`) after another cue, or a hard cut on a hit word.
- **Out:** a flash exit (the default, with a `flash_whoosh` in the sound), a hard cut back to the speaker, or the camera landing back on live footage (the wall bookend).
- **Into an end card:** match its first frame exactly. For example, a click ripple expands to `#F7F7F7` by the frame the end card starts.

## 8. Behind, beside or full frame

- **Full frame** is for ideas that need the whole canvas: scale, space, systems.
- **Behind the speaker** is for supporting data while their face carries the line: calendars, quiz cards, chat bubbles. Place it in the empty side of the frame, at 0.9–1.0 scale with a slight Y rotation toward the speaker.
- **Beside the speaker** is for small badges or pills (an "Approved" review pill, a LGTM) that need no matte. Keep them clear of the face and the captions.

## 9. Endings

If the speaker gives a URL or call to action:
- type it into a glowing address bar;
- press Enter with a light wave;
- show the payoff (a floor of course cards lighting up);
- then a "Get started →" button, a cursor that clicks it, and a ripple that becomes the end card's background.

The user noticed immediately when an ending was dropped. Endings are not optional.

## 10. Review loop

1. Build a cue, then run `mg check` at 6–12 times across it and inspect the sheet: legibility, collisions, whether 3D elements vanished, mask leaks, empty frames.
2. Fix, re-check, then render the range and watch it in motion with sound.
3. When the user gives feedback, change only what they named. Re-render that range and re-encode both previews.
