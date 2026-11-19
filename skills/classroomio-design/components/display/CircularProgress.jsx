import React from 'react';
export function CircularProgress({ value, size = 20, strokeWidth = 2, progressColor = 'var(--ui-primary)', trackColor = 'var(--ui-muted)', style }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} style={{ flexShrink: 0, transform: 'rotate(-90deg)', ...style }}>
    <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth}/>
    <circle cx={center} cy={center} r={radius} fill="none" stroke={progressColor} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'all 300ms' }}/>
  </svg>;
}
