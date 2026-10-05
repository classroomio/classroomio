Split button: a primary action joined to a chevron that opens a menu of alternatives. Maps to `custom/combo-button` (ButtonGroup + Button + DropdownMenu). Defaults: outline, sm, menu aligned end, 224px wide. Items support icon, description (muted line), disabled, destructive. Loading hides the icon and disables both halves.
```jsx
<ComboButton label="Export as CSV" menuLabel="More export formats" icon={Ic('inbox', 16)}
  items={[{ label: 'Export as PDF' }, { label: 'Delete permanently', destructive: true }]} />
```
