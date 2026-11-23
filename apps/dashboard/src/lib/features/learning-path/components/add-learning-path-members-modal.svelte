<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { t } from '$lib/utils/functions/translations';
  import { learningPathApi } from '../api/learning-path.svelte';
  import { splitEmails } from '../utils/learning-path-utils';
  import type { AddLearningPathMembersResult } from '../utils/types';

  interface Props {
    open: boolean;
    pathId: string;
  }

  let { open = $bindable(false), pathId }: Props = $props();

  let emailsText = $state('');
  let isAdding = $state(false);
  let result = $state<AddLearningPathMembersResult | null>(null);

  const emails = $derived(splitEmails(emailsText));

  const SKIP_REASON_KEYS = {
    not_found: 'learning_paths.people.skipped_not_found',
    staff: 'learning_paths.people.skipped_staff',
    already_member: 'learning_paths.people.skipped_already_member'
  } as const;

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (isOpen) return;

    emailsText = '';
    result = null;
    learningPathApi.errors = {};
  }

  async function handleAdd() {
    isAdding = true;

    try {
      result = await learningPathApi.addMembers(pathId, emails);
      if (result) emailsText = '';
    } finally {
      isAdding = false;
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{$t('learning_paths.people.add_title')}</Dialog.Title>
      <Dialog.Description>{$t('learning_paths.people.add_description')}</Dialog.Description>
    </Dialog.Header>

    <TextareaField
      label={$t('learning_paths.people.emails_label')}
      placeholder={$t('learning_paths.people.emails_placeholder')}
      helperMessage={$t('learning_paths.people.emails_helper')}
      errorMessage={learningPathApi.errors.emails}
      bind:value={emailsText}
      oninput={() => learningPathApi.clearError('emails')}
      rows={4}
      testId="learning-path-member-emails"
    />

    {#if result}
      <div class="flex flex-col gap-1 text-sm">
        <p>{$t('learning_paths.people.added_count', { count: result.added.length })}</p>
        {#each result.skipped as skipped (skipped.email)}
          <p class="ui:text-muted-foreground">
            {skipped.email}: {$t(SKIP_REASON_KEYS[skipped.reason])}
          </p>
        {/each}
      </div>
    {/if}

    <Dialog.Footer>
      <Button size="sm" variant="outline" onclick={() => handleOpenChange(false)}
        >{$t('learning_paths.people.done')}</Button
      >
      <Button size="sm" onclick={handleAdd} disabled={emails.length === 0 || isAdding} loading={isAdding}>
        {$t('learning_paths.people.add')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
