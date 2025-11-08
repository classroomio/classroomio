<script lang="ts">
  interface Props {
    header?: import('svelte').Snippet;
    body?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  }

  let { header, body, footer }: Props = $props();
</script>

<div class="root m-auto flex h-full flex-col justify-between">
  {#if header}
    <!-- HEADER -->
    <div class="header">
      {@render header?.()}
    </div>
  {/if}

  {#if body}
    <!-- BODY -->
    <div class="body mb-3">
      {@render body?.()}
    </div>
  {/if}

  {#if footer}
    <!-- FOOTER -->
    <div class="footer m-auto bg-white px-2 py-6 dark:bg-neutral-800">
      {@render footer?.()}
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
