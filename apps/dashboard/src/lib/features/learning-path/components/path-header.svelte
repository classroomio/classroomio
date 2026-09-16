<script lang="ts">
  import { Separator } from '@cio/ui/base/separator';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import * as ButtonGroup from '@cio/ui/base/button-group';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { Button } from '@cio/ui/base/button';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { currentOrgDomain } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import CoursePublishBadge from '$features/course/components/course-publish-badge.svelte';
  import { getSetupSteps, getSetupProgress } from '../utils/setup-steps';
  import { openPathPreview } from '../utils/path-preview';
  import ViewPathSiteUnpublishedModal from './view-path-site-unpublished-modal.svelte';
  import ViewPathAsStudentModal from './view-path-as-student-modal.svelte';
  import type { LearningPathDetail } from '../utils/types';
  import CheckSquareIcon from '@lucide/svelte/icons/check-square';
  import PathContextMenuContent from './path-context-menu-content.svelte';

  interface Props {
    path: LearningPathDetail | null;
    onDelete?: () => void;
  }

  let { path, onDelete }: Props = $props();

  const isPublished = $derived(path?.isPublished ?? false);
  const basePath = $derived(path ? `/paths/${path.id}` : '');

  const setupSteps = $derived(path ? getSetupSteps(path, basePath) : []);
  const setupProgress = $derived(getSetupProgress(setupSteps));
  const isSetupIncomplete = $derived(setupProgress.completed < setupProgress.total);
  const isNotOnSetupPage = $derived(!page.url.pathname.endsWith('/setup'));

  let viewAsStudentOpen = $state(false);
  let viewPathSiteUnpublishedOpen = $state(false);

  const activeTabTitle = $derived.by(() => {
    const pathname = page.url.pathname;
    if (pathname.endsWith('/setup')) return $t('learningPath.workspace.tabs.setup');
    if (pathname.endsWith('/courses') || pathname === basePath) return $t('learningPath.workspace.tabs.courses');
    if (pathname.endsWith('/people')) return $t('learningPath.workspace.tabs.people');
    if (pathname.endsWith('/analytics')) return $t('learningPath.workspace.tabs.analytics');
    if (pathname.endsWith('/landing')) return $t('learningPath.workspace.tabs.landing');
    if (pathname.endsWith('/certificate')) return $t('learningPath.workspace.tabs.certificate');
    if (pathname.endsWith('/settings')) return $t('learningPath.workspace.tabs.settings');
    return '';
  });

  function handleViewSite() {
    if (!path?.id) return;

    if (!isPublished) {
      viewPathSiteUnpublishedOpen = true;
      return;
    }

    openPathPreview({
      pathId: path.id,
      pathSlug: path.slug,
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

    <div class="flex min-w-0 items-center gap-2">
      <p class="max-w-xs truncate text-sm font-medium">
        {activeTabTitle}
      </p>

      {#if path}
        <CoursePublishBadge {isPublished} />
      {/if}
    </div>

    <span class="grow"></span>

    <!-- Finish Setup CTA (shown when setup is incomplete and outside setup page) -->
    {#if path && isSetupIncomplete && isNotOnSetupPage}
      <Button variant="outline" size="sm" onclick={() => goto(`${basePath}/setup`)} class="gap-1.5">
        <CheckSquareIcon class="text-primary size-3.5" />
        <span class="hidden sm:inline"
          >{$t('learningPath.workspace.finish_setup', { percent: setupProgress.percent })}</span
        >
        <span class="sm:hidden">{setupProgress.percent}%</span>
      </Button>
    {/if}

    {#if path}
      <ButtonGroup.Root>
        <Button
          variant="outline"
          size="sm"
          onclick={handleViewSite}
          disabled={!path?.id}
          aria-label={$t('learningPath.workspace.view_path_site')}
        >
          <ExternalLinkIcon size={14} />
          <span class="hidden sm:inline">{$t('learningPath.workspace.view_path_site')}</span>
        </Button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant="outline" size="sm" aria-label={$t('learningPath.card.actions_menu_aria')}>
                <EllipsisVerticalIcon size={14} />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <PathContextMenuContent
              id={path.id}
              slug={path.slug}
              name={path.name}
              description={path.description}
              {isPublished}
              {onDelete}
              includeViewAsStudent={true}
              onViewAsStudent={() => (viewAsStudentOpen = true)}
            />
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </ButtonGroup.Root>
    {/if}
  </div>
</header>

<ViewPathAsStudentModal
  bind:open={viewAsStudentOpen}
  pathId={path?.id}
  pathSlug={path?.slug}
  currentOrgDomain={$currentOrgDomain}
/>

<ViewPathSiteUnpublishedModal bind:open={viewPathSiteUnpublishedOpen} {path} currentOrgDomain={$currentOrgDomain} />
