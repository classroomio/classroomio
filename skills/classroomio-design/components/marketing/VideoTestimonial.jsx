import React from 'react';
export function VideoTestimonial({ image, quote, attribution, duration, caseStudy, size = 'lg', onPlay, style }) {
  const lg = size === 'lg';
  return <a href="#" onClick={e => { e.preventDefault(); onPlay && onPlay(); }} style={{ position: 'relative', display: 'block', height: lg ? 460 : 222, borderRadius: 10, overflow: 'hidden', color: '#FFFFFF', background: 'var(--ink-900)', ...style }}>
    <img src={image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}/>
    <div style={{ position: 'absolute', inset: 0, background: 'var(--photo-protect)' }}/>
    <div style={{ position: 'absolute', top: lg ? 24 : 14, left: lg ? 24 : 14, display: 'flex', gap: 8 }}>
      {duration && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'rgba(23,20,15,0.7)', borderRadius: 999, padding: '5px 10px' }}>▶ {duration}</span>}
      {caseStudy && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--paper)', color: 'var(--blue-700)', borderRadius: 999, padding: '5px 10px' }}>CASE STUDY</span>}
    </div>
    <div style={{ position: 'absolute', left: '50%', top: lg ? '40%' : '36%', transform: 'translate(-50%,-50%)' }}><span style={{ width: lg ? 84 : 48, height: lg ? 84 : 48, borderRadius: '50%', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width={lg ? 28 : 16} height={lg ? 28 : 16} viewBox="0 0 24 24"><path d="M7 4l14 8-14 8z" fill="var(--blue-700)"/></svg></span></div>
    <div style={{ position: 'absolute', left: lg ? 32 : 16, right: lg ? 32 : 16, bottom: lg ? 28 : 14, display: 'flex', flexDirection: 'column', gap: lg ? 12 : 5 }}>
      <span style={{ fontSize: lg ? 24 : 14, fontWeight: lg ? 600 : 500, lineHeight: 1.3, letterSpacing: '-0.01em' }}>“{quote}”</span>
      <span style={{ fontSize: lg ? 15 : 12, color: 'var(--sand-300)' }}>{attribution}</span>
    </div>
    <span aria-hidden="true" style={{ position: 'absolute', top: -1, left: 28, width: 46, height: 10, background: 'var(--page)', clipPath: 'polygon(0 0,100% 0,calc(100% - 8px) 100%,8px 100%)' }}/>
  </a>;
}