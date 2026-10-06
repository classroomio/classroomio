Sonner toasts (base/sonner, svelte-sonner): 356px card, 16px padding, 8px radius, lg shadow, hover close button, action in primary, cancel in muted. `Toast` is the static item (use for previews); `Toaster` + `toast()` is the live stack.
```jsx
<Toast type="success" title="Profile updated" description="Changes saved." closeButton />
<Toaster position="bottom-right" /> {/* then */ toast.success('Saved')}
```
