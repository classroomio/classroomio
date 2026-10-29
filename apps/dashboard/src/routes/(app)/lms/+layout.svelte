<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { LmsHeader } from '$features/ui';
  import { LMSSidebar } from '$features/ui/sidebar/lms-sidebar';
  import { PluginSlotRenderer } from '$features/plugins/components';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="flex h-svh flex-col overflow-hidden">
  <PluginSlotRenderer target="lms.banner" className="w-full shrink-0 gap-0!" />

  <Sidebar.Provider class="min-h-0 flex-1 overflow-hidden">
    <LMSSidebar />

    <Sidebar.Inset class="overflow-y-auto">
      <LmsHeader />

      <div class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4">
        {@render children?.()}
      </div>
    </Sidebar.Inset>
  </Sidebar.Provider>
</div>
