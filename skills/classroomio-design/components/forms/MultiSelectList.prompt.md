Bordered, scrollable checklist with optional "heading (count)" row, search box, loading spinner and empty message. Maps to `custom/multi-select-list` (rows are the `checkbox-field` button-row pattern). Selection is owned by the parent: pass `selected` ids (or `isSelected`) and handle `onToggle`. It does not filter items; filter them from `onSearchValueChange`.
```jsx
<MultiSelectList heading="Select items" emptyMessage="No items to show." selected={['a']} onToggle={toggle}
  items={[{ id: 'a', label: 'Introduction' }, { id: 'b', label: 'Core concepts' }]} searchPlaceholder="Search" />
```
