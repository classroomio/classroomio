Command palette (base/command): searchable list on a popover surface, 36px input row with search icon, 300px scroll list, groups with 12px muted headings, accent-highlighted selected item, trailing shortcuts. Filters as you type; Arrow/Home/End move, Enter selects. `CommandDialog` wraps it in Dialog with the larger 48px input and 12px item padding.
Source: packages/ui/src/base/command/*.svelte (Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut, CommandDialog). LinkItem and Loading are not ported.
```jsx
<Command style={{ width: 360, height: 'auto' }}><CommandInput placeholder="Type a command..."/><CommandList><CommandEmpty>No results found.</CommandEmpty><CommandGroup heading="Suggestions"><CommandItem>Create course<CommandShortcut>⌘N</CommandShortcut></CommandItem><CommandItem>Invite student</CommandItem></CommandGroup></CommandList></Command>
```
