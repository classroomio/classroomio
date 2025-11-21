<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger
  } from '@cio/ui/base/sidebar';

  const { Story } = defineMeta({
    title: 'Molecules/Sidebar',
    component: Sidebar,
    parameters: {
      layout: 'fullscreen'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <h2 class="px-4 text-lg font-semibold">My App</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <span>Projects</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <p class="text-muted-foreground px-4 text-sm">© 2024 My App</p>
        </SidebarFooter>
      </Sidebar>
      <main class="flex-1 p-4">
        <SidebarTrigger />
        <div class="mt-4">
          <h1 class="text-2xl font-bold">Main Content</h1>
          <p class="mt-2">This is the main content area.</p>
        </div>
      </main>
    </SidebarProvider>
  {/snippet}
</Story>
