Interlocking notch-card accordion row: mono index, question, plus icon that rotates to ×. Stack with gap 8 and descending z.
```jsx
{qs.map((q,i)=><FAQItem key={i} index={i+1} z={qs.length-i} tab={i<qs.length-1} {...q}/>)}
```