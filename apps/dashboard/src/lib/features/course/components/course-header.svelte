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
  import { isStudentExperience } from '$lib/utils/store/app';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import { setupProgressApi } from '$features/setup/api/setup-progress.svelte';
  import { courseApi } from '$features/course/api';
  import { getActiveCourseNavKey } from '$features/course/utils/functions';
  import { toggleAiAssistant } from '$features/ai-assistant/utils/store';
  import { openCoursePreview } from '$features/course/utils/course-preview';
  import { t } from '$lib/utils/functions/translations';
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

  let viewAsStudentOpen = $state(false);
  let viewCourseSiteUnpublishedOpen = $state(false);

  $effect(() => {
    if (!siteName) return;

    setupProgressApi.fetchSetupProgress(siteName);
  });

  function handleViewCourseSite() {
    const course = courseApi.course;
    if (!course?.id) {
      return;
    }

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
  class="border-border ui:bg-background z-app-bar sticky top-0 flex h-12 w-full shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-8"
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

        {#if showCoursePublishBadge}
          <CoursePublishBadge {isPublished} />
        {/if}
      </div>
    </div>

    <span class="grow"></span>

    <Button
      size="sm"
      onclick={toggleAiAssistant}
      class="ui:bg-primary ui:text-primary-foreground relative overflow-hidden border-0"
    >
      <Waves
        lineColor="rgba(255,255,255,0.55)"
        xGap={8}
        yGap={12}
        waveAmpX={18}
        waveAmpY={9}
        waveSpeedX={0.04}
        waveSpeedY={0.02}
      />
      <SparklesIcon size={14} class="relative z-10" />
      <span class="relative z-10">{$t('course.navItems.nav_ai_assistant')}</span>
    </Button>

    {#if !$isStudentExperience}
      <ButtonGroup.Root>
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
