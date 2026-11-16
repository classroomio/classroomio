<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import { ChatTextarea } from '@cio/ui/custom/chat-textarea';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { courseCommentsApi } from '../api/course-comments.svelte';
  import { toMentionItems } from '../utils/anchor-utils';

  interface Props {
    placeholder: string;
    submitLabel: string;
    initialValue?: string;
    autofocus?: boolean;
    testId?: string;
    /** Resolves true when the comment was saved, which clears the box. */
    onSubmit: (markup: string) => Promise<boolean>;
    onCancel?: () => void;
  }

  let { placeholder, submitLabel, initialValue = '', autofocus = false, testId, onSubmit, onCancel }: Props = $props();

  let value = $state(untrack(() => initialValue));
  let textarea = $state<HTMLTextAreaElement | null>(null);
  let isSubmitting = $state(false);

  const mentionItems = $derived(toMentionItems(courseCommentsApi.team, $profile.id));
  const canSubmit = $derived(value.trim().length > 0 && !isSubmitting);

  async function submit() {
    if (!canSubmit) return;

    isSubmitting = true;
    const saved = await onSubmit(value);
    isSubmitting = false;

    if (saved) value = '';
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented || !onCancel) return;

    event.stopPropagation();
    onCancel();
  }

  onMount(() => {
    if (autofocus) textarea?.focus();
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-col gap-1.5" onkeydown={handleKeydown} data-testid={testId}>
  <ChatTextarea
    bind:value
    bind:ref={textarea}
    {mentionItems}
    {placeholder}
    rows={2}
    disabled={isSubmitting}
    emptyMessage={$t('course_comments.composer.no_teammates')}
    onSubmit={submit}
  />
  <div class="flex items-center justify-between gap-2">
    <span class="ui:text-muted-foreground text-xs">{$t('course_comments.composer.hint')}</span>
    <div class="flex items-center gap-1.5">
      {#if onCancel}
        <Button size="sm" variant="outline" onclick={onCancel}>{$t('common.cancel')}</Button>
      {/if}
      <Button size="sm" disabled={!canSubmit} loading={isSubmitting} onclick={submit}>{submitLabel}</Button>
    </div>
  </div>
</div>
