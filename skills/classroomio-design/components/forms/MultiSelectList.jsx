import React from 'react';
import { Ic, FONT, useInteract, focusStyle } from './uiShared.jsx';
import { Checkbox } from './Checkbox.jsx';
function SearchBox({ placeholder, value, onChange }) {
  const { focus, bind } = useInteract();
  return <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', maxWidth: 384, height: 36, boxSizing: 'border-box', borderRadius: 'var(--ui-radius-md)', border: '1px solid var(--ui-input)', background: 'var(--ui-background)', boxShadow: 'var(--ui-shadow-xs)', ...focusStyle(focus) }}>
    <span style={{ display: 'flex', padding: '0 8px 0 12px', color: 'var(--ui-muted-foreground)' }}>{Ic('search', 16)}</span>
    <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} {...bind} style={{ flex: 1, minWidth: 0, height: '100%', border: 0, outline: 'none', background: 'transparent', fontFamily: FONT, fontSize: 14, color: 'var(--ui-foreground)' }}/>
    {value && <button type="button" aria-label="Clear search" onClick={() => onChange('')} style={{ display: 'flex', margin: '0 6px', padding: 4, border: 0, borderRadius: 'var(--ui-radius-sm)', background: 'transparent', color: 'var(--ui-muted-foreground)', cursor: 'pointer' }}>{Ic('x', 16)}</button>}
  </div>;
}
function Row({ item, selected, onToggle }) {
  const [hover, setHover] = React.useState(false);
  return <div role="button" tabIndex={0} aria-pressed={selected} onClick={onToggle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
    style={{ display: 'inline-flex', width: '100%', alignItems: 'center', boxSizing: 'border-box', padding: 8, borderRadius: 'var(--ui-radius-md)', background: hover ? 'var(--ui-muted)' : 'transparent', textAlign: 'left', cursor: 'pointer', outline: 'none' }}>
    <Checkbox checked={selected} style={{ pointerEvents: 'none' }} onChange={() => {}}/>
    <span style={{ marginLeft: 8, fontSize: 14 }}>{item.label || item.id}</span>
    {item.description && <p style={{ margin: '0 0 0 8px', fontSize: 14, color: 'var(--ui-muted-foreground)' }}>{item.description}</p>}
  </div>;
}
export function MultiSelectList({ heading = '', headingSlot, emptyMessage, items = [], isLoading = false, isSelected, selected, onToggle, searchPlaceholder = '', searchValue, defaultSearchValue = '', onSearchValueChange, maxHeight = 240, style }) {
  const [innerSearch, setInnerSearch] = React.useState(defaultSearchValue);
  const search = searchValue !== undefined ? searchValue : innerSearch;
  const setSearch = (v) => { setInnerSearch(v); onSearchValueChange && onSearchValueChange(v); };
  const picked = (id) => isSelected ? isSelected(id) : !!selected && selected.includes(id);
  const hasHeading = heading || headingSlot;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-md)', fontFamily: FONT, color: 'var(--ui-foreground)', ...style }}>
    {(hasHeading || searchPlaceholder) && <div style={{ display: 'flex', alignItems: 'center', justifyContent: hasHeading ? 'space-between' : 'flex-end', gap: 12, padding: 8, borderBottom: '1px solid var(--ui-border)' }}>
      {heading ? <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{heading} ({items.length})</p> : headingSlot}
      {searchPlaceholder && <SearchBox placeholder={searchPlaceholder} value={search} onChange={setSearch}/>}
    </div>}
    {isLoading
      ? <div style={{ display: 'flex', minHeight: 160, alignItems: 'center', justifyContent: 'center', padding: '0 8px 8px', color: 'var(--ui-muted-foreground)' }}>{Ic('loader', 20, { animation: 'ui-spin 1s linear infinite' })}</div>
      : items.length === 0
        ? <p style={{ margin: 0, padding: '0 8px 8px', fontSize: 14, color: 'var(--ui-muted-foreground)' }}>{emptyMessage}</p>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight, overflowY: 'auto', padding: '0 8px 8px' }}>
          {items.map((item) => <Row key={item.id} item={item} selected={picked(item.id)} onToggle={() => onToggle && onToggle(item.id)}/>)}
        </div>}
  </div>;
}
