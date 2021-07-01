<script>
  // import
</script>

<div class="m-3">
  {#if $$slots.header}
    <div
      class="head flex bg-white items-center justify-between sticky right-0 w-full"
    >
      <slot name="header" />
    </div>
  {/if}

  <slot />
</div>

<style>
  .head {
    top: 63px;
    z-index: 2;
  }
</style>
