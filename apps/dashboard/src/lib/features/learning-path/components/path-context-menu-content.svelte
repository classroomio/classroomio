<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { snackbar } from '$features/ui/snackbar/store';
  import { currentOrgDomain, isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { clonePathModal } from '../utils/store';
  import { learningPathApi } from '../api';
  import { copyPublicPathPageUrl, openPathPreview } from '../utils/path-preview';

  interface Props {
    id: string;
    publicId: string;
    slug?: string;
    name: string;
    description?: string;
    isPublished?: boolean;
    openUrl?: string;
    includeOpen?: boolean;
    includeViewAsStudent?: boolean;
    onViewAsStudent?: () => void;
    onDelete?: (id: string, name: string) => void;
  }

  let {
    id,
    publicId,
    slug = '',
    name,
    description = '',
    isPublished = false,
    openUrl,
    includeOpen = false,
    includeViewAsStudent = false,
    onViewAsStudent,
    onDelete
  }: Props = $props();

  function handleOpen(e: MouseEvent) {
    e.stopPropagation();
    goto(resolve(openUrl || `/paths/${publicId}`, {}));
  }

  function handleClone(e: MouseEvent) {
    e.stopPropagation();
    setTimeout(() => {
      clonePathModal.set({
        open: true,
        id,
        name: $t('learningPath.modals.clone.title_copy_format', { name }),
        description: description || '',
        isSaving: false
      });
    }, 50);
  }

  function handleShare(e: MouseEvent) {
    e.stopPropagation();
    goto(resolve(`/paths/${publicId}/settings#share`, {}));
  }

  function handleInvite(e: MouseEvent) {
    e.stopPropagation();
    goto(resolve(`/paths/${publicId}/people?add=true`, {}));
  }

  function handleViewPathSite(e: MouseEvent) {
    e.stopPropagation();
    openPathPreview({
      pathId: publicId,
      pathSlug: slug,
      currentOrgDomain: $currentOrgDomain
    });
  }

  async function handleCopyPathUrl(e: MouseEvent) {
    e.stopPropagation();
    if (slug) {
      try {
        await copyPublicPathPageUrl(slug, $currentOrgDomain);
      } catch {
        snackbar.error('snackbar.public_course.url_copy_failed');
      }
    }
  }

  async function handlePublishPath(e: MouseEvent) {
    e.stopPropagation();
    try {
      await learningPathApi.updatePath(id, { isPublished: true });
      snackbar.success('learningPath.workspace.published');
    } catch {
      snackbar.error('learningPath.workspace.publish_failed');
    }
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    onDelete?.(id, name);
  }
</script>

{#if includeViewAsStudent}
  <DropdownMenu.Item onclick={() => onViewAsStudent?.()}>
    {$t('course.header.view_as_student')}
  </DropdownMenu.Item>
  <DropdownMenu.Separator />
{/if}

{#if isPublished}
  <DropdownMenu.Item onclick={handleViewPathSite}>
    {$t('learningPath.workspace.view_path_site')}
  </DropdownMenu.Item>
  {#if slug}
    <DropdownMenu.Item onclick={handleCopyPathUrl}>
      {$t('learningPath.workspace.copy_path_url')}
    </DropdownMenu.Item>
  {/if}
  <DropdownMenu.Separator />
{:else}
  <DropdownMenu.Item onclick={handlePublishPath}>
    {$t('learningPath.workspace.publish_path')}
  </DropdownMenu.Item>
  <DropdownMenu.Separator />
{/if}

{#if includeOpen}
  <DropdownMenu.Item onclick={handleOpen}>
    {$t('learningPath.context_menu.open')}
  </DropdownMenu.Item>
{/if}

{#if $isOrgAdmin}
  <DropdownMenu.Item onclick={handleClone}>
    {$t('learningPath.context_menu.clone')}
  </DropdownMenu.Item>
{/if}
<DropdownMenu.Item onclick={handleShare}>
  {$t('learningPath.context_menu.share')}
</DropdownMenu.Item>
<DropdownMenu.Item onclick={handleInvite}>
  {$t('learningPath.context_menu.invite')}
</DropdownMenu.Item>

{#if $isOrgAdmin}
  <DropdownMenu.Separator />

  <DropdownMenu.Item onclick={handleDelete} class="text-red-600">
    {$t('learningPath.context_menu.delete')}
  </DropdownMenu.Item>
{/if}
