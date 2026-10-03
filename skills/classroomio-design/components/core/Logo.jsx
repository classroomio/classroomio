import React from 'react';
export function Logo({ size = 'md', color = 'var(--blue-700)', wordmark = true, style }) {
  const s = { sm: [33, 24, 22, -0.03], md: [33, 24, 22, -0.03], lg: [41, 30, 30, -0.04] }[size] || [33, 24, 22, -0.03];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: s[2], letterSpacing: s[3] + 'em', color: 'var(--ink-900)', ...style }}>
    <svg width={s[0]} height={s[1]} viewBox="55 180 916 666" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M385 180 H518 Q528 180 528 190 V836 Q528 846 518 846 H385 A333 333 0 0 1 385 180 Z" fill={color}/><circle cx="796" cy="353" r="173" fill={color}/><path d="M748 595 H961 Q971 595 971 605 V836 Q971 846 961 846 H601 Q591 846 591 836 V752 A157 157 0 0 1 748 595 Z" fill={color}/></svg>
    {wordmark && <span>classroomio</span>}
  </span>;
}