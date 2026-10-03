import React from 'react';
export function Separator({ orientation = 'horizontal', style }) {
  const v = orientation === 'vertical';
  return <div role="separator" aria-orientation={orientation} style={{ flexShrink: 0, background: 'var(--ui-border)', width: v ? 1 : '100%', height: v ? '100%' : 1, alignSelf: v ? 'stretch' : undefined, ...style }}/>;
}