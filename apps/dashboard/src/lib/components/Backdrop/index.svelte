<script lang="ts">
  export let disableCenteredContent = false;
  export let className = '';
</script>

<div
  class="root {!className.includes('opacity') && 'opacity-100'} {!disableCenteredContent &&
    'center'} {className}"
>
  <slot />
</div>

<style>
  .root {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    position: fixed;
    background-color: rgba(0, 0, 0, 0.3);
    -webkit-tap-highlight-color: transparent;
    color: #fff;
    z-index: 1201;
    transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  }

  .center {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
