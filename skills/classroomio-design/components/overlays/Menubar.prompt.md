Application menubar (base/menubar): 36px bordered bar of triggers, each opening a 192px popover menu 8px below. Hovering a trigger while one is open switches menus; Escape and Left/Right arrows work. Items: shortcuts, checkbox (check indicator), radio (dot indicator), headings, separators, destructive, nested submenus on hover.
Source: packages/ui/src/base/menubar/*.svelte, folded into a data-driven API like DropdownMenu.
```jsx
<Menubar menus={[{label:'File',items:[{label:'New course',shortcut:'⌘N'},{separator:true},{label:'Share',items:[{label:'Copy link'}]}]},{label:'View',items:[{label:'Show sidebar',checked:true},{separator:true},{radioGroup:'d',radioValue:'cozy',radioSelected:'cozy',label:'Cozy'},{radioGroup:'d',radioValue:'compact',radioSelected:'cozy',label:'Compact'}]}]}/>
```
