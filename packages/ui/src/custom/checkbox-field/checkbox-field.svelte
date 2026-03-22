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
    /** When set, the whole row handles the click (e.g. multi-select). Avoids nesting a native button inside the checkbox control. */
    onclick?: () => void;
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
    onclick,
    children
  }: Props = $props();

  const rowClass = $derived(
    cn(
      'group ui:inline-flex ui:w-full ui:items-center ui:hover:bg-muted ui:rounded-md ui:p-2 ui:text-left',
      disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      className
    )
  );

  function handleRowClick() {
    if (disabled || onclick === undefined) return;
    onclick();
  }

  function handleRowKeydown(event: KeyboardEvent) {
    if (disabled || onclick === undefined) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onclick();
    }
  }
</script>

{#if onclick !== undefined}
  <div
    class={rowClass}
    role="button"
    tabindex={disabled ? -1 : 0}
    aria-pressed={checked}
    aria-disabled={disabled ? true : undefined}
    onclick={handleRowClick}
    onkeydown={handleRowKeydown}
  >
    <Checkbox class="ui:pointer-events-none" {name} {value} disabled={disabled || isEditable} bind:checked />
    {#if isEditable}
      <!-- Isolate text field from the row button (rare: onclick + isEditable) -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="ui:w-2/4" onclick={(e) => e.stopPropagation()}>
        <InputField bind:value={label} placeholder="Your option" className="ui:ml-1" type="text" {onchange} />
      </div>
    {:else}
      <span class="ui:ml-2 ui:dark:text-white ui:text-sm">{label}</span>
    {/if}

    {@render children?.()}
  </div>
{:else if isEditable}
  <div class={rowClass}>
    <Checkbox {name} {value} disabled={disabled || isEditable} bind:checked />
    <div class="ui:w-2/4">
      <InputField bind:value={label} placeholder="Your option" className="ui:ml-1" type="text" {onchange} />
    </div>

    {@render children?.()}
  </div>
{:else}
  <label class={rowClass}>
    <Checkbox {name} {value} {disabled} bind:checked />
    <span class="ui:ml-2 ui:dark:text-white ui:text-sm">{label}</span>

    {@render children?.()}
  </label>
{/if}
