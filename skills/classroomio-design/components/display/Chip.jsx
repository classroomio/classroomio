import React from 'react';
import { Badge } from './Badge.jsx';
export function Chip({ value = 0, style }) {
  return <Badge variant="outline" style={{ height: 20, minWidth: 20, boxSizing: 'border-box', padding: '0 4px', borderRadius: 999, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', ...style }}>{value}</Badge>;
}
