<script lang="ts">
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import { Badge } from '@cio/ui/base/badge';
  import { formatDate } from '$lib/utils/format-date';
  import { Button } from '@cio/ui/base/button';

  import { BlogListItem } from '$lib/components';

  let { data } = $props();
</script>

<div class="mt-[10%] px-6 md:mt-16 md:px-10">
  {#if data}
    <article class="py-16">
      <hgroup class="flex w-full flex-col items-center justify-center text-center">
        <p class="text-label font-mono text-gray-500 uppercase">{formatDate(data.meta.date)}</p>
        <h1 class="text-title mt-4 max-w-[900px] text-center font-medium text-balance">{@html data.meta.title}</h1>
      </hgroup>
      <main class="max-w-lede mx-auto mt-10">
        <div class="my-4 flex items-center justify-start gap-4 border-y border-gray-200 py-4">
          <img loading="lazy" src={data.meta.avatar} alt="avatar" class="h-10 w-10 rounded-full" />
          <span>
            <p class="font-semibold">{data.meta.author}</p>
            <p class="text-gray-500">{data.meta.role}</p>
          </span>
        </div>

        <div class="prose border-b-2 border-gray-200 pt-2 pb-4">
          <data.content />
          <div class="flex gap-2 py-4">
            {#each data.meta.tags as tag}
              <Badge variant="outline" class="text-tag rounded-full! font-mono uppercase">{tag}</Badge>
            {/each}
          </div>
        </div>

        {#if data.relatedPosts.length > 0}
          <section class="mt-5">
            <h2 class="text-h4 font-medium">Related Posts</h2>
            <ul class="flex items-start justify-start gap-3 overflow-x-scroll">
              {#each data.relatedPosts as post}
                <li class="min-w-[80%] py-10 sm:w-80 sm:min-w-0">
                  <BlogListItem {post} isRecommended />
                </li>
              {/each}
            </ul>
          </section>
        {/if}

        <Button href="/blog" variant="link">
          <ChevronLeft /> Back to all posts
        </Button>
      </main>
    </article>
  {/if}
</div>

<style>
  article {
    margin-inline: auto;
  }

  :global(.prose a) {
    text-decoration: underline;
    font-weight: bold;
  }

  :global(.prose .gallery img) {
    max-height: 300px;
    border-radius: var(--radius-xl);
  }

  :global(.prose .gallery) {
    overflow-x: scroll;
  }
</style>
