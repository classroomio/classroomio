Selectable card with title, description and a trailing checkbox; selected = primary border and 5% primary tint. Maps to `custom/checkbox-option-card` (card + group). Group value is an array of option values; `columns` replaces the Svelte grid class override. Slots: titleSuffix, leading, footer (functions of the option in the group).
```jsx
<CheckboxOptionCardGroup columns={2} defaultValue={['certificates']} options={[
  { id: 'certificates', title: 'Certificates', description: 'Issue completion certificates.', value: 'certificates' },
  { id: 'live', title: 'Live classes', description: 'Host real-time lessons.', value: 'live' },
]} />
```
