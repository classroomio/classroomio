import React from 'react';
import { Ic, FONT } from '../forms/uiShared.jsx';
import { Button } from '../forms/Button.jsx';

const GRADIENT = 'linear-gradient(to right, #ec4899, #f97316)';

export function PricingCard({ plan, isPopular = false, isYearlyPlan = false, isLoadingPlan = null, planName, onClick, popularLabel = 'Popular', perOrgLabel = 'Per Organization', ctaLabel, isDisabled, featuresLabel = "What's included:", style }) {
  const isLoading = isLoadingPlan === planName;
  const price = isYearlyPlan ? plan.PRICE.YEARLY : plan.PRICE.MONTHLY;
  return <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', maxWidth: 384, boxSizing: 'border-box', padding: 32, borderRadius: 'var(--ui-radius-lg)', border: '1px solid var(--ui-border)', background: 'var(--ui-card)', fontFamily: FONT, ...style }}>
    {isPopular && <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', padding: '4px 16px', borderRadius: 999, background: GRADIENT, color: '#fff', fontSize: 12, lineHeight: '16px', fontWeight: 500 }}>{popularLabel}</span>}
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 20, lineHeight: '28px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ui-foreground)' }}>{plan.NAME}</h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 20, lineHeight: '28px', fontWeight: 500, color: 'var(--ui-foreground)' }}>{plan.PRICE.CURRENCY}{price}</span>
      </div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--ui-muted-foreground)' }}>{perOrgLabel}</p>
    </div>
    <div style={{ marginBottom: 16 }}>
      <Button variant={isPopular ? 'default' : 'outline'} loading={isLoading} disabled={isDisabled ?? plan.CTA.IS_DISABLED} onClick={() => { if (!isLoading && onClick) onClick(plan, planName); }} style={{ width: '100%', height: 'auto', padding: '16px 16px', fontSize: 16 }}>
        {isPopular && Ic('sparkles', 18)}
        {ctaLabel ?? plan.CTA.DASHBOARD_LABEL}
      </Button>
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--ui-foreground)' }}>{featuresLabel}</p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {plan.FEATURES.map((feature) => <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 20, height: 20, marginTop: 4, color: 'var(--ui-foreground)' }}>{Ic('check', 14)}</span>
          <span style={{ fontSize: 14, lineHeight: 1.625, color: 'var(--ui-muted-foreground)' }}>{feature}</span>
        </li>)}
      </ul>
    </div>
  </div>;
}
