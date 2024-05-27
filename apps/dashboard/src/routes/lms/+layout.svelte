<script>
  import LMSSideBar from '$lib/components/LMS/SideBar.svelte';
  import { popUp } from '$lib/components/Org/store';
  import { Popover } from 'carbon-components-svelte';
</script>

<div class="org-root w-full flex items-center justify-between">
  <LMSSideBar />
  <div class="org-slot bg-white dark:bg-black w-full">
    <slot />
  </div>
</div>
