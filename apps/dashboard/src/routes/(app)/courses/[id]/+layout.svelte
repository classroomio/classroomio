<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Empty } from '@cio/ui/custom/empty';
  import { Spinner } from '@cio/ui/base/spinner';
  import { CourseSidebar } from '$features/course/components/sidebar';
  import { CourseHeader } from '$features/course/components';
  import type { Course } from '$features/course/types';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Confetti } from '$features/ui';
  import { courseApi } from '$features/course/api';
  import ContentCreateModal from '$features/course/components/content/content-create-modal.svelte';
  import CourseCompletionModal from '$features/course/components/ceritficate/course-completion-modal.svelte';
  import { aiAssistantPanelDefinition, ContentAskAiBar, AI_ASSISTANT_PANEL_ID } from '$features/ai-assistant';
  import {
    getContentAskAiBarWidthClass,
    isCourseContentLockedForStudent
  } from '$features/ai-assistant/utils/content-ask-ai-bar';
  import { initialChatPrompt, openAiAssistant } from '$features/ai-assistant/utils/store';
  import { sidePanel, SidePanelRail } from '$features/side-panel';
  import { transcriptPanelDefinition } from '$features/course/components/lesson/video/transcript-panel-definition';
  import { lessonNotePanelDefinition } from '$features/notes/panel';
  import { get } from 'svelte/store';
  import { page } from '$app/state';
  import { profile } from '$lib/utils/store/user';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { ContentType } from '@cio/utils/constants/content';
  import type { CourseMember } from '$features/course/utils/types';
  import {
    COURSE_SIDEBAR_DEFAULT_WIDTH,
    COURSE_SIDEBAR_MAX_WIDTH,
    COURSE_SIDEBAR_MIN_WIDTH,
    COURSE_SIDEBAR_STORAGE_KEY
  } from '$features/course/components/sidebar/constants';

  sidePanel.register(aiAssistantPanelDefinition);
  sidePanel.register(transcriptPanelDefinition);
  sidePanel.register(lessonNotePanelDefinition);

  interface Props {
    children?: import('svelte').Snippet;
    path: string;
    data: {
      course?: Course;
      courseId: string;
      exerciseId?: string;
    };
  }

  let { children, path, data }: Props = $props();
  let sidebarWidth = $state(COURSE_SIDEBAR_DEFAULT_WIDTH);
  let hasLoadedSidebarWidth = $state(false);
  let sidebarProviderElement = $state<HTMLDivElement | null>(null);

  // Initialize course store on the client (fetch once, then reuse store data).
  $effect(() => {
    if (!data.courseId || !$profile.id) return;

    if (data.course) {
      courseApi.setCourse(data.course, $profile.id);
      return;
    }

    courseApi.ensureCourse(data.courseId, $profile.id);
  });

  const isCourseReady = $derived.by(() => {
    return courseApi.course?.id === data.courseId && !!courseApi.group.id;
  });

  const user: CourseMember | undefined = $derived(
    courseApi.group.people.find((person) => person.profileId === $profile.id)
  );
  const canCheck = $derived(!!$profile.id && isCourseReady);

  const isPermitted = $derived.by(() => {
    if (!isCourseReady) return false;
    if (!canCheck) return true;

    if ($isOrgAdmin === null) return true;

    return $isOrgAdmin || user;
  });

  const isExercisePage = $derived(!!data.exerciseId);

  const lessonId = $derived(page.params.lessonId as string | undefined);
  const exerciseId = $derived((page.params.exerciseId as string | undefined) ?? data.exerciseId);
  const isLessonOrExercisePage = $derived(Boolean(lessonId || exerciseId));
  const isLessonEditMode = $derived(page.url.searchParams.get('mode') === 'edit');

  const contentAskAiWidthClass = $derived(getContentAskAiBarWidthClass({ lessonId, isLessonEditMode }));

  const isContentLockedForStudent = $derived(
    isCourseContentLockedForStudent(
      courseApi.course,
      lessonId ?? exerciseId,
      lessonId ? ContentType.Lesson : exerciseId ? ContentType.Exercise : null
    )
  );

  const showContentAskAiBar = $derived(
    isCourseReady &&
      isLessonOrExercisePage &&
      !($isOrgStudent && isContentLockedForStudent) &&
      sidePanel.activePanelId !== AI_ASSISTANT_PANEL_ID
  );

  function clampSidebarWidth(width: number) {
    return Math.min(COURSE_SIDEBAR_MAX_WIDTH, Math.max(COURSE_SIDEBAR_MIN_WIDTH, width));
  }

  function handleSidebarWidthChange(width: number) {
    sidebarWidth = clampSidebarWidth(width);
  }

  function handleSidebarWidthPreview(width: number) {
    const nextWidth = clampSidebarWidth(width);

    sidebarProviderElement?.style.setProperty('--sidebar-width', `${nextWidth}px`);
  }

  function handleSidePanelWidthPreview(width: number) {
    sidebarProviderElement?.style.setProperty('--side-panel-width', `${width}px`);
  }

  onMount(() => {
    try {
      const storedWidth = Number(localStorage.getItem(COURSE_SIDEBAR_STORAGE_KEY));

      if (Number.isFinite(storedWidth)) {
        sidebarWidth = clampSidebarWidth(storedWidth);
      }
    } catch {
      // localStorage unavailable
    }

    hasLoadedSidebarWidth = true;

    if (get(initialChatPrompt)) {
      openAiAssistant();
    }
  });

  $effect(() => {
    if (!hasLoadedSidebarWidth) {
      return;
    }

    try {
      localStorage.setItem(COURSE_SIDEBAR_STORAGE_KEY, String(Math.round(sidebarWidth)));
    } catch {
      // localStorage unavailable
    }
  });
</script>

<svelte:head>
  <title>{courseApi.course?.title || 'ClassroomIO Course'}</title>
</svelte:head>

{#if isCourseReady}
  <Dialog.Root open={!isPermitted}>
    <Dialog.Content class="w-96">
      <Dialog.Header>
        <Dialog.Title>{$t('course.not_permitted.header')}</Dialog.Title>
      </Dialog.Header>
      <div>
        <p class="text-md text-center dark:text-white">
          {$t('course.not_permitted.body')}
        </p>

        <div class="mt-5 flex justify-center">
          <Button
            onclick={() => {
              goto('/org/*');
            }}
          >
            {$t('course.not_permitted.button')}
          </Button>
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Root>
{/if}

<Sidebar.Provider
  bind:ref={sidebarProviderElement}
  data-sveltekit-preload-data="off"
  style={`--sidebar-width: ${sidebarWidth}px; --side-panel-width: ${sidePanel.width}px;`}
>
  <CourseSidebar
    {path}
    id={data.courseId}
    {isCourseReady}
    {sidebarWidth}
    onSidebarWidthPreview={handleSidebarWidthPreview}
    onSidebarWidthChange={handleSidebarWidthChange}
  />

  <Sidebar.Inset class="ui:min-w-0 ui:flex-1">
    <CourseHeader />
    <ContentCreateModal />
    <CourseCompletionModal />

    {#if !isCourseReady}
      <div class="mx-auto flex h-[calc(100vh-56px)] w-full items-center justify-center">
        <Empty
          title="Loading course…"
          description="Please wait while we load your course data."
          icon={Spinner}
          iconClass="h-8 w-8"
          variant="page"
        />
      </div>
    {:else}
      {#if isExercisePage}
        <Confetti />
      {/if}

      {@render children?.()}

      {#if showContentAskAiBar}
        <ContentAskAiBar class={contentAskAiWidthClass} />
      {/if}
    {/if}
  </Sidebar.Inset>

  <SidePanelRail onWidthPreview={handleSidePanelWidthPreview} />
</Sidebar.Provider>
