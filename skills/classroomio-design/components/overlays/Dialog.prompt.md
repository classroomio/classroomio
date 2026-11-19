Modal (base/dialog): centred paper panel, 10px radius, 24px padding, 16px gap, lg shadow, ink 50% overlay, × close top-right. Title 18/600, description 14 muted, footer right-aligned.
```jsx
<Dialog open={open} onOpenChange={setOpen} title="Delete course?" description="Learners lose access immediately."
  footer={<><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button variant="destructive">Delete</Button></>} />
```