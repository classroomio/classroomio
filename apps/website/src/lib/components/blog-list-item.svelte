<script>
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
    <p class="text-label font-mono text-slate-500 uppercase">{formatDate(post.date)}</p>

    <div class="flex flex-col">
      <div class="flex flex-wrap gap-2">
        {#each post.tags as tag}
          <span class="text-tag ui:border-border ui:text-foreground rounded-full border px-2 py-0.5 font-mono uppercase"
            >{tag}</span
          >
        {/each}
      </div>
    </div>
  </div>
{/if}

<a href="/blog/{post.slug}" class="group space-y-2">
  <img
    loading="lazy"
    src={post.imageUrl}
    alt={post.title}
    class="h-48 w-70 rounded-xl border border-gray-200 object-cover"
  />
  <p class="text-base font-semibold {isRecommended && 'h-[40px]'} line-clamp-2 group-hover:underline">
    {@html post.title}
  </p>

  <p class="ui:text-muted-foreground line-clamp-3 text-[15px] leading-relaxed">{post.description}</p>
</a>

<div class="my-2 flex items-center justify-start gap-4">
  <img loading="lazy" src={post.avatar} alt="avatar" class="size-10 rounded-full" />
  <span>
    <p class="font-medium">{post.author}</p>
    <p class="ui:text-muted-foreground">{post.role}</p>
  </span>
</div>
