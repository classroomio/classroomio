import React from 'react';
export function TestimonialCard({ quote, name, role, company, avatar, style }) {
  return <figure style={{ position: 'relative', margin: 0, background: 'var(--sand-200)', borderRadius: 10, padding: '32px 28px 28px', display: 'flex', flexDirection: 'column', gap: 22, breakInside: 'avoid', ...style }}>
    <svg width="30" height="24" viewBox="0 0 30 24" aria-hidden="true"><path d="M0 24V14C0 6 4 1.5 12 0l1.5 3.5C9 5 7 8 7 11h5v13zm17 0V14c0-8 4-12.5 12-14l1 3.5C26 5 24 8 24 11h5v13z" fill="var(--blue-300)"/></svg>
    <blockquote style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: 'var(--ink-900)', textWrap: 'pretty' }}>{quote}</blockquote>
    <figcaption style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(23,20,15,0.10)', paddingTop: 18 }}>
      {avatar ? <img src={avatar} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}/> : <span style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--sand-300)', flexShrink: 0 }}/>}
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}><b style={{ fontSize: 15 }}>{name}</b><span style={{ fontSize: 13, color: 'var(--ink-500)' }}>{role}{company ? ', ' + company : ''}</span></span>
      {company && <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.03em', color: 'var(--ink-500)' }}>{company}</span>}
    </figcaption>
    <span aria-hidden="true" style={{ position: 'absolute', top: -1, left: 24, width: 46, height: 10, background: 'var(--page)', clipPath: 'polygon(0 0,100% 0,calc(100% - 8px) 100%,8px 100%)' }}/>
  </figure>;
}