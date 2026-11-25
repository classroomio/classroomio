# Assets: faces, logos, ink, fonts

Put each kind of image in its own `img/<folder>/` and run `mg manifest <project>`. Scenes pick images with `asset('faces', index)`. Keep large photo sets outside the repo, in the project folder or a shared assets folder linked into `img/`.

## Faces and photos (Unsplash)

- Free for commercial use with no attribution required: https://unsplash.com/license. Avoid images marked Unsplash+ (premium).
- Find candidates by searching unsplash.com. Download chosen photos at the size you need: `https://images.unsplash.com/photo-<id>?w=640&h=640&fit=crop&crop=faces&q=85&fm=jpg` for portraits, `w=1600` for rooms and backgrounds.
- Build a contact sheet of candidates and choose deliberately. Aim for:
  - varied ages, genders and skin tones;
  - consistent lighting within a scene;
  - no visible brand logos;
  - nobody famous.
- **Rule:** stock faces only ever play anonymous attendees, learners or trainers. Never present them as named customers, testimonials or endorsements. Named people on screen are fictional and say so in the credits.
- Useful folders from the launch film: `faces` (portraits), `bw` (black-and-white portraits for walls), `room` (people in rooms, for course thumbnails), `light` (bokeh and light leaks, screen-blended), `dust` (particles on black, screen-blended).

## Logos (Simple Icons)

- CC0. The SVGs come from the `simple-icons` npm package (in this repo: `node_modules/.pnpm/simple-icons@*/node_modules/simple-icons/icons/<slug>.svg`).
- Copy the ones you need into `img/logos/`. Write `img/logos.js` as `window.LOGO_PATHS_SI = { zapier: ['<path d>', …], … }` and load it in `index.html`. Then `brandLogo('zapier', 64, '#FF4F00')` draws it.
- Use each brand's own colour on its mark. Trademarks are for showing integrations that really exist, never to imply a partnership.

## Ink reveals

- Use photos of ink blooming in water: dark ink on a light background, from Unsplash.
- Run `ink-alpha.py <photosDir> <project>/img/ink`. Name the inputs `ink1_*.jpg`, `ink2_*.jpg`, … so `updateCinematic(..., { inks: ['ink1', 'ink2'] })` can pick a pair.
- Without ink images, the reveal falls back to a soft growing disc.

## Fonts

All are bundled in `templates/project/fonts` and licensed under OFL:
- Geist and Geist Mono (the ClassroomIO design system);
- Instrument Serif regular and italic (the payoff word).

Add others with `@font-face` in `lib/styles.css`, and only use fonts whose licence allows embedding in video.

## Credits

Keep a `CREDITS.md` in the project that lists:
- each photo (Unsplash URL and photographer when known);
- the logo set and its licence;
- the fonts and their licence;
- the illustrative names used (companies, people).
