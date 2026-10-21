App sidebar (base/sidebar): 16rem panel, 3rem icon rail, offcanvas/icon/none collapse, sidebar/floating/inset variants, Cmd/Ctrl+B toggle. Compound parts share state through `SidebarProvider`. Active menu button = primary at 10% with primary text; sidebar tokens map to sand muted bg, secondary hover, border.
Source: packages/ui/src/base/sidebar/*.svelte. Mobile Sheet mode is not reproduced; use `inline` to keep it in flow inside a card or frame, and give `SidebarProvider` a height (`style={{ height: '100%' }}`) inside a sized container.
```jsx
<SidebarProvider><Sidebar collapsible="icon" inline><SidebarContent><SidebarGroup><SidebarGroupLabel>Teach</SidebarGroupLabel><SidebarMenu><SidebarMenuItem><SidebarMenuButton isActive tooltip="Courses">{Ic('inbox')}<span>Courses</span></SidebarMenuButton><SidebarMenuBadge>12</SidebarMenuBadge></SidebarMenuItem></SidebarMenu></SidebarGroup></SidebarContent></Sidebar><SidebarInset><SidebarTrigger/></SidebarInset></SidebarProvider>
```
