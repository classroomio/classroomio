<div class="root flex flex-col h-full m-auto">
  {#if $$slots.header}
    <!-- HEADER -->
    <div class="header">
      <slot name="header" />
    </div>
  {/if}

  {#if $$slots.body}
    <!-- BODY -->
    <div class="body mb-3">
      <slot name="body" />
    </div>
  {/if}

  {#if $$slots.footer}
    <!-- FOOTER -->
    <div class="footer bg-white dark:bg-gray-700 py-6 px-4 m-auto">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  .root {
    max-width: 680px;
    width: 80%;
    height: 95vh;
  }

  .header {
    height: 15%;
  }

  .body {
    min-height: 60%;
    height: fit-content;
  }

  .footer {
    max-width: 400px;
  }
</style>
