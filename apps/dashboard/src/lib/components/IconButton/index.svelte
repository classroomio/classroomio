<script lang="ts">
  import ToolTip from '../ToolTip/index.svelte';

  interface Props {
    onClick?: any;
    stopPropagation?: boolean;
    disabled?: boolean;
    selected?: boolean;
    buttonClassName?: string;
    contained?: boolean;
    value?: string;
    type?: 'button' | 'submit' | 'reset' | null | undefined;
    size?: 'small' | 'large';
    color?: string;
    toolTipProps?: {
      title: string;
      hotkeys: string[];
      direction?: string;
    };
    children?: import('svelte').Snippet;
  }

  let {
    onClick = (v: string) => {},
    stopPropagation = false,
    disabled = false,
    selected = false,
    buttonClassName = '',
    contained = false,
    value = '',
    type = 'button',
    size = 'large',
    color = '',
    toolTipProps = {
      title: '',
      hotkeys: [],
      direction: ''
    },
    children
  }: Props = $props();

  function handleClick(e: Event) {
    if (stopPropagation) {
      e.stopPropagation();
    }
    onClick(value);
  }
</script>

<ToolTip
  title={toolTipProps.title}
  hotkeys={disabled ? [] : toolTipProps.hotkeys}
  direction={toolTipProps.direction}
>
  <button
    class="root {color} {selected && 'active'} {disabled && 'disabled'} {size} {contained &&
      'contained dark:bg-neutral-700'} {buttonClassName}"
    {disabled}
    {type}
    onclick={handleClick}
  >
    {@render children?.()}
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

    &.disabled {
      cursor: not-allowed;
      color: rgba(0, 0, 0, 0.07);
    }

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
