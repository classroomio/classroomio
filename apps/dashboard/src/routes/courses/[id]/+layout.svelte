<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { CourseSidebar } from '$lib/features/ui/sidebar/course-sidebar/index.js';
  import { AppHeader } from '$lib/features/ui';

  interface Props {
    children?: import('svelte').Snippet;
    path: string;
  }

  let { children, path }: Props = $props();
</script>

<Sidebar.Provider>
  <CourseSidebar {path} />

  <Sidebar.Inset>
    <AppHeader />

    <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 overflow-y-auto px-4">
      {@render children?.()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
