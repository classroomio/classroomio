<script lang="ts">
  interface Props {
    labelElement?: HTMLLabelElement;
    hex: string | undefined;
    label: string;
    name?: string;
    isOpen: boolean;
  }

  let { labelElement = $bindable(), hex, label, name, isOpen }: Props = $props();

  function preventNativePicker(event: Event) {
    event.preventDefault();
  }
</script>

<label
  bind:this={labelElement}
  class="ui:border-border relative block size-[34px] shrink-0 cursor-pointer overflow-hidden rounded-lg border focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ring)]"
  style:background-color={hex}
>
  <input
    type="color"
    {name}
    value={hex}
    aria-label={label}
    aria-haspopup="dialog"
    aria-expanded={isOpen}
    class="absolute size-px opacity-0"
    onclick={preventNativePicker}
    onmousedown={preventNativePicker}
  />
</label>
