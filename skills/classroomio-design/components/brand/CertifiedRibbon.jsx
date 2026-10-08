import React from 'react';
export function CertifiedRibbon({ size = 50, style }) {
  const h = size * 84 / 54;
  return <svg width={size} height={h} viewBox="0 0 54 84" aria-label="Certified" style={{ display: 'block', ...style }}>
    <path d="M0 0 H54 V84 L27 68 L0 84 Z" fill="#17140F"/>
    <text x="27" y="25" textAnchor="middle" fontFamily="Geist, sans-serif" fontSize="6.5" fontWeight="700" fill="#FFFFFF" letterSpacing="0.6">CERTIFIED</text>
    <g transform="translate(15 33) scale(0.026)"><path d="M330 0 H463 Q473 0 473 10 V656 Q473 666 463 666 H330 A333 333 0 0 1 330 0 Z" fill="#FFFFFF"/><circle cx="741" cy="173" r="173" fill="#ADC3FF"/><path d="M693 415 H906 Q916 415 916 425 V656 Q916 666 906 666 H546 Q536 666 536 656 V572 A157 157 0 0 1 693 415 Z" fill="#FFFFFF"/></g>
  </svg>;
}