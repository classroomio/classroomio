<script lang="ts">
  import { cn } from '../../tools';
  import CheckboxOptionCard from './checkbox-option-card.svelte';

  export interface CheckboxOptionCardOption {
    id: string;
    title: string;
    description?: string;
    value: string;
    disabled?: boolean;
  }

  type SnippetWithOption = import('svelte').Snippet<[option: CheckboxOptionCardOption]>;

  interface Props {
    options: CheckboxOptionCardOption[];
    /** Bound array of selected option values */
    value?: string[];
    /** Overridable CSS class for the grid container (e.g. grid-cols-2, md:grid-cols-3) */
    class?: string;
    titleSuffix?: SnippetWithOption;
    leading?: SnippetWithOption;
    footer?: SnippetWithOption;
  }

  let {
    options,
    value = $bindable([]),
    class: className,
    titleSuffix: parentTitleSuffix,
    leading: parentLeading,
    footer: parentFooter
  }: Props = $props();

  function toggle(optionValue: string, isChecked: boolean) {
    if (isChecked) {
      if (value.includes(optionValue)) {
        return;
      }

      value = [...value, optionValue];
      return;
    }

    value = value.filter((entry) => entry !== optionValue);
  }
</script>

<div role="group" data-slot="checkbox-option-card-group" class={cn('ui:grid ui:gap-3', className)}>
  {#each options as option (option.id)}
    <CheckboxOptionCard
      id={option.id}
      title={option.title}
      description={option.description}
      checked={value.includes(option.value)}
      disabled={option.disabled}
      onCheckedChange={(isChecked) => toggle(option.value, isChecked)}
    >
      {#snippet titleSuffix()}
        {@render parentTitleSuffix?.(option)}
      {/snippet}
      {#snippet leading()}
        {@render parentLeading?.(option)}
      {/snippet}
      {#snippet footer()}
        {@render parentFooter?.(option)}
      {/snippet}
    </CheckboxOptionCard>
  {/each}
</div>
