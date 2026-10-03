import React from 'react';
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
export function PercentRingProgress({ value, size = 'small', style }) {
  const clamped = Math.max(0, Math.min(100, value));
  const small = size === 'small';
  const px = small ? 40 : 56;
  return <div style={{ position: 'relative', width: 'fit-content', flexShrink: 0, ...style }}>
    <svg width={px} height={px} viewBox="0 0 100 100" aria-hidden="true" style={{ display: 'block', transform: 'rotate(-90deg)', transformBox: 'fill-box', transformOrigin: 'center' }}>
      <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#E5E7EB" strokeWidth="8"/>
      <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#16A34A" strokeWidth="8" strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - clamped / 100)} style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0,0,0.2,1)' }}/>
    </svg>
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: small ? 10 : 14, lineHeight: 1, color: 'var(--ui-foreground)' }}>{Math.round(clamped)}%</p>
    </div>
  </div>;
}
