<script>
  import { Badge } from '@cio/ui/base/badge';
  import { formatDate } from '$lib/utils/format-date';

  /**
   * @typedef {Object} Props
   * @property {any} post
   * @property {boolean} [isRecommended]
   */

  /** @type {Props} */
  let { post, isRecommended = false } = $props();
</script>

{#if !isRecommended}
  <div class="mb-5 flex flex-col gap-2 md:flex-row md:items-center">
    <!-- Date -->
    <p class="text-sm text-slate-500">{formatDate(post.date)}</p>

    <!-- Tags  -->
    <div class="flex flex-col">
      <div class="flex flex-wrap gap-2">
        {#each post.tags as tag}
          <Badge variant="outline">{tag}</Badge>
        {/each}
      </div>
    </div>
  </div>
{/if}

<a href="/blog/{post.slug}" class="group">
  <img loading="lazy" src={post.imageUrl} alt={post.title} class="w-70 h-48 rounded-md object-cover" />
  <p class="py-2 text-lg font-bold {isRecommended && 'h-[60px]'} line-clamp-2 group-hover:text-slate-500">
    {@html post.title}
  </p>

  <p class="mb-4 line-clamp-3 pt-2 text-slate-500">{post.description}</p>
</a>

<div class="my-2 flex items-center justify-start gap-4">
  <img loading="lazy" src={post.avatar} alt="avatar" class="h-10 w-10 rounded-full" />
  <span>
    <p class="font-semibold">{post.author}</p>
    <p class="text-slate-500">{post.role}</p>
  </span>
</div>
