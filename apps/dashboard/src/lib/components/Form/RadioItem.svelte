<script lang="ts">
  import TextField from '$lib/components/Form/TextField.svelte';
  interface Props {
    label?: string;
    value?: string;
    checked?: boolean;
    name?: string;
    isEditable?: boolean;
    disabled?: boolean;
    className?: string;
    onChange?: any; // This is to know if element is 'dirty'
    iconbutton?: import('svelte').Snippet;
  }

  let {
    label = $bindable(''),
    value = '',
    checked = false,
    name = '',
    isEditable = false,
    disabled = false,
    className = '',
    onChange = () => {},
    iconbutton
  }: Props = $props();
</script>

<label class="{className} inline-flex w-full items-center {disabled ? 'cursor-not-allowed' : 'cursor-pointer'}">
  <input class="form-radio" type="radio" {checked} {name} {value} disabled={disabled || isEditable} />
  {#if isEditable}
    <div class="w-2/4">
      <TextField bind:value={label} placeholder="Your option" className="ml-1" type="text" {onChange} />
    </div>
  {:else}
    <span class="ml-2 dark:text-white">{label}</span>
  {/if}

  {@render iconbutton?.()}
</label>
