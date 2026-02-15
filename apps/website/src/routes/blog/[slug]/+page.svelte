<script lang="ts">
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import { Badge } from '@cio/ui/base/badge';
  import { formatDate } from '$lib/utils/format-date';
  import { Button } from '@cio/ui/base/button';

  import { BlogListItem } from '$lib/components';

  let { data } = $props();
</script>

<div class=" mt-[10%] md:mt-16">
  {#if data}
    <article class="py-16">
      <!-- Title -->
      <hgroup class="flex w-full flex-col items-center justify-center text-center">
        <p class="text-sm text-gray-500">{formatDate(data.meta.date)}</p>
        <p class="py-2 text-center text-3xl font-bold md:w-[60%]">{@html data.meta.title}</p>
      </hgroup>
      <main class="mx-auto max-w-3xl px-4 lg:px-8">
        <div class="my-2 flex items-center justify-start gap-4 border-y border-gray-200 py-4">
          <img loading="lazy" src={data.meta.avatar} alt="avatar" class="h-10 w-10 rounded-full" />
          <span>
            <p class="font-semibold">{data.meta.author}</p>
            <p class="text-gray-500">{data.meta.role}</p>
          </span>
        </div>

        <!-- Post -->
        <div class="prose border-b-2 border-gray-200 pt-2 pb-4">
          <data.content />
          <!-- Tags -->
          <div class="flex gap-2 py-4">
            {#each data.meta.tags as tag}
              <Badge variant="outline">{tag}</Badge>
            {/each}
          </div>
        </div>

        {#if data.relatedPosts.length > 0}
          <section class="mt-5">
            <p class="text-xl font-semibold">Related Posts</p>
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
    border-radius: 0.375rem;
  }

  :global(.prose .gallery) {
    overflow-x: scroll;
  }
</style>
