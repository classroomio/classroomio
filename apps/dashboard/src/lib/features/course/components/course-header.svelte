<script lang="ts">
  import { Separator } from '@cio/ui/base/separator';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import * as ButtonGroup from '@cio/ui/base/button-group';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { Button } from '@cio/ui/base/button';
  import { Waves } from '@cio/ui/custom/animation';
  import { page } from '$app/state';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { isStudentExperience, isCourseLearnerView } from '$lib/utils/store/app';
  import { isMobileStore } from '@cio/ui/hooks/is-mobile.svelte';
  import { getCourseProgress } from '$features/course/utils/content';
  import { isCourseMobileBottomNavVisible } from '$features/course/utils/mobile-bottom-nav';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import { setupProgressApi } from '$features/setup/api/setup-progress.svelte';
  import { courseApi } from '$features/course/api';
  import { getActiveCourseNavKey } from '$features/course/utils/functions';
  import {
    AI_ASSISTANT_PANEL_ID,
    closeAiAssistant,
    openAiAssistantFloating,
    toggleAiAssistant
  } from '$features/ai-assistant/utils/store';
  import { AI_ASSISTANT_POPOUT_TIP_DISMISSED_KEY } from '$features/ai-assistant/utils/constants';
  import { IS_AI_ENABLED } from '$lib/utils/constants/ai';
  import { openCoursePreview } from '$features/course/utils/course-preview';
  import { t } from '$lib/utils/functions/translations';
  import { sidePanel } from '$features/side-panel';
  import { onMount } from 'svelte';
  import XIcon from '@lucide/svelte/icons/x';
  import PictureInPictureIcon from '@lucide/svelte/icons/picture-in-picture';
  import CourseProgressPopover from './course-progress-popover.svelte';
  import { Badge } from '@cio/ui/base/badge';
  import CoursePublishBadge from './course-publish-badge.svelte';
  import CoursePublicBadge from './course-public-badge.svelte';
  import CourseContextMenuContent from './course-context-menu-content.svelte';
  import ViewAsStudentModal from './view-as-student-modal.svelte';
  import ViewCourseSiteUnpublishedModal from './view-course-site-unpublished-modal.svelte';

  const siteName = $derived($currentOrg.siteName);
  const showCoursePublishBadge = $derived(!$isStudentExperience);
  const isPublicCourse = $derived(courseApi.course?.type === 'PUBLIC');
  const activeNavKey = $derived(getActiveCourseNavKey(page.url.pathname, courseApi.course?.id ?? ''));
  const isPublished = $derived(courseApi.course?.isPublished ?? false);
  const lessonId = $derived(page.params.lessonId as string | undefined);
  const exerciseId = $derived(page.params.exerciseId as string | undefined);
  const showMobileBottomNav = $derived(
    isCourseMobileBottomNavVisible({
      isCourseLearnerView: $isCourseLearnerView,
      isMobile: isMobileStore.current,
      isLessonOrExercisePage: Boolean(lessonId || exerciseId),
      courseProgress: getCourseProgress(courseApi.course)
    })
  );

  let viewAsStudentOpen = $state(false);
  let viewCourseSiteUnpublishedOpen = $state(false);
  let assistantTipDismissed = $state(true);

  const assistantOpen = $derived(sidePanel.activePanelId === AI_ASSISTANT_PANEL_ID);
  const assistantFloating = $derived(assistantOpen && sidePanel.isFloating);
  const showAssistantTip = $derived(
    IS_AI_ENABLED && assistantOpen && !assistantFloating && !assistantTipDismissed && !isMobileStore.current
  );

  onMount(() => {
    try {
      assistantTipDismissed = localStorage.getItem(AI_ASSISTANT_POPOUT_TIP_DISMISSED_KEY) === '1';
    } catch {
      assistantTipDismissed = true;
    }
  });

  function dismissAssistantTip() {
    assistantTipDismissed = true;

    try {
      localStorage.setItem(AI_ASSISTANT_POPOUT_TIP_DISMISSED_KEY, '1');
    } catch {
      // localStorage unavailable
    }
  }

  function handlePopOutClick() {
    dismissAssistantTip();

    if (assistantFloating) {
      closeAiAssistant();
      return;
    }

    openAiAssistantFloating();
  }

  $effect(() => {
    if (!siteName) return;

    setupProgressApi.fetchSetupProgress(siteName);
  });

  function handleViewCourseSite() {
    const course = courseApi.course;
    if (!course?.id) {
      return;
    }

    if (course.isTemplate) return;

    if (!isPublished) {
      viewCourseSiteUnpublishedOpen = true;
      return;
    }

    openCoursePreview({
      courseId: course.id,
      courseSlug: course.slug,
      currentOrgDomain: $currentOrgDomain
    });
  }
</script>

<header
  class="ui:border-border ui:bg-background ui:z-app-bar sticky top-0 flex h-12 w-full shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-8"
>
  <div class="flex w-full items-center gap-2 px-4">
    <Sidebar.Trigger />

    <div class="h-4 w-2">
      <Separator orientation="vertical" />
    </div>

    <div class="flex w-[60%] min-w-0 flex-1 flex-col justify-center gap-0.5">
      <div class="flex min-w-0 items-center gap-2">
        <p class="max-w-xs truncate text-sm font-medium">
          {activeNavKey ? $t(activeNavKey) : ''}
        </p>

        {#if isPublicCourse}
          <CoursePublicBadge class="shrink-0" />
        {/if}

        {#if courseApi.course?.isTemplate}
          <Badge variant="secondary">{$t('course_templates.editor.badge')}</Badge>
        {:else if showCoursePublishBadge}
          <CoursePublishBadge {isPublished} />
        {/if}
      </div>
    </div>

    <span class="grow"></span>

    {#if $isCourseLearnerView && !showMobileBottomNav}
      <CourseProgressPopover class="md:hidden" />
    {/if}

    {#if IS_AI_ENABLED}
      <div class="relative inline-flex">
        <div class="relative inline-flex rounded-md shadow-2xs">
          <div class="ui:bg-primary pointer-events-none absolute inset-0 overflow-hidden rounded-md">
            <Waves
              lineColor="rgba(255,255,255,0.55)"
              xGap={8}
              yGap={12}
              waveAmpX={18}
              waveAmpY={9}
              waveSpeedX={0.04}
              waveSpeedY={0.02}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onclick={toggleAiAssistant}
            aria-pressed={assistantOpen}
            data-testid="course-assistant-toggle"
            class="relative z-10 rounded-md bg-transparent px-3 text-white hover:bg-white/15 hover:text-white focus-visible:z-20 md:rounded-none md:rounded-l-md"
          >
            <SparklesIcon size={14} class="text-white" />
            <span class="text-white">{$t('course.navItems.nav_ai_assistant')}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onclick={handlePopOutClick}
            aria-label={assistantFloating
              ? t.get('course.header.assistant_close_floating')
              : t.get('course.header.assistant_pop_out')}
            aria-pressed={assistantFloating}
            title={assistantFloating
              ? t.get('course.header.assistant_close_floating')
              : t.get('course.header.assistant_pop_out')}
            data-testid="course-assistant-popout"
            class="relative z-10 hidden rounded-none rounded-r-md border-l border-white/30 bg-transparent text-white hover:bg-white/15 hover:text-white focus-visible:z-20 md:inline-flex"
          >
            {#if assistantFloating}
              <XIcon size={16} class="text-white" />
            {:else}
              <PictureInPictureIcon size={16} class="text-white" />
            {/if}
          </Button>
        </div>
        {#if showAssistantTip}
          <div
            role="status"
            class="ui:bg-popover ui:text-popover-foreground ui:border-border absolute top-[calc(100%+10px)] right-0 z-50 flex w-64 items-start gap-2 rounded-lg border p-3 text-xs leading-5 shadow-lg"
          >
            <span class="ui:bg-popover ui:border-border absolute -top-1 right-4 h-2 w-2 rotate-45 border-t border-l"
            ></span>
            <p class="flex-1">{$t('course.header.assistant_tip')}</p>
            <button
              type="button"
              class="ui:text-muted-foreground ui:hover:text-foreground flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-sm leading-none"
              aria-label={t.get('course.header.assistant_tip_dismiss')}
              onclick={dismissAssistantTip}
            >
              ×
            </button>
          </div>
        {/if}
      </div>
    {/if}

    {#if !$isStudentExperience}
      <ButtonGroup.Root>
        {#if !courseApi.course?.isTemplate}
          <Button
            variant="outline"
            size="sm"
            onclick={handleViewCourseSite}
            disabled={!courseApi.course?.id}
            aria-label={$t('course.header.view_course_site')}
          >
            <ExternalLinkIcon size={14} />
            <span class="hidden sm:inline">{$t('course.header.view_course_site')}</span>
          </Button>
        {/if}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="outline"
                size="sm"
                aria-label={$t('courses.course_card.actions_menu_aria')}
                disabled={!courseApi.course?.id}
              >
                <EllipsisVerticalIcon size={14} />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            {#if courseApi.course}
              <CourseContextMenuContent
                id={courseApi.course.id}
                title={courseApi.course.title}
                description={courseApi.course.description}
                isPublished={courseApi.course.isPublished ?? false}
                courseType={courseApi.course.type}
                slug={courseApi.course.slug ?? ''}
                isTemplate={courseApi.course.isTemplate}
                studentCount={courseApi.group.students.length}
                includeViewAsStudent={true}
                onViewAsStudent={() => (viewAsStudentOpen = true)}
              />
            {/if}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </ButtonGroup.Root>
    {/if}
  </div>
</header>

<ViewAsStudentModal
  bind:open={viewAsStudentOpen}
  courseId={courseApi.course?.id}
  courseSlug={courseApi.course?.slug}
  currentOrgDomain={$currentOrgDomain}
/>

<ViewCourseSiteUnpublishedModal bind:open={viewCourseSiteUnpublishedOpen} currentOrgDomain={$currentOrgDomain} />
