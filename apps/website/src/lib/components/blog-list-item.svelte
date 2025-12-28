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

<a href="/blog/{post.slug}" class="group space-y-2">
  <img loading="lazy" src={post.imageUrl} alt={post.title} class="h-48 w-70 rounded-md object-cover" />
  <p class="text-md font-medium {isRecommended && 'h-[60px]'} line-clamp-2 group-hover:underline">
    {@html post.title}
  </p>

  <p class="ui:text-muted-foreground line-clamp-3">{post.description}</p>
</a>

<div class="my-2 flex items-center justify-start gap-4">
  <img loading="lazy" src={post.avatar} alt="avatar" class="size-10 rounded-full" />
  <span>
    <p class="font-medium">{post.author}</p>
    <p class="ui:text-muted-foreground">{post.role}</p>
  </span>
</div>
