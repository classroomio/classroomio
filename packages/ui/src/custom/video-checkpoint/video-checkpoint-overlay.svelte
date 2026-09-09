<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Button } from '../../base/button';
  import { cn } from '../../tools';

  interface Props {
    kicker: string;
    continueLabel: string;
    continueDisabled?: boolean;
    errorMessage?: string;
    onContinue?: () => void;
    questionBody: Snippet;
    class?: string;
  }

  let {
    kicker,
    continueLabel,
    continueDisabled = false,
    errorMessage = '',
    onContinue,
    questionBody,
    class: className = ''
  }: Props = $props();

  const uid = $props.id();
  const kickerId = `${uid}-kicker`;
  const errorId = `${uid}-error`;
  const hasError = $derived(errorMessage.trim().length > 0);
</script>

<div
  class={cn(
    'ui:absolute ui:inset-0 ui:z-30 ui:grid ui:place-items-center ui:bg-[rgb(8_10_18/0.72)] ui:p-6 ui:backdrop-blur-[6px] ui:motion-reduce:backdrop-blur-none',
    className
  )}
  role="dialog"
  aria-modal="true"
  aria-labelledby={kickerId}
  aria-describedby={hasError ? errorId : undefined}
>
  <div
    class="ui:bg-card ui:text-card-foreground ui:border-border ui:flex ui:max-h-[min(78%,32.5rem)] ui:w-full ui:max-w-[520px] ui:flex-col ui:overflow-hidden ui:rounded-lg ui:border ui:p-5 ui:pb-4 ui:shadow-md"
  >
    <p
      id={kickerId}
      class="ui:text-muted-foreground ui:mb-1.5 ui:shrink-0 ui:text-[11px] ui:font-semibold ui:tracking-[0.06em] ui:uppercase"
    >
      {kicker}
    </p>

    <div class="ui:min-h-0 ui:flex-1 ui:overflow-y-auto">
      {@render questionBody()}
    </div>

    {#if hasError}
      <p id={errorId} class="ui:text-destructive ui:mt-1 ui:mb-2.5 ui:shrink-0 ui:text-[13px]" role="alert">
        {errorMessage}
      </p>
    {/if}

    <div class="ui:mt-3 ui:flex ui:shrink-0 ui:justify-end">
      <Button type="button" disabled={continueDisabled} onclick={() => onContinue?.()}>
        {continueLabel}
      </Button>
    </div>
  </div>
</div>
