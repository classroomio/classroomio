<script lang="ts">
  import { Button } from '../button';
  import FloatingBar from './page-floating-bar.svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { WithElementRef } from '../../tools';

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

<FloatingBar
  bind:ref
  show={hasChanges}
  status={statusLabel}
  class={className}
  contentClass={contentClassName}
  {...restProps}
>
  {#snippet badge()}
    <span
      class="ui:flex ui:size-5 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-full ui:bg-primary ui:text-[11px] ui:font-semibold ui:leading-none ui:text-primary-foreground"
      aria-hidden="true"
    >
      !
    </span>
  {/snippet}

  <Button
    variant="secondary"
    size="sm"
    type="button"
    testId="page-settings-discard"
    class="ui:bg-background ui:text-foreground ui:hover:bg-background/80"
    disabled={loading}
    onclick={onDiscard}
  >
    {discardLabel}
  </Button>
  <Button
    variant="default"
    size="sm"
    type="button"
    testId="page-settings-save"
    {loading}
    disabled={loading || disabled}
    onclick={onSave}
  >
    {saveLabel}
  </Button>
</FloatingBar>
