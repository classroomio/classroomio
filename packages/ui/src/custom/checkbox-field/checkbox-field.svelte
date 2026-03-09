<script lang="ts">
  import { Checkbox } from '../../base/checkbox';
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
    checked = $bindable(false),
    name = '',
    isEditable = false,
    disabled = false,
    className = '',
    onchange = () => {},
    children
  }: Props = $props();
</script>

<div
  class={cn(
    'group ui:inline-flex ui:w-full ui:items-center',
    disabled ? 'cursor-not-allowed' : 'cursor-pointer',
    className
  )}
>
  <Checkbox {name} {value} disabled={disabled || isEditable} bind:checked />
  {#if isEditable}
    <div class="ui:w-2/4">
      <InputField bind:value={label} placeholder="Your option" className="ui:ml-1" type="text" {onchange} />
    </div>
  {:else}
    <span class="ui:ml-2 ui:dark:text-white">{label}</span>
  {/if}

  {@render children?.()}
</div>
