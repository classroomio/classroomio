App billing plan card. Ports `custom/pricing-card`: 384px max width, 32px padding, 10px radius card, plan name, price, "Per Organization", full-width CTA, then a check-marked feature list. `isPopular` adds the pink-to-orange badge and swaps the CTA to primary with a sparkles icon; `isLoadingPlan === planName` shows the loader.
```jsx
<PricingCard planName="early-adopter" isPopular isYearlyPlan plan={{ NAME: 'Early Adopters', PRICE: { CURRENCY: '$', MONTHLY: '35', YEARLY: '350', IS_PREMIUM: false }, FEATURES: ['Everything in Basic', '10K Students'], CTA: { DASHBOARD_LABEL: 'Upgrade now', IS_DISABLED: false } }} onClick={() => {}} />
```
