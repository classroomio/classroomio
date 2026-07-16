<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import { resolve } from '$app/paths';
  import { currentOrg } from '$lib/utils/store/org';
  import { shortenName } from '$lib/utils/functions/string';
  import { courseApi } from '$features/course/api';
  import { getNavItemRoute } from '$features/course/utils/functions';
  import { getCourseProgress } from '$features/course/utils/content';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    isStudent?: boolean;
  }

  let { isStudent = false }: Props = $props();

  const sidebar = useSidebar();
  const courseTitle = $derived(courseApi.course?.title);
  const courseId = $derived(courseApi.course?.id);
  const progress = $derived(getCourseProgress(courseApi.course));
  const isSidebarExpanded = $derived(sidebar.open || sidebar.isMobile);
  const showProgressRing = $derived(isStudent && progress.total > 0 && isSidebarExpanded);
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      size={showProgressRing ? 'lg' : 'sm'}
      class="ui:data-[state=open]:bg-sidebar-accent ui:data-[state=open]:text-sidebar-accent-foreground"
    >
      {#snippet child({ props })}
        <a href={courseId ? resolve(getNavItemRoute(courseId), {}) : '#'} {...props}>
          {#if showProgressRing}
            <PercentRingProgress value={progress.percent} size="small" />
            <div class="flex min-w-0 flex-1 flex-col">
              {#if courseTitle}
                <span class="truncate text-sm font-medium">{courseTitle}</span>
              {:else}
                <Skeleton class="h-4 w-24" />
              {/if}
              <span class="ui:text-muted-foreground truncate text-xs">
                {$t('course.sidebar.progress.lessons_completed', {
                  completed: progress.lessonsComplete,
                  total: progress.lessonsTotal
                })}
              </span>
            </div>
          {:else if $currentOrg.name}
            <Avatar.Root class="flex size-6! items-center justify-center rounded-md!">
              <Avatar.Image src={$currentOrg.avatarUrl} alt={$currentOrg.name} />
              <Avatar.Fallback class="rounded-md! text-xs">{shortenName($currentOrg.name)}</Avatar.Fallback>
            </Avatar.Root>
            {#if courseTitle}
              <span class="truncate text-sm font-medium">{courseTitle}</span>
            {:else}
              <Skeleton class="h-4 w-24" />
            {/if}
          {:else}
            <Skeleton class="h-4 w-24" />
          {/if}
        </a>
      {/snippet}
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
</Sidebar.Menu>
