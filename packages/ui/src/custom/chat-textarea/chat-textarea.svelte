<script lang="ts">
  import { cn } from '../../tools';
  import { Textarea } from '../../base/textarea';
  import { MentionPopover } from '../mention-popover';
  import type { MentionItem } from '../mention-popover/types';
  import type { Snippet } from 'svelte';

  interface Props {
    /** Two-way bound text value (includes raw mention syntax like `@[Title](type:id)`). */
    value: string;
    /** Forwarded textarea element ref for parent-controlled focus. */
    ref?: HTMLTextAreaElement | null;
    /** Items available for @ mention. */
    mentionItems?: MentionItem[];
    /** Fires when Enter is pressed (without Shift). */
    onSubmit?: () => void;
    /** Custom icon snippet for mention popover items. */
    icon?: Snippet<[{ item: MentionItem }]>;
    /** Custom type badge label for mention popover items. */
    typeLabel?: (item: MentionItem) => string;
    /** Action buttons rendered inside the textarea container (e.g. send, attach). */
    actions?: Snippet;
    /** Empty state text when no mention items match the query. */
    emptyMessage?: string;
    placeholder?: string;
    disabled?: boolean;
    /** Initial visible textarea row count. Defaults to 1 (single-line). */
    rows?: number;
    class?: string;
  }

  let {
    value = $bindable(''),
    ref = $bindable(null),
    mentionItems = [],
    onSubmit,
    icon,
    typeLabel,
    actions,
    emptyMessage = 'No results',
    placeholder = '',
    disabled = false,
    rows = 1,
    class: className
  }: Props = $props();

  let showPopover = $state(false);
  let mentionQuery = $state('');
  let mentionStartIndex = $state(-1);
  let selectedIndex = $state(0);

  const filteredItems = $derived(
    mentionQuery
      ? mentionItems.filter((item) => item.label.toLowerCase().includes(mentionQuery.toLowerCase()))
      : mentionItems
  );

  function detectMention() {
    if (!ref) return;

    const cursorPos = ref.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex >= 0) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      const hasClosingBracket = textAfterAt.includes(')');

      if ((charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) && !hasClosingBracket) {
        mentionStartIndex = lastAtIndex;
        mentionQuery = textAfterAt;
        selectedIndex = 0;
        showPopover = true;
        return;
      }
    }

    showPopover = false;
  }

  function insertMention(item: MentionItem) {
    const before = value.slice(0, mentionStartIndex);
    const afterCursor = ref ? value.slice(ref.selectionStart) : '';
    const mention = `@[${item.label}](${item.type}:${item.id}) `;

    value = before + mention + afterCursor;
    showPopover = false;

    requestAnimationFrame(() => {
      if (ref) {
        ref.focus();
        const newPos = before.length + mention.length;
        ref.setSelectionRange(newPos, newPos);
      }
    });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (showPopover && filteredItems.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % filteredItems.length;
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        insertMention(filteredItems[selectedIndex]);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        showPopover = false;
        return;
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit?.();
    }
  }
</script>

<div data-slot="chat-textarea" class={cn('ui:relative', className)}>
  {#if showPopover && mentionItems.length > 0}
    <div class="ui:absolute ui:bottom-full ui:left-0 ui:z-50 ui:mb-1">
      {#if icon}
        <MentionPopover
          items={mentionItems}
          query={mentionQuery}
          {selectedIndex}
          onSelect={insertMention}
          {icon}
          {typeLabel}
          {emptyMessage}
        />
      {:else}
        <MentionPopover
          items={mentionItems}
          query={mentionQuery}
          {selectedIndex}
          onSelect={insertMention}
          {typeLabel}
          {emptyMessage}
        />
      {/if}
    </div>
  {/if}

  <div
    class="ui:border-input ui:focus-within:border-ring ui:focus-within:ring-ring/50 ui:rounded-lg ui:border ui:shadow-xs ui:transition-[color,box-shadow] ui:focus-within:ring-[3px]"
  >
    <Textarea
      bind:ref
      bind:value
      oninput={detectMention}
      onkeydown={handleKeydown}
      {placeholder}
      {disabled}
      {rows}
      class="ui:min-h-0 ui:max-h-32 ui:resize-none ui:border-0 ui:py-2 ui:text-sm ui:shadow-none ui:focus-visible:ring-0"
    />

    {#if actions}
      <div class="ui:flex ui:items-center ui:gap-1 ui:px-2 ui:pb-2">
        {@render actions()}
      </div>
    {/if}
  </div>
</div>
