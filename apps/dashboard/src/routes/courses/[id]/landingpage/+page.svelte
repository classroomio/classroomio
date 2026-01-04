<script lang="ts">
  import { fly } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { courseApi } from '$features/course/api';
  import type { Course } from '$features/course/utils/types';

  import { CourseLandingPage } from '$features/ui';
  import Editor from '$features/ui/course-landing-page/components/editor/editor.svelte';
  import * as Sidebar from '@cio/ui/base/sidebar';

  let { data } = $props();

  const courseId = $derived(data.courseId);

  let sidebarOpen = $state(true);

  function syncCourseStore(_courseData: Course) {
    if (courseApi.course) {
      courseApi.course = { ...courseApi.course, ..._courseData };
    }
  }

  function handleClose() {
    goto(`/courses/${courseId}`);
  }
</script>

{#if courseApi.course}
  <div
    class="fixed inset-0 z-50 h-screen w-screen bg-white"
    in:fly={{ y: 500, duration: 500 }}
    out:fly={{ y: 500, duration: 500 }}
  >
    <Sidebar.Provider bind:open={sidebarOpen}>
      <Sidebar.Root side="left" collapsible="icon" class="h-full {sidebarOpen ? 'w-[280px]!' : 'w-0'}">
        <Editor {courseId} bind:course={courseApi.course} {syncCourseStore} onClose={handleClose} />
      </Sidebar.Root>
      <Sidebar.Inset class="relative h-screen! overflow-y-auto">
        <div class="absolute top-2 left-2 z-60">
          <Sidebar.Trigger variant="secondary" />
        </div>
        <CourseLandingPage bind:courseData={courseApi.course} editMode={true} />
      </Sidebar.Inset>
    </Sidebar.Provider>
  </div>
{/if}
