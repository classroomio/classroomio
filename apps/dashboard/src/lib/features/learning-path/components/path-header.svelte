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
  import { snackbar } from '$features/ui/snackbar/store';
  import CoursePublishBadge from '$features/course/components/course-publish-badge.svelte';
  import { learningPathApi } from '../api';
  import { clonePathModal } from '../utils/store';
  import { getSetupSteps, getSetupProgress } from '../utils/setup-steps';
  import { copyPublicPathPageUrl, openPathPreview } from '../utils/path-preview';
  import ViewPathSiteUnpublishedModal from './view-path-site-unpublished-modal.svelte';
  import ViewPathAsStudentModal from './view-path-as-student-modal.svelte';
  import type { LearningPathDetail } from '../utils/types';
  import CheckSquareIcon from '@lucide/svelte/icons/check-square';

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

  async function handleCopyPathUrl() {
    if (!path?.slug) return;

    await copyPublicPathPageUrl(path.slug, $currentOrgDomain);
  }

  async function handlePublishPath() {
    if (!path?.id) return;

    await learningPathApi.updatePath(path.id, { isPublished: true });
    snackbar.success('learningPath.workspace.published');
  }

  function handleShare() {
    if (!path) return;

    goto(`${basePath}/settings#share`);
  }

  function handleInvite() {
    if (!path) return;

    goto(`${basePath}/people?add=true`);
  }

  function handleClone() {
    if (!path) return;

    setTimeout(() => {
      clonePathModal.set({
        open: true,
        id: path.id,
        name: `${path.name} (Copy)`,
        description: path.description || '',
        isSaving: false
      });
    }, 50);
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
            <DropdownMenu.Item onclick={() => (viewAsStudentOpen = true)}>
              {$t('course.header.view_as_student')}
            </DropdownMenu.Item>

            <DropdownMenu.Separator />

            {#if isPublished}
              <DropdownMenu.Item onclick={handleViewSite}>
                {$t('learningPath.workspace.view_path_site')}
              </DropdownMenu.Item>
              {#if path.slug}
                <DropdownMenu.Item onclick={() => void handleCopyPathUrl()}>
                  {$t('learningPath.workspace.copy_path_url')}
                </DropdownMenu.Item>
              {/if}
            {:else}
              <DropdownMenu.Item onclick={handlePublishPath}>
                {$t('learningPath.workspace.publish_path')}
              </DropdownMenu.Item>
            {/if}

            <DropdownMenu.Separator />

            <DropdownMenu.Item onclick={handleClone}>
              {$t('learningPath.context_menu.clone')}
            </DropdownMenu.Item>

            <DropdownMenu.Item onclick={handleShare}>
              {$t('learningPath.context_menu.share')}
            </DropdownMenu.Item>

            <DropdownMenu.Item onclick={handleInvite}>
              {$t('learningPath.context_menu.invite')}
            </DropdownMenu.Item>

            <DropdownMenu.Separator />

            <DropdownMenu.Item onclick={onDelete} class="text-red-600">
              {$t('learningPath.context_menu.delete')}
            </DropdownMenu.Item>
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
