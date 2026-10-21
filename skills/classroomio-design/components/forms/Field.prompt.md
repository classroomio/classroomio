Form row wrapper (FieldLabel/FieldDescription/FieldError collapsed into props). Vertical stack with 12px gap, or horizontal for checkbox/switch rows.
```jsx
<Field label="Course title" htmlFor="t" required description="Shown to learners." error={err}><Input id="t"/></Field>
<Field orientation="horizontal" label="Allow comments"><Switch/></Field>
```