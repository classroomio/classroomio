import React from 'react';
export function Stamp({ top = 'OPEN', bottom = 'source', caption, size = 150, color = 'var(--blue-700)', tilt = -12, style }) {
  return <div style={{ width: size, height: size, border: '1.6px solid ' + color, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(' + tilt + 'deg)', color, ...style }}>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: size * 0.073, letterSpacing: '0.14em' }}>{top}</span>
    <b style={{ fontSize: size * 0.173, letterSpacing: '-0.03em' }}>{bottom}</b>
    {caption && <span style={{ fontFamily: 'var(--font-mono)', fontSize: size * 0.067 }}>{caption}</span>}
  </div>;
}