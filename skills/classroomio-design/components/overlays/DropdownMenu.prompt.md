Action menu (base/dropdown-menu): 4px-padded paper panel, 14px items with muted icons, sand hover, shortcuts right, destructive variant red, separators bleed edge-to-edge.
```jsx
<DropdownMenu align="end" trigger={<Button variant="ghost" size="icon">⋯</Button>} items={[{heading:'Course'},{label:'Edit',shortcut:'⌘E'},{label:'Duplicate'},{separator:true},{label:'Delete',variant:'destructive'}]}/>
```