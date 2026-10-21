Site navigation bar (base/navigation-menu): 36px triggers with a 12px chevron that flips when open, hover opens after 200ms (instant once one is open), close after 300ms, click toggles, Escape and outside click close. Panel sits 6px below as a popover viewport; `NavigationMenuLink` is the 8px-padded link row for panel content.
Source: packages/ui/src/base/navigation-menu/*.svelte, folded into a data-driven `items` API.
```jsx
<NavigationMenu items={[{value:'learn',label:'Learn',content:<div style={{width:240,padding:8}}><NavigationMenuLink href="#">Courses</NavigationMenuLink><NavigationMenuLink href="#">Cohorts</NavigationMenuLink></div>},{value:'pricing',label:'Pricing',href:'#'}]}/>
```
