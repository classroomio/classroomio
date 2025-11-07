<script lang="ts">
  import AppSidebar from './components/app-sidebar.svelte';
  import * as Sidebar from '@cio/ui/base/sidebar';

  let { data } = $props();
</script>

<Sidebar.Provider class="w-fit">
  <AppSidebar sidebarData={data} />
  <Sidebar.Inset>
    <Sidebar.Trigger class="-ml-1" />
  </Sidebar.Inset>
</Sidebar.Provider>
