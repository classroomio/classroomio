Square icon-only Button (default variant secondary, size icon) with optional tooltip and keyboard shortcut chips (custom/icon-button).
```jsx
<IconButton tooltip="Add content" shortcut={['Ctrl', 'Shift', 'N']}>{Ic('plus')}</IconButton>
```
Use Ic from ../forms/uiShared.jsx for the glyph; icons only render if present in PATHS.
