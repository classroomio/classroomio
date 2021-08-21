<script>
  export let value;
  export let placeholder = ``;
  const activeClassName = 'border-b-2 border-blue-700';
  let isWriteMode = true;

  const handleTabClick = (tab) => (event) => {
    isWriteMode = tab === 1;
  };
</script>

<div class="root">
  <div class="flex justify-center">
    <button
      on:click={handleTabClick(1)}
      class="focus:outline-none p-2 {isWriteMode && `${activeClassName}`}"
    >
      Write
    </button>
    <button
      on:click={handleTabClick(2)}
      class="focus:outline-none p-2 {!isWriteMode && `${activeClassName}`}"
    >
      Preview
    </button>
  </div>

  <div class="m-2 mb-0 p-0">
    {#if isWriteMode}
      <textarea
        bind:value
        {placeholder}
        class="border border-gray rounded-md p-2"
      />
    {:else}
      <article class="m-auto preview prose prose-sm sm:prose p-2">
        <slot name="preview" />
      </article>
    {/if}
  </div>
</div>

<style>
  .root {
    width: 100%;
    min-height: 200px;
  }

  textarea {
    width: 100%;
    height: 500px;
  }

  .preview {
    min-height: 150px;
  }

  .octicon {
    display: inline-block;
    vertical-align: text-top;
    fill: currentColor;
  }
</style>
