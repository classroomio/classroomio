import React from 'react';
export function FlowLines({ from, width = 420, height = 360, mode = 'fan', toCount = 5, color = 'var(--blue-700)', style }) {
  const src = from || { x: 0, y: 180 };
  const spread = mode === 'fan' ? height * 0.78 : 0;
  const paths = Array.from({ length: toCount }, function (_, i) {
    const ty = toCount === 1 ? height / 2 : (height - spread) / 2 + (spread / (toCount - 1)) * i;
    const midY = src.y + (ty - src.y) * 0.5;
    return 'M' + src.x + ' ' + src.y + ' C ' + (width * 0.4) + ' ' + src.y + ', ' + (width * 0.5) + ' ' + midY + ', ' + width + ' ' + ty;
  });
  return <svg width={width} height={height} viewBox={'0 0 ' + width + ' ' + height} aria-hidden="true" style={style}>
    <g fill="none" stroke={color} strokeWidth="1.6" strokeDasharray="3 6" strokeLinecap="round">{paths.map((d, i) => <path key={i} d={d}/>)}</g>
    <circle cx={src.x} cy={src.y} r="5" fill={color}/>
  </svg>;
}