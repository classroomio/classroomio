<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  let { value = $bindable(), placeholder = ``, preview } = $props();
  const activeClassName = 'border-b-2 border-primary-700';
  let isWriteMode = $state(true);

  const handleTabClick = (tab) => (event) => {
    isWriteMode = tab === 1;
  };
</script>

<div class="root">
  <div class="flex justify-center">
    <button
      onclick={handleTabClick(1)}
      class="p-2 focus:outline-none {isWriteMode && `${activeClassName}`}"
    >
      {$t('markdown_editor.write')}
    </button>
    <button
      onclick={handleTabClick(2)}
      class="p-2 focus:outline-none {!isWriteMode && `${activeClassName}`}"
    >
      {$t('markdown_editor.preview')}
    </button>
  </div>

  <div class="m-2 mb-0 p-0">
    {#if isWriteMode}
      <textarea bind:value {placeholder} class="border-gray rounded-md border p-2 dark:bg-gray-500"
      ></textarea>
    {:else}
      <article class="preview prose prose-sm sm:prose m-auto p-2">
        {@render preview?.()}
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
