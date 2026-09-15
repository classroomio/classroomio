<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { goto } from '$app/navigation';
  import { snackbar } from '$features/ui/snackbar/store';
  import { copyToClipboard } from '$lib/utils/functions/formatYoutubeVideo';
  import { currentOrgDomain } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { clonePathModal } from '../utils/store';

  interface Props {
    id: string;
    slug?: string;
    name: string;
    basePath?: string;
    isPublished?: boolean;
    onDelete?: (id: string, name: string) => void;
  }

  let { id, slug = '', name, isPublished = false, onDelete }: Props = $props();

  const publicUrl = $derived(slug ? `${$currentOrgDomain}/path/${slug}` : '');

  function handleOpen(e: MouseEvent) {
    e.stopPropagation();
    goto(`/paths/${id}/courses`);
  }

  function handleSettings(e: MouseEvent) {
    e.stopPropagation();
    goto(`/paths/${id}/settings`);
  }

  function handleClone(e: MouseEvent) {
    e.stopPropagation();
    setTimeout(() => {
      clonePathModal.set({
        open: true,
        id,
        name: `${name} (Copy)`,
        description: '',
        isSaving: false
      });
    }, 50);
  }

  function handleCopyLink(e: MouseEvent) {
    e.stopPropagation();
    if (publicUrl) {
      copyToClipboard(publicUrl);
      snackbar.success('Link copied to clipboard');
    }
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    onDelete?.(id, name);
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class="absolute top-6 right-6 z-40 flex items-center justify-center opacity-0 transition-all delay-150 duration-200 ease-in-out group-hover:opacity-100 data-[state=open]:opacity-100"
    onclick={(e) => e.stopPropagation()}
  >
    <IconButton variant="outline">
      <EllipsisVerticalIcon size={16} />
    </IconButton>
  </DropdownMenu.Trigger>

  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onclick={handleOpen}>
      {$t('courses.course_card.context_menu.open')}
    </DropdownMenu.Item>

    <DropdownMenu.Item onclick={handleClone}>
      {$t('courses.course_card.context_menu.clone')}
    </DropdownMenu.Item>

    {#if slug && isPublished}
      <DropdownMenu.Item href={`/path/${slug}`} target="_blank">
        {$t('learningPath.workspace.view_path_site')}
      </DropdownMenu.Item>

      <DropdownMenu.Item onclick={handleCopyLink}>
        {$t('courses.course_card.context_menu.share')}
      </DropdownMenu.Item>
    {/if}

    <DropdownMenu.Item onclick={handleSettings}>
      {$t('course.navItems.nav_settings')}
    </DropdownMenu.Item>

    <DropdownMenu.Separator />

    <DropdownMenu.Item onclick={handleDelete} class="text-red-600">
      {$t('courses.course_card.context_menu.delete')}
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
