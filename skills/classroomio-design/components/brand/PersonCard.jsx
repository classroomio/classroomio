import React from 'react';
import { CertifiedRibbon } from './CertifiedRibbon.jsx';
export function PersonCard({ img, name, role, stats = [], certified = false, size = 'full', tilt = 0, style }) {
  const full = size === 'full';
  return <div style={{ position: 'relative', width: full ? 270 : 220, height: full ? 400 : 320, boxSizing: 'border-box', border: '1px solid var(--sand-300)', borderRadius: 30, background: 'var(--paper)', padding: 7, transform: tilt ? 'rotate(' + tilt + 'deg)' : undefined, transformOrigin: 'bottom center', ...style }}>
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden', background: '#FFFFFF' }}>
      <img src={img} alt="" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '72%', objectFit: 'cover', objectPosition: 'center 18%' }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 44%, rgba(255,255,255,0.9) 62%, #FFFFFF 72%)' }}/>
      {certified && <CertifiedRibbon size={full ? 50 : 40} style={{ position: 'absolute', left: 22, top: -2 }}/>}
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <b style={{ fontSize: full ? 28 : 20, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1 }}>{name}</b>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-700)' }}>{role}</span>
        {stats.length > 0 && <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
          {stats.map((s, i) => <React.Fragment key={i}>{i > 0 && <span style={{ width: 1, height: 28, background: 'var(--sand-300)' }}/>}<span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-500)' }}>{s.label}</span><b style={{ fontSize: 15 }}>{s.value}</b></span></React.Fragment>)}
        </div>}
      </div>
    </div>
  </div>;
}