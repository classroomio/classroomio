import React from 'react';
import { Ic } from './uiShared.jsx';
import { Button } from './Button.jsx';
import { DropdownMenu } from '../overlays/DropdownMenu.jsx';
const resolve = (m) => m === 'system' ? (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : m;
export function ModeSwitcher({ mode, defaultMode = 'light', onModeChange, defaultOpen = false }) {
  const [inner, setInner] = React.useState(defaultMode);
  const current = mode ?? inner;
  const dark = resolve(current) === 'dark';
  React.useEffect(() => { if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', dark); }, [dark]);
  const set = (m) => () => { setInner(m); onModeChange && onModeChange(m); };
  const glyph = { transition: 'all 150ms', position: 'absolute' };
  return <DropdownMenu align="end" defaultOpen={defaultOpen}
    trigger={<Button variant="outline" size="icon" aria-label="Toggle theme">
      <span style={{ ...glyph, display: 'flex', transform: dark ? 'rotate(-90deg) scale(0)' : 'none' }}>{Ic('sun', 19)}</span>
      <span style={{ ...glyph, display: 'flex', transform: dark ? 'none' : 'rotate(90deg) scale(0)' }}>{Ic('moon', 19)}</span>
    </Button>}
    items={[{ label: 'Light', onSelect: set('light') }, { label: 'Dark', onSelect: set('dark') }, { label: 'System', onSelect: set('system') }]} />;
}
