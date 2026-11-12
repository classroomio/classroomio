<script lang="ts">
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import { Button } from '../../base/button';
  import { cn } from '../../tools';

  interface Props {
    title: string;
    description?: string;
    dismissLabel: string;
    actionLabel?: string;
    actionIcon?: Snippet;
    align?: 'start' | 'end';
    storageKey?: string;
    class?: string;
    arrowClass?: string;
    testId?: string;
    onAction?: () => void;
    onDismiss?: () => void;
  }

  let {
    title,
    description,
    dismissLabel,
    actionLabel,
    actionIcon,
    align = 'end',
    storageKey,
    class: className,
    arrowClass,
    testId,
    onAction,
    onDismiss
  }: Props = $props();

  let visible = $state(false);

  function hasBeenSeen() {
    if (!storageKey) return false;

    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return true;
    }
  }

  function markSeen() {
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      return;
    }
  }

  function close() {
    visible = false;
    markSeen();
  }

  function dismiss() {
    close();
    onDismiss?.();
  }

  function runAction() {
    close();
    onAction?.();
  }

  onMount(() => {
    visible = !hasBeenSeen();
  });

  onDestroy(() => {
    if (visible) markSeen();
  });
</script>

{#if visible}
  <div
    role="note"
    class={cn(
      'ui:bg-primary ui:text-primary-foreground ui:absolute ui:top-full ui:z-30 ui:mt-3 ui:w-80 ui:max-w-[calc(100vw-2rem)] ui:rounded-lg ui:p-4 ui:text-left ui:shadow-lg',
      align === 'end' ? 'ui:right-0' : 'ui:left-0',
      className
    )}
    data-testid={testId}
  >
    <span
      class={cn(
        'ui:bg-primary ui:absolute ui:-top-1.5 ui:size-3 ui:rotate-45',
        align === 'end' ? 'ui:right-8' : 'ui:left-8',
        arrowClass
      )}
      aria-hidden="true"
    ></span>

    <p class="ui:text-sm ui:font-semibold ui:text-pretty">{title}</p>
    {#if description}
      <p class="ui:mt-1 ui:text-sm ui:text-pretty ui:opacity-90">{description}</p>
    {/if}

    <div class="ui:mt-3 ui:flex ui:items-center ui:justify-end ui:gap-2">
      <Button
        size="sm"
        variant="ghost"
        class="ui:bg-white/15! ui:text-white! ui:hover:bg-white/25!"
        testId={testId ? `${testId}-dismiss` : undefined}
        onclick={dismiss}
      >
        {dismissLabel}
      </Button>
      {#if actionLabel}
        <Button
          size="sm"
          variant="secondary"
          class="ui:text-primary! ui:bg-white! ui:hover:bg-white/90!"
          testId={testId ? `${testId}-action` : undefined}
          onclick={runAction}
        >
          {@render actionIcon?.()}
          {actionLabel}
        </Button>
      {/if}
    </div>
  </div>
{/if}
