<script lang="ts">
  import LMSSideBar from '$lib/components/LMS/SideBar.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="org-root flex w-full items-center justify-between">
  <LMSSideBar />
  <div class="org-slot w-full bg-white dark:bg-black">
    {@render children?.()}
  </div>
</div>
