<script lang="ts">
  import { page } from '$app/state';

  import { Snackbar } from '$features/ui';
  import merge from 'lodash/merge';
  import { MetaTags } from 'svelte-meta-tags';
  import { ModeWatcher } from '@cio/ui/base/dark-mode';

  import '../app.css';

  let { data, children } = $props();

  const metaTags = $derived(merge(data.baseMetaTags, page.data.pageMetaTags));
</script>

<div>
  <ModeWatcher />

  <MetaTags {...metaTags} />

  <Snackbar />

  {@render children?.()}
</div>

<style>
  :global(:root) {
    --main-primary-color: rgba(29, 78, 216, 1);
    --border-color: #eaecef;
  }

  :global(.dark svg.dark) {
    fill: #fff;
  }

  :global(.border-c) {
    border: 1px solid var(--border-color);
  }

  :global(.border-bottom-c) {
    border-bottom: 1px solid var(--border-color);
  }

  :global(.cards-container) {
    width: 90%;
    margin: 0 auto;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    column-gap: 12px;
    row-gap: 12px;
  }

  @media screen and (max-width: 768px) {
    :global(.cards-container) {
      width: 95%;
      margin: 0 auto;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      column-gap: 12px;
      row-gap: 12px;
    }
  }
</style>
