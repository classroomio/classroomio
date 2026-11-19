import React from 'react';
export function SectionHeader({ eyebrow, title, lede, align = 'center', size = 'h2', style }) {
  const h = size === 'display' ? { fontSize: 96, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.02 } : size === 'h3' ? { fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 } : { fontSize: 58, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05 };
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', textAlign: align, ...style }}>
    {eyebrow && <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 15, letterSpacing: '0.14em', color: 'var(--ink-500)', textTransform: 'uppercase' }}>{eyebrow}</p>}
    <h2 style={{ margin: eyebrow ? '16px 0 0' : 0, fontFamily: 'var(--font-sans)', textWrap: 'balance', ...h }}>{title}</h2>
    {lede && <p style={{ margin: '18px 0 0', fontSize: 21, lineHeight: 1.5, maxWidth: 760, color: 'var(--ink-700)', textWrap: 'pretty' }}>{lede}</p>}
  </div>;
}