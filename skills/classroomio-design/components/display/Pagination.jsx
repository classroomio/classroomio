import React from 'react';
import { Button } from '../forms/Button.jsx';
import { Ic } from '../forms/uiShared.jsx';
export function Pagination({ page = 1, count = 1, onChange, siblings = 1, style }) {
  const set = (p) => { if (p >= 1 && p <= count && onChange) onChange(p); };
  const pages = [];
  for (let p = 1; p <= count; p++) { if (p === 1 || p === count || Math.abs(p - page) <= siblings) pages.push(p); else if (pages[pages.length - 1] !== '…') pages.push('…'); }
  return <nav aria-label="pagination" style={{ display: 'flex', justifyContent: 'center', ...style }}>
    <ul style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0, padding: 0, listStyle: 'none' }}>
      <li><Button variant="ghost" onClick={() => set(page - 1)} disabled={page <= 1} style={{ padding: '8px 10px' }}>{Ic('chevronLeft', 16)}<span>Previous</span></Button></li>
      {pages.map((p, i) => <li key={i}>{p === '…' ? <span style={{ display: 'flex', width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>{Ic('more', 16)}</span>
        : <Button size="icon" variant={p === page ? 'outline' : 'ghost'} onClick={() => set(p)} aria-current={p === page ? 'page' : undefined}>{p}</Button>}</li>)}
      <li><Button variant="ghost" onClick={() => set(page + 1)} disabled={page >= count} style={{ padding: '8px 10px' }}><span>Next</span>{Ic('chevronRight', 16)}</Button></li>
    </ul>
  </nav>;
}