<script lang="ts">
  export let title = '';
  export let hotkeys: string[] = [];
  export let direction = '';
</script>

{#if !!title}
  <div class="tooltip">
    <span
      class="tooltiptext z-20 {direction === 'right'
        ? 'right'
        : direction === 'top'
          ? 'top'
          : direction === 'bottom'
            ? 'bottom'
            : 'left'}"
    >
      {title}
      {#if Array.isArray(hotkeys) && hotkeys.length}
        <span class="shortcut">
          {#each hotkeys as hotkey}<span>{hotkey}</span>{/each}
        </span>
      {/if}
    </span>
    <slot />
  </div>
{:else}
  <slot />
{/if}

<style>
  .tooltip {
    position: relative;
    display: inline-block;
  }
  .top {
    bottom: 100%;
    left: 50%;
    right: unset !important;
    top: unset !important;
    transform: translateX(-50%);
    margin-bottom: 5px;
  }
  .right {
    left: 100%;
    top: 50%;
    right: unset !important;
    bottom: unset !important;
    transform: translateY(-50%);
    margin-left: 5px;
  }
  .bottom {
    top: 100%;
    left: 50%;
    right: unset !important;
    bottom: unset !important;
    transform: translateX(-50%);
    margin-top: 5px;
  }
  .left {
    right: 100%;
    top: 50%;
    left: unset !important;
    bottom: unset !important;
    transform: translateY(-50%);
    margin-right: 5px;
  }
  .tooltip .tooltiptext {
    color: #fff;
    padding: 10px 8px;
    font-size: 12px;
    font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
    line-height: 1.2em;
    background-color: #000;
    visibility: hidden;
    text-align: center;
    white-space: nowrap;
    position: absolute;
    z-index: 2;
  }

  .tooltip:hover .tooltiptext {
    visibility: visible;
  }

  .shortcut span {
    font-weight: lighter;
    padding: 2px 4px;
    background-color: rgba(97, 97, 97, 0.9);
    border-radius: 2px;
    margin-left: 5px;
  }
</style>
