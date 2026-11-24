<script lang="ts">
  import { cn } from '../../tools';
  import * as RadioGroup from '../../base/radio-group';
  import RadioOptionCard from './radio-option-card.svelte';

  export interface RadioOptionCardOption {
    id: string;
    title: string;
    description: string;
    value: string;
    disabled?: boolean;
  }

  type TitleSuffixSnippet = import('svelte').Snippet<[option: RadioOptionCardOption]>;

  interface Props {
    options: RadioOptionCardOption[];
    value?: string;
    /** Overridable CSS class for the grid container (e.g. grid-cols-2, md:grid-cols-3) */
    class?: string;
    titleSuffix?: TitleSuffixSnippet;
    onConfirm?: () => void;
    onChange?: (value: string) => void;
    /** `tile` renders numbered cards that fill the brand colour when selected. */
    variant?: 'card' | 'tile';
  }

  let {
    options,
    value = $bindable(''),
    class: className,
    titleSuffix: parentTitleSuffix,
    onConfirm,
    onChange,
    variant = 'card'
  }: Props = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.repeat || event.isComposing) return;

    event.preventDefault();

    if (onConfirm) {
      onConfirm();
      return;
    }

    (event.currentTarget as HTMLElement).closest('form')?.requestSubmit();
  }
</script>

<RadioGroup.Root
  bind:value
  class={cn(
    variant === 'tile' ? 'ui:grid ui:gap-2.5 ui:sm:grid-cols-2' : 'ui:grid ui:gap-3 ui:md:grid-cols-2',
    className
  )}
  onkeydown={handleKeydown}
  onValueChange={(next) => onChange?.(next)}
>
  {#each options as option, index (option.id)}
    <RadioOptionCard
      id={option.id}
      title={option.title}
      description={option.description}
      value={option.value}
      disabled={option.disabled}
      {variant}
      {index}
    >
      {#snippet titleSuffix()}
        {@render parentTitleSuffix?.(option)}
      {/snippet}
    </RadioOptionCard>
  {/each}
</RadioGroup.Root>
