<script lang="ts">
  import { UserAvatar } from '../user-avatar';
  import { Button } from '../../base/button';
  import { Textarea } from '../../base/textarea';
  import SendHorizontalIcon from '@lucide/svelte/icons/send-horizontal';
  import XIcon from '@lucide/svelte/icons/x';

  interface Props {
    authorAvatarUrl?: string | null;
    placeholder?: string;
    replyingToUser?: string | null;
    replyingToSnippet?: string | null;
    onCancelReply?: () => void;
    cancelLabel?: string;
    onSubmit: (content: string) => Promise<void> | void;
    isSubmitting?: boolean;
    class?: string;
  }

  let {
    authorAvatarUrl,
    placeholder = 'Add a comment...',
    replyingToUser = null,
    replyingToSnippet = null,
    onCancelReply,
    cancelLabel = 'Cancel',
    onSubmit,
    isSubmitting = false,
    class: className = ''
  }: Props = $props();

  let value = $state('');

  async function handleSend() {
    if (!value.trim() || isSubmitting) return;
    const text = value.trim();
    value = '';
    try {
      await onSubmit(text);
    } catch {
      value = text;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape' && replyingToUser && onCancelReply) {
      onCancelReply();
    }
  }
</script>

<div class="ui:flex ui:items-start ui:gap-2 {className}">
  <UserAvatar src={authorAvatarUrl || undefined} class="ui:mt-0.5 ui:size-7 ui:shrink-0" />

  <div
    class="ui:flex ui:w-full ui:flex-col ui:overflow-hidden ui:rounded-md ui:border ui:border-input ui:transition-colors ui:focus-within:border-ring ui:focus-within:ring-[3px] ui:focus-within:ring-ring/50"
  >
    {#if replyingToUser}
      <div
        class="ui:flex ui:items-center ui:justify-between ui:bg-muted/30 ui:px-2.5 ui:py-1 ui:text-xs ui:text-muted-foreground ui:border-b ui:border-border/60"
      >
        <div class="ui:flex ui:max-w-[85%] ui:flex-col ui:gap-0.5 ui:truncate">
          <span>Replying to <strong class="ui:font-medium ui:text-foreground">@{replyingToUser}</strong></span>
          {#if replyingToSnippet}
            <span class="ui:truncate ui:italic ui:text-muted-foreground/80">"{replyingToSnippet}"</span>
          {/if}
        </div>
        {#if onCancelReply}
          <Button
            variant="ghost"
            size="xs"
            onclick={onCancelReply}
            class="ui:h-auto ui:gap-1 ui:px-0 ui:text-xs ui:font-normal ui:text-muted-foreground ui:hover:bg-transparent ui:hover:text-foreground"
          >
            <XIcon size={12} />
            <span>{cancelLabel}</span>
          </Button>
        {/if}
      </div>
    {/if}

    <div class="ui:flex ui:items-end ui:gap-1 ui:px-1 ui:py-1">
      <Textarea
        bind:value
        onkeydown={handleKeyDown}
        {placeholder}
        disabled={isSubmitting}
        rows={1}
        class="ui:min-h-8 ui:max-h-24 ui:resize-none ui:border-0 ui:bg-transparent ui:px-2 ui:py-1.5 ui:text-sm ui:shadow-none ui:focus-visible:ring-0"
      />
      <Button
        variant="secondary"
        size="icon"
        class="ui:mb-0.5 ui:size-7 ui:shrink-0"
        loading={isSubmitting}
        disabled={!value.trim() || isSubmitting}
        onclick={handleSend}
        aria-label="Send"
      >
        <SendHorizontalIcon size={14} />
      </Button>
    </div>
  </div>
</div>
