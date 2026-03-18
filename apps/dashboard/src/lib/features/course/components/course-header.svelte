<script lang="ts">
  import { Separator } from '@cio/ui/base/separator';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import BellIcon from '@lucide/svelte/icons/bell';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import * as Popover from '@cio/ui/base/popover';
  import { HoverableItem, PreviewIcon } from '@cio/ui/custom/moving-icons';
  import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw';
  import * as Empty from '@cio/ui/base/empty';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { isStudentExperience } from '$lib/utils/store/app';
  import { setupProgressApi } from '$features/setup/api/setup-progress.svelte';
  import { courseApi } from '$features/course/api';
  import { openCoursePreview } from '$features/course/utils/course-preview';
  import { t } from '$lib/utils/functions/translations';
  import CoursePublishBadge from './course-publish-badge.svelte';

  const siteName = $derived($currentOrg.siteName);
  const showCoursePublishBadge = $derived(!$isStudentExperience);

  $effect(() => {
    if (!siteName) return;

    setupProgressApi.fetchSetupProgress(siteName);
  });

  function handlePreview() {
    openCoursePreview({
      courseId: courseApi.course?.id ?? '',
      courseSlug: courseApi.course?.slug,
      currentOrgDomain: $currentOrgDomain
    });
  }
</script>

<header
  class="border-border ui:bg-background sticky top-0 z-100 flex h-12 w-full shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-8"
>
  <div class="flex w-full items-center gap-2 px-4">
    <Sidebar.Trigger />

    <div class="h-4 w-2">
      <Separator orientation="vertical" />
    </div>

    <div class="flex min-w-0 items-center gap-2">
      <p class="max-w-2xs truncate text-sm font-medium">
        {courseApi.course?.title || ''}
      </p>

      {#if showCoursePublishBadge}
        <CoursePublishBadge isPublished={courseApi.course?.isPublished} />
      {/if}
    </div>

    <span class="grow"></span>

    <Popover.Root>
      <Popover.Trigger>
        <Button variant="outline" size="icon">
          <BellIcon class="custom rounded-full" />
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <Empty.Root class="ui:from-muted/50 ui:to-background ui:h-full ui:bg-gradient-to-b ui:from-30%">
          <Empty.Header>
            <Empty.Media variant="icon">
              <BellIcon />
            </Empty.Media>
            <Empty.Title>No Notifications</Empty.Title>
            <Empty.Description>You're all caught up. New notifications will appear here.</Empty.Description>
          </Empty.Header>
          <Empty.Content>
            <Button variant="outline" size="sm">
              <RefreshCcwIcon />
              {$t('common.refresh')}
            </Button>
          </Empty.Content>
        </Empty.Root>
      </Popover.Content>
    </Popover.Root>

    <HoverableItem>
      {#snippet children(isHovered)}
        <IconButton
          onclick={handlePreview}
          disabled={!courseApi.course?.id}
          tooltip={$t('course.header.preview')}
          aria-label={$t('course.header.preview')}
        >
          <PreviewIcon {isHovered} size={16} />
        </IconButton>
      {/snippet}
    </HoverableItem>
  </div>
</header>
