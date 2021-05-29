<script>
  export let title;
</script>

<style>
  .tooltip {
    position: relative;
    display: inline-block;
  }

  .tooltip .tooltiptext {
    color: #fff;
    padding: 4px 8px;
    font-size: 0.625rem;
    max-width: 300px;
    word-wrap: break-word;
    font-family: "Roboto", "Helvetica", "Arial", sans-serif;
    font-weight: 500;
    line-height: 1.4em;
    border-radius: 4px;
    background-color: rgba(97, 97, 97, 0.9);
    visibility: hidden;
    text-align: center;

    /* Position the tooltip */
    position: absolute;
    z-index: 1;
    top: 100%;
    left: 0;
  }

  .tooltip:hover .tooltiptext {
    visibility: visible;
  }
</style>

{#if !!title}
  <div class="tooltip">
    <span class="tooltiptext">{title}</span>
    <slot />
  </div>
{:else}
  <slot />
{/if}
