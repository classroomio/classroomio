import React from 'react';
import { Ic, FONT } from './uiShared.jsx';

function Period({ active, onClick, children }) {
  const [hover, setHover] = React.useState(false);
  return <button type="button" onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ cursor: 'pointer', border: 0, borderRadius: 999, padding: '4px 12px', fontFamily: FONT, fontSize: 14, lineHeight: '20px', fontWeight: 500, transition: 'all 500ms ease-in-out', background: active ? '#E5E7EB' : 'transparent', color: active ? '#111827' : hover ? 'var(--ui-accent-foreground)' : 'var(--ui-muted-foreground)' }}>{children}</button>;
}

export function PricingToggle({ isYearly, defaultYearly = false, onToggle, monthlyLabel = 'Monthly', yearlyLabel = 'Annually', saveLabel = 'Save 2 months', style }) {
  const [inner, setInner] = React.useState(defaultYearly);
  const yearly = isYearly !== undefined ? isYearly : inner;
  const set = (value) => { setInner(value); onToggle && onToggle(value); };
  return <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', width: 'fit-content', maxWidth: '100%', margin: '0 auto', padding: 4, boxSizing: 'border-box', borderRadius: 999, border: '1px solid var(--ui-border)', background: '#fff', ...style }}>
    <Period active={!yearly} onClick={() => set(false)}>{monthlyLabel}</Period>
    <Period active={yearly} onClick={() => set(true)}>{yearlyLabel}</Period>
    {saveLabel && <span style={{ position: 'absolute', top: -12, right: -16, transform: 'rotate(5deg)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: 'linear-gradient(to right, #ec4899, #f97316)', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', whiteSpace: 'nowrap', fontSize: 10, lineHeight: '16px', fontWeight: 700 }}>
      {Ic('sparkles', 8)}{saveLabel}
    </span>}
  </div>;
}
