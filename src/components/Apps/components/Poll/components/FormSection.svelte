<script>
  export let value;
  export let label;
  export let type = 'text';
  export let name = 'text';
  export let handleLabelButton;
  export let handleInputButton;
</script>

<div class="mb-3">
  {#if label}
    <p
      class="dark:text-white p-0 m-0 mb-1 uppercase text-sm font-bold text-gray-600"
    >
      {label}

      {#if typeof handleLabelButton === 'function'}
        <button class="text-xl px-3 ml-5" on:click={handleLabelButton}>
          +
        </button>
      {/if}
    </p>
  {/if}

  <div class="w-full">
    {#if type === 'text'}
      <input type="text" {name} class="p-2 rounded-md w-4/5" bind:value />
    {/if}

    {#if type === 'date'}
      <input type="date" {name} class="p-2 rounded-md w-4/5" bind:value />
    {/if}

    {#if typeof handleInputButton === 'function'}
      <button class="text-xl px-3 ml-5" on:click={handleInputButton}>
        -
      </button>
    {/if}
  </div>
</div>
