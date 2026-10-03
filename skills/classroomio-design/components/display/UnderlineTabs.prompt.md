Underline tabs (custom/underline-tabs): full-width 36px row with a bottom border, 2px primary bar under the active tab, primary-tinted hover pill. Same data API as `Tabs`.
Source: `packages/ui/src/custom/underline-tabs/*` (Root/List/Trigger/Content collapsed into a `tabs` array). Arrow keys move between enabled tabs.
```jsx
<UnderlineTabs tabs={[{value:'note',label:'Note',content:…},{value:'slides',label:'Slides'},{value:'video',label:'Video',disabled:true}]}/>
```
