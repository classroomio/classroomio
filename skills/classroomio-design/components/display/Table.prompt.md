Plain data table (base/table): 40px header row, 8px cells, sand row dividers, muted-50% hover, muted fill when selected.
```jsx
<Table columns={[{key:'name',header:'Learner'},{key:'progress',header:'Progress',render:r=><Progress value={r.progress}/>}]} rows={rows}/>
```