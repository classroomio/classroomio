<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { renderMathInElement } from '@cio/ui/tools';

  let { children, className = '', id = '', disableMaxWidth = false } = $props();
  let container: HTMLElement | undefined;

  onMount(() => {
    if (!container) return;

    let renderScheduled = false;

    const renderMath = async () => {
      if (!container || renderScheduled) return;

      renderScheduled = true;

      try {
        await tick();
        renderMathInElement(container);
      } finally {
        renderScheduled = false;
      }
    };

    void renderMath();

    const observer = new MutationObserver(() => {
      void renderMath();
    });

    observer.observe(container, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  });
</script>

<article
  bind:this={container}
  style:max-width={disableMaxWidth ? 'unset' : undefined}
  {id}
  class="preview prose sm:prose-sm {className} dark:text-white"
>
  {@render children()}
</article>
