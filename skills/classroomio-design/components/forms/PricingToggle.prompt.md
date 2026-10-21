Pill-shaped monthly/annual billing switch with a tilted gradient "Save 2 months" badge. Ports `custom/pricing-toggle`; active segment is a grey pill, the badge hides when `saveLabel` is empty. Pair with PricingCard via `isYearlyPlan`.
```jsx
<PricingToggle isYearly={yearly} onToggle={setYearly} />
```
