import React from 'react';
import { Logo } from '../core/Logo.jsx';
import { Icon } from '../core/Icon.jsx';
import { ProductMenu } from './ProductMenu.jsx';
export function Nav({ links = ['Resources', 'Customers', 'About Us', 'Pricing'], active, cta = 'Start your academy', onNavigate, defaultOpen = false, style }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const go = (p) => (e) => { e.preventDefault(); setOpen(false); onNavigate && onNavigate(p); };
  return <nav style={{ height: 84, padding: '0 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10, fontFamily: 'var(--font-sans)', ...style }}>
    <a href="#" onClick={go('home')} style={{ color: 'var(--ink-900)' }}><Logo /></a>
    <div style={{ display: 'flex', alignItems: 'center', gap: 34, fontSize: 16 }}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={{ border: 0, background: 'transparent', fontFamily: 'inherit', fontSize: 16, color: open ? 'var(--blue-700)' : 'var(--ink-900)', fontWeight: open ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '10px 0' }}>Product <Icon name="chevronDown" size={14} strokeWidth={2.2} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }}/></button>
      {links.map(l => <a key={l} href="#" onClick={go(l)} style={{ color: active === l ? 'var(--blue-700)' : 'var(--ink-900)', fontWeight: active === l ? 600 : 400 }}>{l}</a>)}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 16 }}>
      <a href="#">Log in</a>
      <a href="#" style={{ display: 'inline-flex', alignItems: 'center', height: 36, boxSizing: 'border-box', background: 'var(--blue-700)', color: '#FFFFFF', borderRadius: 8, padding: '0 16px', fontSize: 14, fontWeight: 500 }}>{cta}</a>
    </div>
    {open && <div style={{ position: 'absolute', top: 70, left: 170, zIndex: 20 }}><ProductMenu onSelect={(it) => { setOpen(false); onNavigate && onNavigate(it.title); }}/></div>}
  </nav>;
}