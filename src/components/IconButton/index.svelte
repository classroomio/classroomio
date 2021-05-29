<script>
  import ToolTip from "../ToolTip/index.svelte";
  export let onClick;
  export let disabled = false;
  export let selected = false;
  export let value;
  export let title;

  function handleClick() {
    onClick(value);
  }
</script>

<style lang="scss">
  .root {
    flex: 0 0 auto;
    color: rgba(0, 0, 0, 0.54);
    padding: 12px;
    font-size: 1.5rem;
    text-align: center;
    transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    border-radius: 50%;
    border: 0;
    cursor: pointer;
    margin: 0;
    display: flex;
    outline: 0;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    -webkit-appearance: none;
    -webkit-tap-highlight-color: transparent;
    width: fit-content;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  }
</style>

<ToolTip title={title}>
  <button
    class={`root ${selected && 'active'}`}
    {disabled}
    on:click={handleClick}>
    <slot />
  </button>

</ToolTip>