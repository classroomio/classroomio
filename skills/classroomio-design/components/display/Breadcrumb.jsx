import React from 'react';
import { Ic } from '../forms/uiShared.jsx';
export function Breadcrumb({ items = [], style }) {
  return <nav aria-label="breadcrumb" style={{ fontFamily: 'var(--font-sans)', ...style }}>
    <ol style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, margin: 0, padding: 0, listStyle: 'none', fontSize: 14, color: 'var(--ui-muted-foreground)', wordBreak: 'break-word' }}>
      {items.map((it, i) => { const last = i === items.length - 1;
        return <React.Fragment key={i}>
          <li style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            {last ? <span aria-current="page" style={{ fontWeight: 400, color: 'var(--ui-foreground)' }}>{it.label}</span>
              : <a href={it.href || '#'} onClick={it.onClick} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 150ms' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--ui-foreground)'} onMouseLeave={e => e.currentTarget.style.color = ''}>{it.label}</a>}
          </li>
          {!last && <li role="presentation" aria-hidden="true" style={{ display: 'flex' }}>{Ic('chevronRight', 14)}</li>}
        </React.Fragment>; })}
    </ol>
  </nav>;
}