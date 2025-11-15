<script lang="ts">
  import AppSidebar from './components/app-sidebar.svelte';
  import * as Sidebar from '@cio/ui/base/sidebar';

  let { data } = $props();
</script>

<Sidebar.Provider class="flex w-fit items-start gap-4">
  <AppSidebar sidebarData={data} />

  <Sidebar.Inset class="hidden md:block">
    <Sidebar.Trigger class="-ml-1" />
  </Sidebar.Inset>
</Sidebar.Provider>
