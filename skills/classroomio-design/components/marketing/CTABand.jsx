import React from 'react';
export function CTABand({ eyebrow = 'START FREE', title = 'Build your first academy in an afternoon.', body = '14-day free trial of the Growth plan. No credit card. No sales call.', primary = 'Start free', secondary = 'Talk to us', style }) {
  return <div style={{ position: 'relative', background: 'var(--cta-gradient)', borderRadius: 10, color: '#FFFFFF', padding: '104px 64px 96px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', overflow: 'hidden', ...style }}>
    <svg aria-hidden="true" width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}><defs><pattern id="cioCtaIso" width="60" height="30" patternUnits="userSpaceOnUse"><path d="M0 15 L30 0 L60 15 L30 30 Z" fill="none" stroke="rgba(255,255,255,0.08)"/></pattern></defs><rect width="100%" height="100%" fill="url(#cioCtaIso)"/></svg>
    <span style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.12em', color: 'var(--blue-300)' }}>{eyebrow}</span>
    <h2 style={{ position: 'relative', margin: '16px 0 0', fontWeight: 700, fontSize: 64, letterSpacing: '-0.045em', lineHeight: 1.04, maxWidth: 900, textWrap: 'balance' }}>{title}</h2>
    <p style={{ position: 'relative', margin: '20px 0 0', fontSize: 20, lineHeight: 1.5, maxWidth: 640, color: 'var(--blue-200)' }}>{body}</p>
    <div style={{ position: 'relative', marginTop: 36, display: 'flex', gap: 12 }}>
      <a href="#" style={{ display: 'inline-flex', alignItems: 'center', height: 40, boxSizing: 'border-box', background: '#FFFFFF', color: 'var(--blue-700)', borderRadius: 8, padding: '0 24px', fontWeight: 500, fontSize: 14 }}>{primary}</a>
      {secondary && <a href="#" style={{ display: 'inline-flex', alignItems: 'center', height: 40, boxSizing: 'border-box', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', borderRadius: 8, padding: '0 24px', fontWeight: 500, fontSize: 14 }}>{secondary}</a>}
    </div>
    <span aria-hidden="true" style={{ position: 'absolute', top: -1, left: 28, width: 46, height: 10, background: 'var(--page)', clipPath: 'polygon(0 0,100% 0,calc(100% - 8px) 100%,8px 100%)' }}/>
  </div>;
}