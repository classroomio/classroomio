<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';

  import { t } from '$lib/utils/functions/translations';

  let { src, className, alt }: { src: string | undefined; className?: string; alt?: string } = $props();

  function loadImage(src: string | undefined): Promise<void> {
    if (!src) return Promise.reject();
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }
</script>

{#await loadImage(src)}
  <div class="flex max-h-[215px] w-full items-center justify-center rounded bg-gray-100 dark:bg-neutral-800">
    <Skeleton class={className} />
  </div>
{:then}
  <img {src} {alt} class={className} />
{:catch}
  <div class="flex h-[200px] w-full items-center justify-center rounded bg-gray-100 dark:bg-neutral-800">
    <p class="text-sm text-red-600">{$t('courses.course_card.error_message')}</p>
  </div>
{/await}

