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
</script>

{#if hasChanges}
  <div
    bind:this={ref}
    data-slot="page-settings-actions"
    class={cn(
      'ui:pointer-events-none ui:sticky ui:bottom-0 ui:z-50 ui:flex ui:shrink-0 ui:justify-center ui:px-2 ui:pb-4',
      className
    )}
    {...restProps}
  >
    <div
      role="status"
      aria-live="polite"
      class={cn(
        'ui:pointer-events-auto ui:flex ui:w-fit ui:max-w-full ui:flex-wrap ui:items-center ui:justify-center ui:gap-x-6 ui:gap-y-2 ui:rounded-lg ui:bg-foreground ui:px-3.5 ui:py-2 ui:text-background ui:shadow-lg',
        contentClassName
      )}
    >
      <div class="ui:flex ui:min-w-0 ui:items-center ui:gap-2">
        <span
          class="ui:flex ui:size-5 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-full ui:bg-primary ui:text-[11px] ui:font-semibold ui:leading-none ui:text-primary-foreground"
          aria-hidden="true"
        >
          !
        </span>
        <p class="ui:text-sm ui:font-medium">{statusLabel}</p>
      </div>

      <div class="ui:flex ui:shrink-0 ui:items-center ui:gap-2">
        <Button
          variant="secondary"
          size="sm"
          type="button"
          class="ui:bg-background ui:text-foreground ui:hover:bg-background/80"
          disabled={loading}
          onclick={onDiscard}
        >
          {discardLabel}
        </Button>
        <Button variant="default" size="sm" type="button" {loading} disabled={loading || disabled} onclick={onSave}>
          {saveLabel}
        </Button>
      </div>
    </div>
  </div>
{/if}
