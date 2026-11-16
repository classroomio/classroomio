# Brand covers

On-brand 16:9 cover images (1600 × 900 WebP), drawn from the ClassroomIO logo's three shapes, brand blue `#0542CC` and Geist. Use them wherever the product needs a default or placeholder picture instead of a stock photo.

The files live here and are imported by `@cio/ui`, so a consuming app bundles them like any other module asset. Import the URLs from `packages/ui/src/custom/block/image-defaults.ts` rather than referencing a path string.

| File | Look | Branding | Text in the image |
| --- | --- | --- | --- |
| `oversized-mark.webp` | Logo enlarged and cropped off the right edge on solid brand blue, with a light blue circle | Wordmark + `classroomio.com` | Brand name and URL |
| `shape-tiles.webp` | The logo shapes as a tiled pattern in brand blues, wordmark on a white card | Wordmark | Brand name |
| `blueprint.webp` | Logo mark centred on a light drafting grid with crop marks | Logo mark only | `16:9`, `1600 × 900` |

None of them carry translatable copy, so they work in every locale. `blueprint.webp` is the most neutral and reads as a placeholder, which makes it the safest choice where an org's own branding should lead.

## Where they are used

`packages/ui/src/custom/block/image-defaults.ts` exports `BRAND_COVER_IMAGES` and `DEFAULT_IMAGE_BLOCK_IMAGE`.

- `oversized-mark.webp` (`DEFAULT_IMAGE_BLOCK_IMAGE`) is the default image for a new lesson image block, wired in through `apps/dashboard/src/lib/features/block/components/image/image-utils.ts`.
- The Storybook image block stories (`packages/storybook/src/blocks/image-block/image-block.stories.svelte`) render the default and all three covers.
