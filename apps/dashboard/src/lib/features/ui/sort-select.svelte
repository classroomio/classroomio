<script lang="ts">
  import * as Select from '@cio/ui/base/select';

  export interface SortOption {
    label: string;
    value: string;
  }

  interface Props {
    options: SortOption[];
    value?: string;
    placeholder?: string;
    class?: string;
    onValueChange?: (value: string) => void;
  }

  let {
    options,
    value = $bindable(''),
    placeholder,
    class: className = 'min-w-[150px]',
    onValueChange
  }: Props = $props();

  const selectedLabel = $derived(
    options.find((o) => o.value === value)?.label ?? placeholder ?? options[0]?.label ?? ''
  );

  function handleChange(newValue: string) {
    value = newValue;
    onValueChange?.(newValue);
  }
</script>

<Select.Root type="single" {value} onValueChange={handleChange}>
  <Select.Trigger class={className}>
    {selectedLabel}
  </Select.Trigger>
  <Select.Content>
    {#each options as option (option.value)}
      <Select.Item value={option.value} label={option.label} disabled={option.value === value}>
        {option.label}
      </Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
