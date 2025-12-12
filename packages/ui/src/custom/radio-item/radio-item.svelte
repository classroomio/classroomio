<script lang="ts">
  import * as RadioGroup from '../../base/radio-group';
  import { InputField } from '../input-field';
  import { cn } from '../../tools';

  interface Props {
    label?: string | null;
    value?: string;
    checked?: boolean;
    name?: string;
    isEditable?: boolean;
    disabled?: boolean;
    className?: string;
    onchange?: (e: Event) => void;
    children?: import('svelte').Snippet;
  }

  let {
    label = $bindable(''),
    value = '',
    checked = false,
    name = '',
    isEditable = false,
    disabled = false,
    className = '',
    onchange = () => {},
    children
  }: Props = $props();
</script>

<div class={cn('group inline-flex w-full items-center', disabled ? 'cursor-not-allowed' : 'cursor-pointer', className)}>
  <RadioGroup.Item {value} disabled={disabled || isEditable} />
  {#if isEditable}
    <div class="w-2/4">
      <InputField bind:value={label} placeholder="Your option" className="ml-1" type="text" {onchange} />
    </div>
  {:else}
    <span class="ml-2 dark:text-white">{label}</span>
  {/if}

  {@render children?.()}
</div>
