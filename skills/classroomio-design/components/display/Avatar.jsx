import React from 'react';
export function Avatar({ src, alt = '', fallback, size = 32, style }) {
  const [err, setErr] = React.useState(false);
  return <span style={{ position: 'relative', display: 'flex', width: size, height: size, flexShrink: 0, overflow: 'hidden', borderRadius: '50%', ...style }}>
    {src && !err ? <img src={src} alt={alt} onError={() => setErr(true)} style={{ width: '100%', height: '100%', aspectRatio: '1', objectFit: 'cover' }}/>
      : <span style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--ui-muted)', color: 'var(--ui-muted-foreground)', fontFamily: 'var(--font-sans)', fontSize: Math.round(size * 0.4), fontWeight: 500 }}>{fallback}</span>}
  </span>;
}