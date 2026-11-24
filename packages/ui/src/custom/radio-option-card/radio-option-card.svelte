<script lang="ts">
  import * as Field from '../../base/field';
  import * as RadioGroup from '../../base/radio-group';
  import { cn } from '../../tools';

  interface Props {
    id: string;
    title: string;
    description: string;
    value: string;
    disabled?: boolean;
    titleSuffix?: import('svelte').Snippet;
    /** Overridable CSS class (e.g. for grid column span or custom layout) */
    class?: string;
    /** Reserved for parent content (e.g. when used inside RadioOptionCardGroup) */
    children?: import('svelte').Snippet;
    /** `tile` renders a numbered card that fills the brand colour when selected. */
    variant?: 'card' | 'tile';
    /** Zero-based position, rendered as a two-digit number by the `tile` variant. */
    index?: number;
  }

  let {
    id,
    title,
    description,
    value,
    disabled = false,
    titleSuffix,
    class: className,
    children: _children,
    variant = 'card',
    index
  }: Props = $props();

  const displayIndex = $derived(index === undefined ? '' : String(index + 1).padStart(2, '0'));
</script>

{#if variant === 'tile'}
  <Field.Label
    for={id}
    class={cn(
      'cio-tile ui:relative ui:block ui:min-h-[148px] ui:w-full ui:rounded-[10px] ui:border-0 ui:p-0 ui:text-left ui:has-data-[state=checked]:bg-transparent',
      className
    )}
    style="--notch-x: 24px"
  >
    <span
      class="tile-face ui:notch-cutout ui:absolute ui:inset-0 ui:flex ui:flex-col ui:gap-1 ui:rounded-[10px] ui:px-5 ui:pt-7 ui:pb-5"
    >
      <span class="tile-kind ui:mb-2 ui:font-mono ui:text-[11px] ui:tracking-[0.12em]">{displayIndex}</span>
      <span
        class="ui:flex ui:items-center ui:gap-2 ui:text-lg ui:leading-[1.25] ui:font-semibold ui:tracking-[-0.02em]"
      >
        {title}
        {#if titleSuffix}
          {@render titleSuffix()}
        {/if}
      </span>
      {#if description}
        <span class="tile-hint ui:mt-auto ui:text-sm ui:leading-[1.4]">{description}</span>
      {/if}
    </span>
    <RadioGroup.Item {value} {id} aria-label={title} {disabled} class="ui:sr-only" />
  </Field.Label>
{:else}
  <Field.Label for={id} class={className}>
    <Field.Field orientation="horizontal">
      <Field.Content class="ui:min-w-0">
        <Field.Title class="ui:flex ui:items-center ui:gap-2">
          {title}
          {#if titleSuffix}
            {@render titleSuffix()}
          {/if}
        </Field.Title>
        {#if description}
          <Field.Description>{description}</Field.Description>
        {/if}
      </Field.Content>
      <RadioGroup.Item {value} {id} aria-label={title} {disabled} />
    </Field.Field>
  </Field.Label>
{/if}

<style>
  .tile-face {
    background: var(--muted);
    color: var(--foreground);
    transition:
      background-color 160ms cubic-bezier(0.22, 1, 0.36, 1),
      color 160ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .tile-kind {
    color: var(--primary);
  }

  .tile-hint {
    color: var(--muted-foreground);
  }

  :global(.cio-tile:hover) .tile-face {
    background: color-mix(in srgb, var(--foreground) 6%, var(--muted));
  }

  :global(.cio-tile:has(:focus-visible)) {
    outline: 2px solid color-mix(in srgb, var(--primary) 32%, transparent);
    outline-offset: 3px;
  }

  :global(.cio-tile:has([data-state='checked'])) .tile-face {
    background: var(--primary);
    color: var(--primary-foreground);
  }

  :global(.cio-tile:has([data-state='checked'])) .tile-kind {
    color: color-mix(in srgb, var(--primary) 32%, white);
  }

  :global(.cio-tile:has([data-state='checked'])) .tile-hint {
    color: color-mix(in srgb, var(--primary) 17%, white);
  }

  @media (prefers-reduced-motion: reduce) {
    .tile-face {
      transition: none;
    }
  }
</style>
