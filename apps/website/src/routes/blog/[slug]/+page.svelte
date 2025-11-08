<script lang="ts">
  import { ChevronLeft } from 'carbon-icons-svelte';
  import Chip from '$lib/Chip/Chip.svelte';
  import { formatDate } from '$lib/utils/formatDate';
  import BlogListItem from '$lib/Blog/BlogListItem.svelte';

  export let data;
</script>

<div class=" mt-[10%] md:mt-16">
  {#if data}
    <article class="py-16">
      <!-- Title -->
      <hgroup class="flex flex-col items-center justify-center text-center w-full">
        <p class="text-sm text-gray-500">{formatDate(data.meta.date)}</p>
        <p class="font-bold text-3xl py-2 text-center md:w-[60%]">{@html data.meta.title}</p>
      </hgroup>
      <main class="mx-auto max-w-screen-md px-4 lg:px-8">
        <div class="flex items-center justify-start gap-4 my-2 border-y border-gray-200 py-4">
          <img loading="lazy" src={data.meta.avatar} alt="avatar" class="w-10 h-10 rounded-full" />
          <span>
            <p class="font-semibold">{data.meta.author}</p>
            <p class="text-gray-500">{data.meta.role}</p>
          </span>
        </div>

        <!-- Post -->
        <div class="prose pt-2 pb-4 border-b-2 border-gray-200">
          <svelte:component this={data.content} />
          <!-- Tags -->
          <div class="flex gap-2 py-4">
            {#each data.meta.tags as tag}
              <Chip label={tag} />
            {/each}
          </div>
        </div>

        {#if data.relatedPosts.length > 0}
          <section class="mt-5">
            <p class="text-xl font-semibold">Related Posts</p>
            <ul class="flex items-start justify-start gap-3 overflow-x-scroll">
              {#each data.relatedPosts as post}
                <li class="py-10 min-w-[80%] sm:w-80 sm:min-w-0">
                  <BlogListItem {post} isRecommended />
                </li>
              {/each}
            </ul>
          </section>
        {/if}

        <a
          href="/blog"
          class="flex font-medium items-center gap-2 text-slate-700 text-lg underline my-10"
        >
          <ChevronLeft class=" w-6 h-6 font-medium" /> Back to all posts
        </a>
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
