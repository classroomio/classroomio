---
name: classroomio-design
description: ClassroomIO's design system. Use for any ClassroomIO UI, marketing page, launch image, social post, deck or thumbnail, and before choosing a colour, type size, radius or component. Covers tokens, app and marketing components, voice, and brand-asset rules.
user-invocable: true
---

# ClassroomIO design system

One blue (#0233BD) on warm paper and sand, Geist type, and the notch card as the signature shape. Read the docs below before inventing any colour, size or copy.

## Read first

| Need | File |
|---|---|
| What the system is, how code and marketing themes combine, file index | `README.md` |
| Voice, casing, copy rules | `docs/content.md` |
| Palette, type, radii, layout, backgrounds, motion | `docs/visual.md` |
| Icon style and the Icon set | `docs/iconography.md` |
| Launch images, social posts, decks | `docs/brand-assets.md` |

## Where things live

- `tokens/` and `styles.css`: colours, type, spacing, schemes. `tokens/app.css` holds the `--ui-*` app tokens mapped from `packages/ui`.
- `components/{forms,overlays,display}`: app components mirroring `packages/ui/src/base`.
- `components/{core,surfaces,marketing,brand,loading}`: marketing and brand components.
- Each component has `.jsx`, `.d.ts` and `.prompt.md`. Read the `.prompt.md` before using one.
- `guidelines/`: specimen cards. `Component Preview.html`: everything on one page.
- `Launch Gallery v2.dc.html`, `Brand Assets.dc.html`: reference layouts for assets.
- `github.md`: map from each component to its `packages/ui` source, plus last sync date.

## Choosing

- Product UI and small actions: `Button` (36px). Site heroes and section CTAs: `CTAButton`.
- Pick one of the six schemes in `tokens/schemes.css` per surface and do not mix them.
- Production Svelte work: take geometry and tokens from here, implement in `packages/ui` with the `ui:` prefix rules in the repo CLAUDE.md.
- Throwaway mocks: copy assets out and build static HTML.

If invoked with no task, ask what to build and for whom.
