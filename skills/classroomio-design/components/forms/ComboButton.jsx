import React from 'react';
import { Ic } from './uiShared.jsx';
import { Button } from './Button.jsx';
import { DropdownMenu } from '../overlays/DropdownMenu.jsx';
export function ComboButton({ label, menuLabel, items = [], icon, variant = 'outline', size = 'sm', disabled = false, loading = false, align = 'end', onSelect, style }) {
  const iconSize = size === 'lg' ? 18 : 16;
  const triggerSize = size === 'sm' ? 'icon-sm' : 'icon';
  const menuItems = items.map((it) => ({
    icon: it.icon,
    disabled: it.disabled,
    variant: it.destructive ? 'destructive' : undefined,
    onSelect: it.onSelect,
    label: <span style={{ display: 'flex', flexDirection: 'column' }}>
      <span>{it.label}</span>
      {it.description && <span style={{ fontSize: 12, color: 'var(--ui-muted-foreground)' }}>{it.description}</span>}
    </span>,
  }));
  return <div role="group" style={{ display: 'flex', width: 'fit-content', alignItems: 'stretch', ...style }}>
    <Button variant={variant} size={size} disabled={disabled} loading={loading} onClick={onSelect} style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
      {icon && !loading && <span style={{ display: 'flex' }}>{icon}</span>}
      {label}
    </Button>
    <DropdownMenu align={align} minWidth={224} items={menuItems}
      trigger={<Button variant={variant} size={triggerSize} disabled={disabled || loading} aria-label={menuLabel} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 }}>{Ic('chevronDown', iconSize)}</Button>}/>
  </div>;
}
