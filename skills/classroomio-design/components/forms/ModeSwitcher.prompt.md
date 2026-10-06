Theme toggle (base/dark-mode, mode-watcher): 36px outline icon button with sun/moon rotate-scale swap and a Light / Dark / System dropdown aligned to the end. Toggles the `dark` class on <html> and reports via `onModeChange`.
```jsx
<ModeSwitcher defaultMode="system" onModeChange={(m) => save(m)} />
```
