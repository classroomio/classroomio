<script lang="ts">
  import Chip from '$lib/Chip/Chip.svelte';
  import { formatDate } from '$lib/utils/formatDate';
  import { ChevronLeft } from 'carbon-icons-svelte';

  export let data;
</script>

<!-- SEO -->
<svelte:head>
  <title>{data.meta.title} | ClassroomIO Blog</title>
  <meta property="og:type" content="article" />
  <meta property="og:title" content={data.meta.title} />

  <meta property="og:type" content="website" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1920" />
  <meta property="og:image:height" content="1080" />
  <meta property="og:image:secure_url" itemprop="image" content={data.meta.imageUrl} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta property="twitter:domain" content="classroomio.com" />
  <meta property="twitter:url" content="https://www.classroomio.com/blog/" />
  <meta name="twitter:title" content={data.meta.title} />
  <meta name="twitter:description" content={data.meta.description} />
  <meta name="twitter:image" content={data.meta.imageUrl} />
</svelte:head>

<div class=" mt-[10%] md:mt-16">
  {#if data}
    <article class="py-16">
      <!-- Title -->
      <hgroup class="flex flex-col items-center justify-center text-center w-full">
        <p class="text-sm text-gray-500">{formatDate(data.meta.date)}</p>
        <p class="font-bold text-3xl py-2 text-center md:w-[60%]">{data.meta.title}</p>
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
        <div class="prose pt-2 pb-4 border-b border-gray-200">
          <svelte:component this={data.content} />
          <!-- Tags -->
          <div class="flex gap-2 py-4">
            {#each data.meta.tags as tag}
              <Chip label={tag} />
            {/each}
          </div>
        </div>

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

  h1 {
    text-transform: capitalize;
  }
</style>
