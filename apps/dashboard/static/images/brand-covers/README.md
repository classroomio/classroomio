# Brand covers

On-brand 16:9 cover images (1600 × 900 WebP), drawn from the ClassroomIO logo's three shapes, brand blue `#0542CC` and Geist. Use them wherever the product needs a default or placeholder picture instead of a stock photo. They are served from `/images/brand-covers/<file>`.

| File | Look | Branding | Text in the image |
| --- | --- | --- | --- |
| `oversized-mark.webp` | Logo enlarged and cropped off the right edge on solid brand blue | Wordmark + `classroomio.com` | Brand name and URL |
| `shape-tiles.webp` | The logo shapes as a tiled pattern in brand blues, wordmark on a white card | Wordmark | Brand name |
| `blueprint.webp` | Logo mark centred on a light drafting grid with crop marks | Logo mark only | `16:9`, `1600 × 900` |

None of them carry translatable copy, so they work in every locale. `blueprint.webp` is the most neutral and reads as a placeholder, which makes it the safest choice where an org's own branding should lead.

## Where they are used

- `oversized-mark.webp` is the default image for a new lesson image block (`apps/dashboard/src/lib/features/block/components/image/image-utils.ts`).
