<script lang="ts">
  import { Checkbox } from '@cio/ui/base/checkbox';
  import TextField from '$lib/components/Form/TextField.svelte';

  interface Props {
    label?: string | null;
    value?: string;
    checked?: boolean;
    name?: string;
    isEditable?: boolean;
    disabled?: boolean;
    className?: string;
    onChange?: (checked: boolean) => void;
    children?: import('svelte').Snippet;
  }

  let {
    label = $bindable(''),
    value = '',
    checked = $bindable(false),
    name = '',
    isEditable = false,
    disabled = false,
    className = '',
    onChange = () => {},
    children
  }: Props = $props();

  function handleCheckedChange(newChecked: boolean | 'indeterminate') {
    if (typeof newChecked === 'boolean') {
      checked = newChecked;
      onChange(newChecked);
    }
  }
</script>

<div class="{className} group inline-flex w-full items-center {disabled ? 'cursor-not-allowed' : 'cursor-pointer'}">
  <Checkbox
    class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 focus:ring-offset-0"
    {name}
    {value}
    disabled={disabled || isEditable}
    {checked}
    onCheckedChange={handleCheckedChange}
  />
  {#if isEditable}
    <div class="w-2/4">
      <TextField bind:value={label} placeholder="Your option" className="ml-1" type="text" {onChange} />
    </div>
  {:else}
    <span class="ml-2 dark:text-white">{label}</span>
  {/if}

  {@render children?.()}
</div>
