<script>
  import ToolTip from '../ToolTip/index.svelte';
  export let onClick = () => {};
  export let stopPropagation = false;
  export let disabled = false;
  export let selected = false;
  export let buttonClassName = '';
  export let contained = false;
  export let value = '';
  export let type = 'button';
  export let size = 'large';
  export let color = '';
  export let toolTipProps = {
    title: '',
    hotkeys: [],
    direction: ''
  };

  function handleClick(e) {
    if (stopPropagation) {
      e.stopPropagation();
    }
    onClick(value);
  }
</script>

<ToolTip
  title={toolTipProps.title}
  hotkeys={toolTipProps.hotkeys}
  direction={toolTipProps.direction}
>
  <button
    class="root {color} {selected && 'active'} {size} {contained &&
      'contained dark:bg-neutral-700'} {buttonClassName}"
    {disabled}
    {type}
    on:click={handleClick}
  >
    <slot />
  </button>
</ToolTip>

<style lang="scss">
  .root {
    flex: 0 0 auto;
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

  .root.small {
    padding: 5px;
  }

  .contained {
    background-color: rgba(0, 0, 0, 0.04);
  }
</style>
