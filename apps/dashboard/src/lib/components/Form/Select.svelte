<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    label?: string;
    value: any;
    options?: any[];
    labelKey?: string;
    valueKey?: string;
    isRequired?: boolean;
    className?: string;
    selectClassName?: string;
    onChange?: (value: any) => void;
  }

  let {
    label = '',
    value = $bindable(),
    options = [],
    labelKey = 'label',
    valueKey = 'value',
    isRequired = false,
    className = '',
    selectClassName = '',
    onChange = () => {}
  }: Props = $props();

  // -- convert value to string
  let selectedValue = $state(value ? String(value[valueKey] ?? value) : '');

  function handleValueChange(newValue: string) {
    const selectedOption = options.find((opt) => String(opt[valueKey] ?? opt) === newValue);
    value = selectedOption;
    onChange(selectedOption);
  }

  $effect(() => {
    selectedValue = value ? String(value[valueKey] ?? value) : '';
  });

  const triggerContent = $derived(value ? value[labelKey] : 'Select an option');
</script>

<div class="block {className}">
  {#if label}
    <span class="mr-2 text-gray-700 dark:text-white">{label}</span>
  {/if}
  <Select.Root type="single" value={selectedValue} onValueChange={handleValueChange} required={isRequired}>
    <Select.Trigger class="mt-1 w-full {selectClassName}">
      {$t(triggerContent)}
    </Select.Trigger>
    <Select.Content>
      <Select.Group>
        {#each options as option}
          <Select.Item value={String(option[valueKey] ?? option)} label={option[labelKey]}>
            {option[labelKey]}
          </Select.Item>
        {/each}
      </Select.Group>
    </Select.Content>
  </Select.Root>
</div>
