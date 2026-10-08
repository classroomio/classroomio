App/product button from `packages/ui/src/base/button` — 36px default height, 8px radius, 14px/500 Geist, blue primary.
```jsx
<Button>Save changes</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="destructive" loading>Delete</Button>
<Button variant="ghost" size="icon" aria-label="More">{/* svg */}</Button>
```
Variants: default · light-default · destructive · outline · secondary · ghost · ghost-default · ghost-outline · link. Sizes: default(36) · sm(32) · xs(28) · lg(40) · icon / icon-2xs / icon-xs / icon-sm / icon-lg. `loading` shows the brand BlockGlyph (three stacking bars) before the label and disables the button. Marketing pages use `CTAButton`, which shares these exact sizes.