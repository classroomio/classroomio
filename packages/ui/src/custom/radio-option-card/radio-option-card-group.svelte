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
  }

  let { options, value = $bindable(''), class: className, titleSuffix: parentTitleSuffix }: Props = $props();
</script>

<RadioGroup.Root bind:value class={cn('ui:grid ui:gap-3 ui:md:grid-cols-2', className)}>
  {#each options as option (option.id)}
    <RadioOptionCard
      id={option.id}
      title={option.title}
      description={option.description}
      value={option.value}
      disabled={option.disabled}
    >
      {#snippet titleSuffix()}
        {@render parentTitleSuffix?.(option)}
      {/snippet}
    </RadioOptionCard>
  {/each}
</RadioGroup.Root>
