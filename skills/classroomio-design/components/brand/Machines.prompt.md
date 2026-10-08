Isometric line illustrations that show a mechanism instead of describing it: grey hairlines everywhere, one moving part in the accent colour. SVG SMIL animation (no JS to run); frozen on the frame at `stillAt` seconds under prefers-reduced-motion. Size by giving the wrapper a height or width; the SVG fills it. Place on a sand surface (`--sand-200`, the default `face`), or pass `face` equal to the card colour so hidden lines stay hidden. One machine per marketing section. Text inside the drawings is placeholder copy.

| Component | Use for | Status |
|---|---|---|
| `MachineTrainingLine` | Hero: lessons ride one line and are stamped; CRM lights up | Waits on webhooks. If it slips, cut the wire and the CRM box |
| `MachineRepeater` | Problem band: an expert repeats the same explanation | Ready |
| `MachineSpectrum` | Education page: a learner rides up five levels to certified training | Ready |
| `MachineCertificatePress` | Pillar 2, certificates: stamped, then checked against a public URL | Waits on the verification URL and expiry |
| `MachineBrandStand` | Pillar 3, white-label: the "powered by" tag slides off, the sign and domain change | Ready (brand names are placeholders) |
| `MachineEventWire` | Pillar 4, API: events travel to a CRM and a help desk, one delivery is retried | Waits on webhooks |
| `MachineGlassBox` | Pillar 5, open source and price: the same mechanism inside a glass case | The 69/mo tag assumes the Growth tier ships; open source is live |

Source: the Brand assets / Machines design reference. App version: `packages/ui/src/custom/animation/machines/` (`MachineTrainingLine` and the rest).
```jsx
<div style={{ background: 'var(--sand-200)', padding: 24, height: 360 }}>
  <MachineRepeater label="An expert repeats the same explanation to each new customer"/>
</div>
```
