The signature ClassroomIO unit: a flat-coloured tile with a trapezoid "notch" bitten out of its top edge, as if punched from the page. Everything in the brand — lessons, features, pricing tiers, loading states — can be expressed as a Block. Stack with a `tab` so one interlocks into the next; grid them for a feature/pricing wall.
```jsx
<Block kind="LESSON" title="Getting started" tone="sand"/>
<BlockStack blocks={[{kind:'LESSON',title:'Getting started',tone:'sand'},{kind:'QUIZ',title:'Setup check',tone:'blue'}]}/>
<BlockGrid columns={4} blocks={features}/>
```
Set `surface` to whatever sits behind the block so the notch reads as a cut-out. Tones share the six brand schemes' colours.