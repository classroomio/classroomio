<script lang="ts">
  import { formatDate } from '$lib/utils/posthog/formatDate.js';
  import { ChevronLeft } from 'carbon-icons-svelte';

  export let data;
</script>

<!-- SEO -->
<svelte:head>
  <title>Blog Post</title>
</svelte:head>

<div class=" mt-[10%] md:mt-16">
  {#if data}
    <article class="py-16">
      <!-- Title -->
      <hgroup class="flex flex-col items-center justify-center text-center w-full">
        <p class="text-sm text-slate-500">{formatDate(data.meta.date)}</p>
        <p class="font-bold text-3xl py-2 text-center md:w-[60%]">{data.meta.title}</p>
      </hgroup>
      <main class="px-6 md:px-[25%]">
        <div class="flex items-center justify-start gap-4 my-2 border-y border-slate-200 py-4">
          <img src={data.meta.avatar} alt="avatar" class="w-10 h-10 rounded-full" />
          <span>
            <p class="font-semibold">{data.meta.author}</p>
            <p class="text-slate-500">{data.meta.role}</p>
          </span>
        </div>

        <!-- Post -->
        <div class="prose pt-2 pb-4 border-b border-slate-200">
          <svelte:component this={data.content} />
          <!-- Tags -->
          <div class="flex gap-2 py-4">
            {#each data.meta.categories as category}
              <p class="bg-slate-200 px-2 py-1 rounded-full !text-sm !font-medium !text-black">
                {category}
              </p>
            {/each}
          </div>
        </div>

        <a
          href="/blog"
          class="flex font-medium items-center gap-2 text-slate-500 text-lg underline mt-2"
        >
          <ChevronLeft class=" w-6 h-6 font-medium" /> Back to all posts
        </a>
      </main>
    </article>
  {/if}
</div>
