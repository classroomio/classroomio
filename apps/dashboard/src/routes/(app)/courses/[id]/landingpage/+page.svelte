<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { Component } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { courseApi } from '$features/course/api';
  import type { Course } from '$features/course/utils/types';
  import { setLandingPageEditContext, type LandingSectionKey } from '@cio/ui/custom/org-landing-page';
  import {
    HeaderIcon,
    GoalIcon,
    LessonIcon,
    ExerciseIcon,
    CertificateIcon,
    MoneyIcon,
    ReviewIcon,
    PersonIcon,
    ContentIcon
  } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';

  import { CourseLandingPage } from '$features/ui';
  import Editor from '$features/ui/course-landing-page/components/editor/editor.svelte';
  import * as Sidebar from '@cio/ui/base/sidebar';

  let { data } = $props();

  const courseId = $derived(data.courseId);

  let sidebarOpen = $state(true);
  let selectedSectionKey = $state<LandingSectionKey | null>(null);

  const sectionIcons: Partial<Record<LandingSectionKey, Component>> = {
    header: HeaderIcon,
    requirement: ExerciseIcon,
    description: LessonIcon,
    goals: GoalIcon,
    certificate: CertificateIcon,
    curriculum: ContentIcon,
    chips: ContentIcon,
    instructor: PersonIcon,
    reviews: ReviewIcon,
    pricing: MoneyIcon
  };

  setLandingPageEditContext({
    selectedKey: () => selectedSectionKey,
    selectKey: (key) => (selectedSectionKey = key),
    labelFor: (key) => t.get(`course.navItem.landing_page.editor.title.${key}` as never) || key,
    iconFor: (key) => sectionIcons[key] ?? HeaderIcon
  });

  function syncCourseStore(_courseData: Course) {
    if (courseApi.course) {
      courseApi.course = { ...courseApi.course, ..._courseData };
    }
  }

  function handleClose() {
    goto(resolve(`/courses/${courseId}`, {}));
  }
</script>

{#if courseApi.course}
  <div
    class="fixed inset-0 z-250 h-screen w-screen bg-white"
    in:fly={{ y: 500, duration: 500 }}
    out:fly={{ y: 500, duration: 500 }}
  >
    <Sidebar.Provider bind:open={sidebarOpen} style="--sidebar-width: 360px; --sidebar-width-icon: 4rem">
      <Sidebar.Root side="left" collapsible="icon" class="h-full">
        <Editor
          {courseId}
          bind:course={courseApi.course}
          bind:selectedSectionKey
          {syncCourseStore}
          onClose={handleClose}
        />
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
