Single-choice cards (title, description, trailing radio; selected = primary border and tint). Maps to `custom/radio-option-card` (card + group, default 2 columns) and `custom/radio-item` (plain radio row with optional editable label, exported as `RadioItem`). Cards and items inside `RadioOptionCardGroup` share its value; Enter confirms or submits the form.
```jsx
<RadioOptionCardGroup defaultValue="live-class" options={[
  { id: 'live-class', title: 'Live Class', description: 'Schedule live sessions.', value: 'live-class' },
  { id: 'self-paced', title: 'Self-Paced', description: 'Students go at their own speed.', value: 'self-paced' },
]} />
```
