# ClassroomIO Design System

ClassroomIO is an **open-source, white-label customer-education platform**: companies run a branded academy (self-paced tracks, webinars, verifiable certificates) on their own domain, with an API/MCP so systems and AI agents know who's qualified. Audiences: customer-education, CS, support and partner-enablement leads at SaaS companies.

## Source
- GitHub **classroomio/classroomio@main → `packages/ui`** (Svelte 5 + shadcn-svelte/bits-ui, Tailwind 4 with `ui:` prefix, Lucide icons). Component structure, sizes, spacing, radii and states are taken from `packages/ui/src/base/*`. See `github.md` for the file map.

### Code and theme
**Code wins on structure; the marketing theme supplies colour and type.** Every app component keeps the codebase's exact geometry (36px controls, 8px radius, 14px/500 text, 3px focus ring, shadcn shadows) but its semantic tokens are remapped in `tokens/app.css`:
- primary `oklch(.488 .243 264)` → **#0233BD** brand blue · ring → **#ADC3FF** sky
- background/card/popover white → **#FDFBF7** paper · foreground → **#17140F** ink
- secondary/muted/accent greys → **#F1EEE7 / #F6F2E9** sand · muted-foreground → **#6B6152**
- border/input `oklch(.922 0 0)` → **#E3DACA** sand hairline
- destructive and success kept from code; Alert `information` re-mapped from sky to brand-blue tint
- font: Geist (the code's commented-out `--font-cio` default)

App tokens are namespaced `--ui-*` so they don't collide with marketing tokens (`--accent`, `--border` mean different things in each).

## Index
- `styles.css` → imports `tokens/{fonts,colors,typography,spacing,base}.css`
- `fonts/` — Geist (variable, latin) + Geist Mono (latin, latin-ext) woff2
- `assets/logo-mark.svg`, `assets/images/` (dashboard screenshot, 3 portraits, 2 team photos, HubSpot integration icon)
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand)
- `tokens/app.css` — codebase semantic tokens (`--ui-*`), radii, shadows, z-layers
- **App components (from codebase)**
  - `components/forms/` — Button, ButtonGroup, Input, Textarea, Label, Field, InputGroup, PasswordInput, Select, Checkbox, RadioGroup, Switch, Toggle + ToggleGroup, CopyButton, ModeSwitcher, IconButton, BackButton, ComboButton, CheckboxOptionCard, RadioOptionCard, MultiSelectList, FileDropZone, PricingToggle (`uiShared.jsx` = shared Lucide glyphs/hooks)
  - `components/overlays/` — Dialog, Sheet (covers Drawer), Popover, Tooltip, DropdownMenu, Command (+ CommandDialog), Menubar, NavigationMenu, HoverCard, Toast (Sonner)
  - `components/display/` — Badge, NumberBadge, Alert, Card, Avatar, Accordion, Tabs, Table, Progress, Skeleton, Spinner, Kbd, Separator, Item, Empty, Breadcrumb, Pagination, Collapsible, UnderlineTabs, Sidebar, Page, Chip, UserAvatar, CircularProgress, PercentRingProgress, ResourceListRow
  - `guidelines/components/` — extra preview cards (inputs, selection, data)
- **Marketing components (from the concept artifact)**
  - `components/core/` — Eyebrow, Tag, Pill, Icon, Logo
  - `components/surfaces/` — NotchCard, CourseCard, BrowserFrame, BookSpine + Shelf, PricingCard
  - `components/marketing/` — CTAButton, Nav, ProductMenu, SectionHeader, FAQItem, TestimonialCard, VideoTestimonial, CTABand, Footer
- `components/brand/` — launch/asset primitives: **Block/BlockStack/BlockGrid** (the signature notch-block — the unit the original brand is built from), PersonCard + PersonFan, CertifiedRibbon, CourseBook, FlowLines, DetailRows, Shelf + BookSpine, Stamp
- `templates/launch-gallery/LaunchGallery.dc.html` — **the canonical marketing template**: 9 launch frames (1270×760) built from the brand/* primitives. Every launch image, social post or thumbnail starts here (see `docs/brand-assets.md`)

**Which button?** `Button` (app, 36px) for product UI and small actions; `CTAButton` (marketing, 16–18px) for site heroes and section CTAs.

**Not yet built from `packages/ui/src/base`:** chart; and the rest of `src/custom/*` (editor, exercise-question, org-landing-page, etc.). Dark theme tokens not mapped. The sidebar has no mobile Sheet mode; Command, Menubar, NavigationMenu, HoverCard and Toast simplify keyboard, positioning and motion behaviour (see each `.prompt.md`).
- `Brand Assets.dc.html` — colour schemes, 8 social post layouts (square/portrait/landscape via Tweaks), branded page kit in the landing-page language
- `tokens/schemes.css` + `guidelines/schemes*.html` — six surface schemes (paper, sand, blue, ink, sky, tint) and pairing rules
- `components/loading/` — BlockLoader, CompactLoader, BlockGlyph, ImportProgress, BlockSkeleton, AgentDrafting (from the Loading states board)
- `Component Preview.html` — every component on one page
- `docs/` — content, visual, iconography and brand-asset rules (split out of this README)
- `SKILL.md` — entry point for agents

**Intentional additions:** `Icon` (wraps the inline SVG glyphs repeated across the source), `Logo` (wraps the inline mark + wordmark), `Shelf` (base rail under BookSpines).
