import React from 'react';
const h = React.createElement;
const PATHS = {
  check: ['path', { d: 'M20 6 9 17l-5-5' }],
  minus: ['path', { d: 'M5 12h14' }],
  chevronDown: ['path', { d: 'm6 9 6 6 6-6' }],
  chevronUp: ['path', { d: 'm18 15-6-6-6 6' }],
  chevronLeft: ['path', { d: 'm15 18-6-6 6-6' }],
  chevronRight: ['path', { d: 'm9 18 6-6-6-6' }],
  x: ['path', { d: 'M18 6 6 18M6 6l12 12' }],
  lock: [['rect', { x: 3, y: 11, width: 18, height: 11, rx: 2 }], ['path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' }]],
  more: [['circle', { cx: 12, cy: 12, r: 1 }], ['circle', { cx: 19, cy: 12, r: 1 }], ['circle', { cx: 5, cy: 12, r: 1 }]],
  loader: ['path', { d: 'M12 2v4M16.2 7.8l2.9-2.9M18 12h4M16.2 16.2l2.9 2.9M12 18v4M4.9 19.1l2.9-2.9M2 12h4M4.9 4.9l2.9 2.9' }],
  info: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 16v-4M12 8h.01' }]],
  alert: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 8v4M12 16h.01' }]],
  search: [['circle', { cx: 11, cy: 11, r: 8 }], ['path', { d: 'm21 21-4.3-4.3' }]],
  eye: [['path', { d: 'M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0' }], ['circle', { cx: 12, cy: 12, r: 3 }]],
  eyeOff: [['path', { d: 'M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20M14.12 14.12a3 3 0 1 1-4.24-4.24' }]],
  plus: ['path', { d: 'M5 12h14M12 5v14' }],
  trash: [['path', { d: 'M3 6h18' }], ['path', { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' }], ['path', { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' }], ['path', { d: 'M10 11v6M14 11v6' }]],
  pencil: ['path', { d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z' }],
  inbox: [['path', { d: 'M22 12h-6l-2 3h-4l-2-3H2' }], ['path', { d: 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z' }]],
  panelLeft: [['rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }], ['path', { d: 'M9 3v18' }]],
  copy: [['rect', { x: 8, y: 8, width: 14, height: 14, rx: 2 }], ['path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }]],
  sun: [['circle', { cx: 12, cy: 12, r: 4 }], ['path', { d: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41' }]],
  moon: ['path', { d: 'M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401' }],
  circleCheck: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'm9 12 2 2 4-4' }]],
  octagonX: [['path', { d: 'm15 9-6 6M9 9l6 6' }], ['path', { d: 'M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z' }]],
  arrowLeft: ['path', { d: 'm12 19-7-7 7-7M19 12H5' }],
  triangleAlert: [['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }], ['path', { d: 'M12 9v4M12 17h.01' }]],
  upload: [['path', { d: 'M12 13v8' }], ['path', { d: 'm8 17 4-4 4 4' }], ['path', { d: 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242' }]],
  sparkles: ['path', { d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z' }],
};
/** Lucide-style icon (the codebase uses @lucide/svelte). */
export function Ic(name, size = 16, extra) {
  const p = PATHS[name]; if (!p) return null;
  const kids = Array.isArray(p[0]) ? p.map((c, i) => h(c[0], { key: i, ...c[1] })) : [h(p[0], { key: 0, ...p[1] })];
  return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, style: { flexShrink: 0, pointerEvents: 'none', ...(extra || {}) } }, kids);
}
export function useInteract() {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  return { hover, focus, bind: { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false), onFocus: () => setFocus(true), onBlur: () => setFocus(false) } };
}
export const FONT = 'var(--font-sans)';
export const focusStyle = (focus, invalid) => invalid ? { borderColor: 'var(--ui-destructive)', boxShadow: focus ? '0 0 0 3px color-mix(in oklab, var(--ui-destructive) 20%, transparent)' : undefined } : focus ? { borderColor: 'var(--ui-ring)', boxShadow: 'var(--ui-focus-ring)' } : null;
export function useOutside(ref, open, close) {
  React.useEffect(() => { if (!open) return; const f = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); }; document.addEventListener('mousedown', f); return () => document.removeEventListener('mousedown', f); }, [open]);
}
