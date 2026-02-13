<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import Plus from '@lucide/svelte/icons/plus';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Button } from '@cio/ui/base/button';
  import { contentCreateStoreUtils } from '$features/course/components/content/store';
  import { courseApi } from '$features/course/api';
  import { getLessonsRoute } from '$features/course/utils/functions';
  import { t } from '$lib/utils/functions/translations';
  import { getCourseSidebarBackRoute } from './sidebar-history';
  import CourseContentTree from './course-content-tree.svelte';

  interface Props {
    path: string;
    id: string;
    isStudent?: boolean;
  }

  let { path, id, isStudent = false }: Props = $props();

  const backRoute = $derived(getCourseSidebarBackRoute(id));

  function openContentModal(courseId: string, sectionId = '') {
    goto(resolve(`/courses/${courseId}/lessons`, {}));
    const contentGroupingEnabled = courseApi.course?.metadata?.isContentGroupingEnabled ?? true;

    if (sectionId) {
      contentCreateStoreUtils.openContentUnit(sectionId);
    } else if (contentGroupingEnabled) {
      contentCreateStoreUtils.openSection();
    } else {
      contentCreateStoreUtils.openDefault();
    }
  }
</script>

<Sidebar.Group class="pt-0!">
  <Button variant="link" class="h-fit! justify-start! px-2! py-2!" href={resolve(backRoute, {})}>
    <ArrowLeftIcon class="custom" />
    <span class="text-xs">{$t('course.sidebar.back_to_course')}</span>
  </Button>

  <Sidebar.Menu>
    <Sidebar.MenuItem>
      <Sidebar.MenuButton
        tooltipContent={$t('course.navItems.nav_content')}
        isActive={(path || page.url.pathname).includes('/lessons') ||
          (path || page.url.pathname).includes('/exercises')}
      >
        {#snippet child({ props })}
          <a href={resolve(getLessonsRoute(id), {})} {...props}>
            <span>{$t('course.navItems.nav_content')}</span>

            <div class="ml-auto flex items-center gap-1">
              <Plus
                size={20}
                class="rounded-full p-1"
                onclick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openContentModal(id);
                }}
              />
            </div>
          </a>
        {/snippet}
      </Sidebar.MenuButton>
    </Sidebar.MenuItem>
  </Sidebar.Menu>

  <CourseContentTree
    {path}
    {id}
    {isStudent}
    className="mt-1"
    onOpenContentModal={(sectionId) => openContentModal(id, sectionId)}
  />
</Sidebar.Group>

<style>
  a {
    text-decoration: none;
  }
</style>
