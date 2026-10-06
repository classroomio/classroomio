import React from 'react';
export function Table({ columns = [], rows = [], caption, selected = [], onRowClick, style }) {
  const [hov, setHov] = React.useState(-1);
  return <div style={{ position: 'relative', width: '100%', overflowX: 'auto', fontFamily: 'var(--font-sans)', ...style }}>
    <table style={{ width: '100%', captionSide: 'bottom', fontSize: 14, borderCollapse: 'collapse', color: 'var(--ui-foreground)' }}>
      {caption && <caption style={{ marginTop: 16, fontSize: 14, color: 'var(--ui-muted-foreground)' }}>{caption}</caption>}
      <thead><tr style={{ borderBottom: '1px solid var(--ui-border)' }}>
        {columns.map(c => <th key={c.key} style={{ height: 40, padding: '0 8px', textAlign: c.align || 'left', verticalAlign: 'middle', fontWeight: 500, whiteSpace: 'nowrap', width: c.width }}>{c.header}</th>)}
      </tr></thead>
      <tbody>{rows.map((r, i) => { const sel = selected.includes(i);
        return <tr key={i} onClick={() => onRowClick && onRowClick(r, i)} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(-1)} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--ui-border)' : 0, background: sel ? 'var(--ui-muted)' : hov === i ? 'color-mix(in oklab, var(--ui-muted) 50%, transparent)' : 'transparent', transition: 'background 150ms', cursor: onRowClick ? 'pointer' : undefined }}>
          {columns.map(c => <td key={c.key} style={{ padding: 8, verticalAlign: 'middle', whiteSpace: 'nowrap', textAlign: c.align || 'left' }}>{c.render ? c.render(r, i) : r[c.key]}</td>)}
        </tr>; })}</tbody>
    </table>
  </div>;
}