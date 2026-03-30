<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import type { OrganizationAudienceMember } from '$features/org/utils/types';

  interface Props {
    open: boolean;
    member: OrganizationAudienceMember | null;
    isDeleting?: boolean;
    onDelete: () => void | Promise<void>;
  }

  let { open = $bindable(false), member, isDeleting = false, onDelete }: Props = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="w-full max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('audience.delete.title')}</Dialog.Title>
      <Dialog.Description>{$t('audience.delete.description')}</Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <p class="text-sm">
        {$t('audience.delete.confirmation', {
          email: member?.email ?? '',
          name: member?.name ?? member?.email ?? ''
        })}
      </p>

      <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={() => (open = false)} disabled={isDeleting}>
          {$t('audience.delete.cancel')}
        </Button>
        <Button variant="destructive" onclick={onDelete} loading={isDeleting} disabled={!member || isDeleting}>
          {$t('audience.delete.confirm')}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
