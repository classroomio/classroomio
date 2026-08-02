<script lang="ts">
  import { Button } from '../button';
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    contentClass: contentClassName,
    hasChanges = false,
    loading = false,
    disabled = false,
    statusLabel,
    discardLabel,
    saveLabel,
    onSave,
    onDiscard,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    contentClass?: string;
    hasChanges?: boolean;
    loading?: boolean;
    disabled?: boolean;
    statusLabel: string;
    discardLabel: string;
    saveLabel: string;
    onSave?: () => void | Promise<void>;
    onDiscard?: () => void;
  } = $props();

  const actionsDisabled = $derived(!hasChanges || loading);

  let dockSentinel: HTMLDivElement | null = $state(null);
  let isDocked = $state(true);

  $effect(() => {
    if (!dockSentinel) return;

    const observer = new IntersectionObserver(([entry]) => {
      isDocked = entry.isIntersecting;
    });
    observer.observe(dockSentinel);

    return () => observer.disconnect();
  });
</script>

<div bind:this={ref} class={cn('ui:shrink-0', className)} {...restProps}>
  <div data-slot="page-settings-actions" class="ui:sticky ui:bottom-0 ui:z-10 ui:pb-4">
    <div
      class={cn(
        'ui:flex ui:flex-col ui:gap-3 ui:sm:flex-row ui:sm:items-center ui:sm:justify-between',
        'ui:rounded-lg ui:border ui:border-border ui:bg-background ui:p-4 ui:transition-shadow',
        !isDocked && 'ui:shadow-md',
        contentClassName
      )}
    >
      <p class="ui:text-sm ui:text-muted-foreground">{statusLabel}</p>

      <div class="ui:flex ui:shrink-0 ui:items-center ui:justify-end ui:gap-2">
        <Button variant="ghost" type="button" disabled={actionsDisabled} onclick={onDiscard}>
          {discardLabel}
        </Button>
        <Button type="button" {loading} disabled={actionsDisabled || disabled} onclick={onSave}>
          {saveLabel}
        </Button>
      </div>
    </div>
  </div>

  <div
    bind:this={dockSentinel}
    data-slot="page-settings-actions-sentinel"
    class="ui:h-px ui:shrink-0"
    aria-hidden="true"
  ></div>
</div>
