<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { publishPath } from '../utils/publish-path';
  import { openPathPreview } from '../utils/path-preview';
  import type { LearningPathDetail } from '../utils/types';

  interface Props {
    open?: boolean;
    path: LearningPathDetail | null;
    currentOrgDomain?: string;
  }

  let { open = $bindable(false), path, currentOrgDomain = '' }: Props = $props();

  let isPublishing = $state(false);

  async function handlePublishPath() {
    if (!path?.id) {
      return;
    }

    isPublishing = true;
    try {
      const result = await publishPath(path);
      if (!result.ok) {
        snackbar.error(
          result.reason === 'slug_taken'
            ? 'learningPath.settings.general.slug_taken'
            : 'learningPath.workspace.publish_failed'
        );
        return;
      }

      snackbar.success('learningPath.workspace.published');

      open = false;

      const previewPathId = path.publicId ?? path.id;
      openPathPreview({
        pathId: previewPathId,
        pathSlug: result.slug,
        currentOrgDomain
      });
    } catch {
      snackbar.error('learningPath.workspace.publish_failed');
    } finally {
      isPublishing = false;
    }
  }
</script>

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen && !isPublishing) {
      open = false;
    }
  }}
>
  <Dialog.Content class="w-[calc(100%-2rem)] max-w-md! p-4" onCloseAutoFocus={(e) => e.preventDefault()}>
    <Dialog.Header>
      <Dialog.Title>{$t('learningPath.view_path_site.unpublished_title')}</Dialog.Title>
      <Dialog.Description>{$t('learningPath.view_path_site.unpublished_description')}</Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)} disabled={isPublishing}>
        {$t('learningPath.view_path_site.cancel')}
      </Button>
      <Button variant="default" onclick={handlePublishPath} loading={isPublishing} disabled={!path?.id}>
        {$t('learningPath.view_path_site.publish_path')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
