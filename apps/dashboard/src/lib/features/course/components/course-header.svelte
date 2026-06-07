<script lang="ts">
  import { Separator } from '@cio/ui/base/separator';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import { Button } from '@cio/ui/base/button';
  import { page } from '$app/state';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { isStudentExperience } from '$lib/utils/store/app';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import { setupProgressApi } from '$features/setup/api/setup-progress.svelte';
  import { courseApi } from '$features/course/api';
  import { getActiveCourseNavKey } from '$features/course/utils/functions';
  import { toggleAiAssistant } from '$features/ai-assistant/utils/store';
  import { t } from '$lib/utils/functions/translations';
  import CoursePublishBadge from './course-publish-badge.svelte';
  import CoursePublicBadge from './course-public-badge.svelte';
  import ViewAsStudentModal from './view-as-student-modal.svelte';

  const siteName = $derived($currentOrg.siteName);
  const showCoursePublishBadge = $derived(!$isStudentExperience);
  const isPublicCourse = $derived(courseApi.course?.type === 'PUBLIC');
  const activeNavKey = $derived(getActiveCourseNavKey(page.url.pathname, courseApi.course?.id ?? ''));

  let viewAsStudentOpen = $state(false);

  $effect(() => {
    if (!siteName) return;

    setupProgressApi.fetchSetupProgress(siteName);
  });
</script>

<header
  class="border-border ui:bg-background sticky top-0 z-100 flex h-12 w-full shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-8"
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
          <CoursePublishBadge isPublished={courseApi.course?.isPublished ?? false} />
        {/if}
      </div>
    </div>

    <span class="grow"></span>

    <Button variant="outline" size="sm" onclick={toggleAiAssistant}>
      <SparklesIcon size={14} />
      {$t('course.navItems.nav_ai_assistant')}
    </Button>

    {#if !$isStudentExperience}
      <Button
        variant="outline"
        size="sm"
        onclick={() => (viewAsStudentOpen = true)}
        disabled={!courseApi.course?.id}
        aria-label={$t('course.header.view_as_student')}
      >
        <EyeIcon size={14} />
        <span class="hidden sm:inline">{$t('course.header.view_as_student')}</span>
      </Button>
    {/if}
  </div>
</header>

<ViewAsStudentModal
  bind:open={viewAsStudentOpen}
  courseSlug={courseApi.course?.slug}
  currentOrgDomain={$currentOrgDomain}
/>
