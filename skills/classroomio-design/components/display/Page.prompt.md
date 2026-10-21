Dashboard page shell as a compound component: `Page.Root`, `Header`, `HeaderContent`, `Title`, `Subtitle`, `Action`, `Body`, `BodyHeader`, `FloatingBar`, `SettingsActions`.
Source: `packages/ui/src/base/page/*`. `SettingsActions` (sticky dark save bar, only when `hasChanges`) must be the last child of `Page.Root`, never in the header.
```jsx
<Page.Root>
  <Page.Header><Page.HeaderContent><Page.Title>Settings</Page.Title><Page.Subtitle>Manage your org</Page.Subtitle></Page.HeaderContent><Page.Action><Button size="sm">Invite</Button></Page.Action></Page.Header>
  <Page.Body>…</Page.Body>
  <Page.SettingsActions hasChanges statusLabel="Unsaved changes" discardLabel="Discard" saveLabel="Save changes" onSave={save} onDiscard={reset}/>
</Page.Root>
```
