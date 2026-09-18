<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { copyPublicPathPageUrl, viewPathAsStudent } from '../utils/path-preview';

  interface Props {
    open?: boolean;
    pathId?: string | null;
    pathSlug?: string | null;
    currentOrgDomain?: string;
  }

  let { open = $bindable(false), pathId = null, pathSlug = null, currentOrgDomain = '' }: Props = $props();

  let isNavigating = $state(false);

  async function handleCopyLink() {
    if (!pathSlug) return;

    try {
      await copyPublicPathPageUrl(pathSlug, currentOrgDomain);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }

  async function handleGoToLms() {
    isNavigating = true;

    try {
      // Opens the student view in a new tab; close the modal once the handoff starts.
      const ok = await viewPathAsStudent({ pathId, pathSlug, currentOrgDomain });

      if (ok) {
        open = false;
      }
    } catch (error) {
      console.error('Failed to view path as student:', error);
      snackbar.error('snackbar.view_as_student.failed');
    } finally {
      isNavigating = false;
    }
  }
</script>

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen && !isNavigating) open = false;
  }}
>
  <Dialog.Content class="w-[calc(100%-2rem)] max-w-xl! p-4">
    <Dialog.Header>
      <Dialog.Title>{$t('course.view_as_student.title')}</Dialog.Title>
      <Dialog.Description>{$t('course.view_as_student.description')}</Dialog.Description>
    </Dialog.Header>

    <img
      src="https://assets.cdn.clsrio.com/cio-lms-plain.png"
      alt=""
      class="mx-auto my-4 w-full rounded-lg border"
      width="2095"
      height="1744"
      loading="lazy"
      decoding="async"
    />

    <Dialog.Footer>
      <Button variant="secondary" onclick={handleCopyLink} disabled={!pathSlug || isNavigating}>
        {$t('course.view_as_student.copy_link')}
      </Button>
      <Button variant="default" onclick={handleGoToLms} disabled={!pathId} loading={isNavigating}>
        {$t('course.view_as_student.go_to_lms')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
