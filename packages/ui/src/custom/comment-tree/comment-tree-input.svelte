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

<div class="ui:flex ui:gap-3 {className}">
  <UserAvatar src={authorAvatarUrl || undefined} class="ui:mt-1 ui:size-8 ui:shrink-0" />

  <div
    class="ui:flex ui:w-full ui:flex-col ui:overflow-hidden ui:rounded-lg ui:border ui:border-input ui:shadow-xs ui:transition-[color,box-shadow] ui:focus-within:border-ring ui:focus-within:ring-[3px] ui:focus-within:ring-ring/50"
  >
    {#if replyingToUser}
      <div
        class="ui:flex ui:items-center ui:justify-between ui:bg-muted/30 ui:px-3 ui:py-1.5 ui:text-xs ui:text-muted-foreground ui:border-b ui:border-border/60"
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
            <span>Cancel</span>
          </Button>
        {/if}
      </div>
    {/if}

    <div class="ui:flex ui:flex-col">
      <Textarea
        bind:value
        onkeydown={handleKeyDown}
        {placeholder}
        disabled={isSubmitting}
        rows={1}
        class="ui:min-h-0 ui:max-h-32 ui:resize-none ui:border-0 ui:bg-transparent ui:px-3 ui:py-2.5 ui:text-sm ui:shadow-none ui:focus-visible:ring-0"
      />
      <div class="ui:flex ui:items-center ui:justify-end ui:px-2 ui:pb-2">
        <Button
          variant={value.trim() ? 'default' : 'ghost'}
          size="sm"
          class="ui:h-8 ui:gap-1.5 ui:rounded-md"
          loading={isSubmitting}
          disabled={!value.trim() || isSubmitting}
          onclick={handleSend}
        >
          <span>Send</span>
          <SendHorizontalIcon size={14} />
        </Button>
      </div>
    </div>
  </div>
</div>
