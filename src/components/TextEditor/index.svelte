<script>
  import marked from 'marked';

  let isWriteMode = true;
  export let value = ``;
  export let placeholder = ``;
  const activeClassName = 'border-b-2 border-blue-700';;

  const handleTabClick = tab => event => {
    isWriteMode = tab === 1
  }
</script>

<style>
  .root {
    width: 100%;
    min-height: 200px;
  }

  textarea {
    width: 100%;
    height: 150px;
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

<div class="root mt-5 border border-gray rounded-md">
  <div class="p-2 pb-0">
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
        placeholder="{placeholder}"
        class="border border-gray rounded-md p-2"
      ></textarea>
    {:else}
      <article class="preview prose prose-sm sm:prose p-2">
        {@html marked(value)}
      </article>
    {/if}
  </div>
  {#if !isWriteMode}
    <hr>
  {/if}
  <div class="flex justify-between items-center px-2 pb-1">
    <div class="flex items-center text-sm">
      <svg
        class="octicon mr-2"
        height="16"
        viewBox="0 0 16 16"
        version="1.1"
        width="16"
        aria-hidden="true"
      >
        <path fill-rule="evenodd" d="M14.85 3H1.15C.52 3 0 3.52 0 4.15v7.69C0 12.48.52 13 1.15 13h13.69c.64 0 1.15-.52 1.15-1.15v-7.7C16 3.52 15.48 3 14.85 3zM9 11H7V8L5.5 9.92 4 8v3H2V5h2l1.5 2L7 5h2v6zm2.99.5L9.5 8H11V5h2v3h1.5l-2.51 3.5z"></path>
      </svg>
      <span>Styling with Markdown is supported</span>
    </div>

    <button class="bg-blue-700 hover:bg-blue-900 text-white font-bold py-1 px-3 rounded">
      Answer
    </button>
  </div>
</div>