<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { CourseSidebar } from '$features/course/components/sidebar';
  import { CourseHeader } from '$features/course/components';
  import * as Page from '@cio/ui/base/page';

  interface Props {
    children?: import('svelte').Snippet;
    path: string;
  }

  let { children, path }: Props = $props();
</script>

<Sidebar.Provider>
  <CourseSidebar {path} />

  <Sidebar.Inset
    class="w-[calc(100vw-var(--sidebar-width))] overflow-x-hidden group-data-[collapsible=icon]:w-[calc(100vw-var(--sidebar-width-icon))]"
  >
    <CourseHeader />

    <Page.Root class="mx-auto flex px-4 lg:max-w-6xl">
      {@render children?.()}
    </Page.Root>
  </Sidebar.Inset>
</Sidebar.Provider>
