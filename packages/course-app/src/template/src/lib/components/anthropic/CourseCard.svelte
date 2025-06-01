<script>
  const { slug = '', title = '', description = '', bannerImage = '' } = $props();
</script>

<div class="flex min-h-[200px] flex-col rounded-xl bg-white p-6 shadow">
  {#if bannerImage}
    <img src={bannerImage} alt={title} class="mb-4 h-32 w-full rounded object-cover" />
  {/if}
  <div class="mb-2 text-xl font-bold">{title}</div>
  {#if description}
    <div class="mb-4 text-sm">{description}</div>
  {/if}
  <a
    href={slug || '#'}
    class="mt-auto inline-block rounded-md bg-black px-5 py-2 font-semibold text-white transition-colors hover:bg-[#FF6F3C]"
    >Learn more</a
  >
</div>
