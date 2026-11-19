import React from 'react';
import { PersonCard } from './PersonCard.jsx';
export function PersonFan({ people = [], width = 560, height = 560, style }) {
  return <div style={{ position: 'relative', width, height, ...style }}>
    {people.map((p, i) => <div key={i} style={{ position: 'absolute', left: p.x || 0, top: p.y || 0, zIndex: p.z || 1 }}><PersonCard {...p}/></div>)}
  </div>;
}