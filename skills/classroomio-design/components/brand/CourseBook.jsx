import React from 'react';
export function CourseBook({ label = 'TRACK', title, value, caption, width = 200, height = 300, style }) {
  return <div style={{ width, height, background: 'var(--blue-700)', color: '#FFFFFF', padding: '22px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', borderLeft: '14px solid #022A9C', ...style }}>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--blue-300)' }}>{label}</span>
    <b style={{ marginTop: 8, fontSize: 22, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{title}</b>
    <span style={{ marginTop: 'auto', fontSize: 72, fontWeight: 700, letterSpacing: '-0.06em', lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: 14, color: 'var(--blue-200)' }}>{caption}</span>
  </div>;
}