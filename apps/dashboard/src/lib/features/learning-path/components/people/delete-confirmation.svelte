<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { pathMembersApi } from '$features/learning-path/api';
  import { deletePathMemberModal } from './store';

  interface Props {
    pathId: string;
    memberId: string | null;
    memberName: string;
    isStudent?: boolean;
    onRemoved?: () => void;
  }

  let { pathId, memberId, memberName, isStudent = true, onRemoved }: Props = $props();

  async function handleRemove() {
    if (!memberId) return;

    const result = await pathMembersApi.removeMember(pathId, memberId, { isStudent });
    if (result?.success) {
      deletePathMemberModal.set({ open: false });
      onRemoved?.();
    }
  }
</script>

<Dialog.Root bind:open={$deletePathMemberModal.open}>
  <Dialog.Content class="w-96 pt-3">
    <Dialog.Header class="px-5 py-2">
      <Dialog.Title>
        {isStudent ? $t('learningPath.people.remove.title') : $t('learningPath.people.remove.title_non_student')}
      </Dialog.Title>
    </Dialog.Header>
    <div>
      <p class="mt-0 text-base dark:text-white">
        {isStudent
          ? $t('learningPath.people.remove.confirm', { name: memberName })
          : $t('learningPath.people.remove.confirm_non_student', { name: memberName })}
      </p>

      <div class="mt-5 flex items-center justify-between">
        <Button variant="outline" onclick={() => deletePathMemberModal.set({ open: false })}>
          {$t('learningPath.people.remove.cancel')}
        </Button>
        <Button variant="outline" onclick={handleRemove} loading={pathMembersApi.isLoading}>
          {$t('learningPath.people.remove.yes')}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
