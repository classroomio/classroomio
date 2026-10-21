Row layout for resource lists (courses, students, files). Ports `custom/resource-list-row` (Group, Root, Lead, Main, End) built on Item: no-wrap flex row, bottom rule between rows, hover wash of muted/50, default size sm and variant outline. `ResourceListGroup` supplies the outer border and marks the last row.
```jsx
<ResourceListGroup>
  <ResourceListRow align="start"><ResourceListRowLead><Avatar/></ResourceListRowLead><ResourceListRowMain><b>React course</b><span>12 lessons</span></ResourceListRowMain><ResourceListRowEnd><Badge variant="success">Published</Badge></ResourceListRowEnd></ResourceListRow>
</ResourceListGroup>
```
