<script lang="ts">
  interface Props {
    show?: boolean;
    children?: import('svelte').Snippet;
  }

  let { show = true, children }: Props = $props();
</script>

<section class="root z-10">
  {#if show}
    <div class="relative h-full bg-white dark:bg-black">
      {@render children?.()}
    </div>
  {/if}
</section>

<style lang="scss">
  .root {
    height: 100vh;
    display: flex;
    flex-direction: column;
    min-width: 300px;
    max-width: 300px;
    top: 0;
    left: 0;
    border-right: 1px solid var(--border-color);
    background-color: rgb(250, 251, 252);
  }

  .toggler {
    right: -15px;
    z-index: 10;
    border: 1px solid var(--border-color);
    top: 50px;
    height: fit-content;
    background: var(--border-color);
  }

  @media (max-width: 760px) {
  }
</style>
