import React from 'react';
const notch = (bg, left = 24, w = 46, h = 10, inset = 8) => ({ position: 'absolute', top: -1, left, width: w, height: h, background: bg, clipPath: `polygon(0 0,100% 0,calc(100% - ${inset}px) 100%,${inset}px 100%)`, zIndex: 4, pointerEvents: 'none' });
const tab = (bg, left = 26, w = 42, h = 16, inset = 7) => ({ position: 'absolute', bottom: -h, left, width: w, height: h, background: bg, clipPath: `polygon(0 0,100% 0,calc(100% - ${inset}px) 100%,${inset}px 100%)`, zIndex: 3, pointerEvents: 'none' });
const DEFAULT_BLOCKS = [
  { kind: 'LESSON', title: 'Getting started', bg: 'var(--sand-200)', fg: 'var(--ink-900)', label: 'var(--blue-700)', width: 340 },
  { kind: 'LESSON', title: 'Invite your team', bg: 'var(--blue-100)', fg: 'var(--ink-900)', label: 'var(--blue-700)', width: 300 },
  { kind: 'QUIZ', title: 'Setup check', bg: 'var(--blue-700)', fg: '#FFFFFF', label: 'var(--blue-300)', width: 320 },
  { kind: 'CERTIFICATE', title: 'Certified admin', bg: 'var(--ink-900)', fg: '#FFFFFF', label: 'var(--blue-300)', width: 280 },
];
/** 01 · Full page — lesson blocks drop and stack, then clear and repeat. */
export function BlockLoader({ blocks = DEFAULT_BLOCKS, title = 'Opening your academy…', caption, surface = '#FAFAF7', duration = 6, height = 400, style }) {
  const step = 0.14 * duration;
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, fontFamily: 'var(--font-sans)', ...style }}>
    <div role="img" aria-label="Loading" style={{ width: '100%', height, borderRadius: 10, background: surface, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 8, paddingBottom: 60, boxSizing: 'border-box', overflow: 'hidden' }}>
      {blocks.map((b, i) => <div key={i} data-cio-anim style={{ position: 'relative', zIndex: i + 1, width: b.width, maxWidth: '86%', height: 64, boxSizing: 'border-box', borderRadius: 10, background: b.bg, color: b.fg, padding: '14px 18px 0', display: 'flex', flexDirection: 'column', gap: 2, animation: `cio-ld-drop ${duration}s linear infinite both`, animationDelay: `${i * step - 0.02 * duration}s` }}>
        <span aria-hidden="true" style={notch(surface)}/>{i > 0 && <span aria-hidden="true" style={tab(b.bg)}/>}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: b.label }}>{b.kind}</span>
        <b style={{ fontSize: 15, fontWeight: 600 }}>{b.title}</b>
      </div>)}
    </div>
    {(title || caption) && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
      {title && <b style={{ fontSize: 20, letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>{title}</b>}
      {caption && <span style={{ fontSize: 15, color: 'var(--ink-500)' }}>{caption}</span>}
    </div>}
  </div>;
}
/** 02 · Compact — three wordless blocks; panels, modals, small screens. */
export function CompactLoader({ size = 'md', surface = '#FAFAF7', colors = ['var(--sand-200)', 'var(--blue-300)', 'var(--blue-700)'], framed = true, style }) {
  const s = size === 'sm' ? 0.6 : 1;
  const w = 84 * s, h = 26 * s;
  return <div role="img" aria-label="Loading" style={{ width: framed ? 132 * s : undefined, minHeight: framed ? 96 * s : undefined, borderRadius: 10, background: framed ? surface : 'transparent', display: 'inline-flex', flexDirection: 'column-reverse', alignItems: 'center', justifyContent: 'center', gap: 5 * s, ...style }}>
    {colors.map((c, i) => <div key={i} data-cio-anim style={{ position: 'relative', zIndex: i + 1, width: w, height: h, borderRadius: 6 * s, background: c, animation: 'cio-ld-drop-sm 2.4s linear infinite both', animationDelay: `${i * 0.432}s` }}>
      <span aria-hidden="true" style={notch(surface, 14 * s, 22 * s, 6 * s, 5 * s)}/>
      {i > 0 && <span aria-hidden="true" style={tab(c, 16 * s, 18 * s, 11 * s, 4 * s)}/>}
    </div>)}
  </div>;
}
/** 04 · Button glyph — three tiny bars stack inside a busy button (replaces a spinner). */
export function BlockGlyph({ color = '#FFFFFF', bg = 'var(--blue-700)', size = 18, style }) {
  const bars = [`color-mix(in srgb, ${color} 55%, transparent)`, 'var(--blue-300)', color];
  const bh = size * 5 / 18;
  return <span aria-hidden="true" style={{ display: 'inline-flex', flexDirection: 'column-reverse', gap: size / 9, width: size, height: size * 19 / 18, justifyContent: 'flex-start', flexShrink: 0, ...style }}>
    {bars.map((c, i) => <span key={i} data-cio-anim style={{ position: 'relative', display: 'block', width: size, height: bh, borderRadius: 1.5, background: c, animation: 'cio-ld-drop-xs 1.8s linear infinite both', animationDelay: `${i * 0.36}s` }}>
      <span style={{ position: 'absolute', left: size * 4 / 18, top: 0, width: size * 5 / 18, height: 1.5, background: bg }}/>
    </span>)}
  </span>;
}
/** 03 · Inline — file import with a filling bar. */
export function ImportProgress({ title = 'Importing 1,000 learners…', file = 'learners.csv', badge = 'CSV', value, style }) {
  const det = typeof value === 'number';
  return <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'var(--font-sans)', ...style }}>
    <span style={{ width: 34, height: 40, borderRadius: 6, background: '#FFFFFF', border: '1px solid rgba(23,20,15,0.12)', position: 'relative', flexShrink: 0 }}><span style={{ position: 'absolute', right: -8, bottom: 5, background: '#1D9A54', color: '#FFFFFF', fontSize: 8.5, fontWeight: 700, borderRadius: 3, padding: '1px 4px' }}>{badge}</span></span>
    <span style={{ display: 'flex', flexDirection: 'column', gap: 8, flexGrow: 1, minWidth: 0 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15 }}><b style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{title}</b><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-500)' }}>{file}</span></span>
      <span style={{ height: 6, borderRadius: 3, background: '#E8ECF7', overflow: 'hidden' }}><span data-cio-anim={det ? undefined : true} style={{ display: 'block', height: '100%', width: det ? value + '%' : '100%', background: 'var(--blue-700)', transformOrigin: 'left', animation: det ? undefined : 'cio-ld-bar 3.2s ease-in-out infinite', transition: 'width 300ms' }}/></span>
    </span>
  </div>;
}
/** 05 · Block skeleton — notch-card placeholder with shimmering lines. */
export function BlockSkeleton({ lines = [90, 220], height = 84, surface = '#FFFFFF', style }) {
  return <div style={{ position: 'relative', height, background: 'var(--sand-200)', borderRadius: 10, padding: '20px 18px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
    <span aria-hidden="true" style={notch(surface)}/>
    {lines.map((w, i) => <span key={i} data-cio-anim style={{ width: w, maxWidth: '100%', height: i === 0 ? 8 : 12, borderRadius: 4, background: '#DCD6CA', animation: 'cio-ld-shim 1.6s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}/>)}
  </div>;
}
/** 06 · Agent drafting — prompt types out, draft blocks rise underneath. */
export function AgentDrafting({ prompt = 'Drafting a course from setup-guide.pdf', blocks = [['LESSON', 'Getting started', 'var(--sand-200)'], ['LESSON', 'Invite your team', 'var(--blue-100)'], ['QUIZ', 'Setup check', 'var(--sand-200)']], surface = '#FFFFFF', style }) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => { let t; const run = (i) => { setN(i); t = setTimeout(() => run(i >= prompt.length ? 0 : i + 1), i >= prompt.length ? 3200 : 55); }; run(0); return () => clearTimeout(t); }, [prompt]);
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'var(--font-sans)', ...style }}>
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(23,20,15,0.10)', borderRadius: 12, boxShadow: '0 18px 40px -22px rgba(2,51,189,0.45)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink-900)' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="var(--blue-700)"/></svg>
      <span>{prompt.slice(0, n)}</span><span data-cio-anim style={{ width: 2, height: 16, background: 'var(--blue-700)', animation: 'cio-caret 0.9s steps(2) infinite' }}/>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${blocks.length}, minmax(0,1fr))`, gap: 10 }}>
      {blocks.map(([k, t, bg], i) => <div key={i} data-cio-anim style={{ position: 'relative', height: 54, background: bg, borderRadius: 10, padding: '14px 14px 0', boxSizing: 'border-box', animation: 'cio-ld-rise 6s ease infinite both', animationDelay: `${i * 0.4}s` }}>
        <span aria-hidden="true" style={notch(surface, 18)}/>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', color: 'var(--blue-700)' }}>{k}</span>
        <b style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{t}</b>
      </div>)}
    </div>
  </div>;
}