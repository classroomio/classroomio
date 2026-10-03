Branded loading states from the "Loading states" board: lesson blocks that drop, stack and clear. Use them instead of a generic spinner anywhere a wait is visible.
```jsx
<BlockLoader caption="Blocks drop into place one at a time, then clear and repeat." />   // 01 full page
<CompactLoader />            // 02 wordless: panels, modals, small screens
<ImportProgress value={40}/> // 03 inline, file imports
<Button loading>Publishing…</Button>  // 04 uses BlockGlyph automatically
<BlockSkeleton />            // 05 card placeholder
<AgentDrafting />            // 06 long AI jobs
```
**Where blocks go:** full-page loads and agent jobs = BlockLoader / AgentDrafting. Minor app UI (buttons, panels, table cells, modals) = BlockGlyph / CompactLoader size="sm". Plain `Skeleton` / `Spinner` stay available for dense data views. Always set `surface` to the colour behind the loader so the notches read as cut-outs. Honours prefers-reduced-motion.