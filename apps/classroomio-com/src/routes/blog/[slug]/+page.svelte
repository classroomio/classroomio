<script lang="ts">
  import Chip from '$lib/Chip/Chip.svelte';
  import { formatDate } from '$lib/utils/formatDate';
  import { ChevronLeft } from 'carbon-icons-svelte';
  import BlogListItem from '../BlogListItem.svelte';

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
        <div class="prose pt-2 pb-4 border-b border-gray-200">
          <svelte:component this={data.content} />
          <!-- Tags -->
          <div class="flex gap-2 py-4">
            {#each data.meta.tags as tag}
              <Chip label={tag} />
            {/each}
          </div>
        </div>

				<section class="">
					<p class="text-lg font-semibold">Check Out Similar Blogs</p>
					<ul class="flex flex-col items-start justify-start gap-2">
						{#each data.otherBlogsSuggestion as post }
					<li class="py-10 w-full border-b border-gray-200">
						<BlogListItem {post}/>
					</li>
					{/each}
					</ul>
				</section>

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
