<script lang="ts">
  import { Button } from '../button';
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
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
</script>

<div
  bind:this={ref}
  data-slot="page-settings-actions"
  class={cn('ui:sticky ui:bottom-0 ui:z-20 ui:mt-6 ui:pb-4', className)}
  {...restProps}
>
  <div
    class={cn(
      'ui:flex ui:flex-col ui:gap-3 ui:sm:flex-row ui:sm:items-center ui:sm:justify-between',
      'ui:rounded-lg ui:border ui:border-border ui:bg-background ui:p-4 ui:shadow-md'
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
