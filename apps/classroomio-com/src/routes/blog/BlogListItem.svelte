<script>
  import Chip from "$lib/Chip/Chip.svelte";
  import { formatDate } from "$lib/utils/formatDate";

	export let post;
	const {
        date,
        tags,
        slug,
        imageUrl,
        title,
        description,
        avatar,
        author,
        role
    } = post;
</script>

<div class="mb-5 flex md:flex-row flex-col md:items-center gap-2">
	<!-- Date -->
	<p class="text-sm text-slate-500">{formatDate(post.date)}</p>

	<!-- Tags  -->
	<div class="flex flex-col">
		<div class="flex flex-wrap gap-2">
			{#each post.tags as tag}
				<Chip label={tag} />
			{/each}
		</div>
	</div>
</div>

<a href={`/blog/${post.slug}`} class="group">
	<img
		loading="lazy"
		src={post.imageUrl}
		alt={post.title}
		class="w-70 h-48 object-cover rounded-md"
	/>
	<p class="font-bold text-lg py-2 group-hover:text-slate-500">
		{@html post.title}
	</p>

	<p class="text-slate-500 pt-2 pb-4">{post.description}</p>
</a>

<div class="flex items-center justify-start gap-4 my-2">
	<img loading="lazy" src={post.avatar} alt="avatar" class="w-10 h-10 rounded-full" />
	<span>
		<p class="font-semibold">{post.author}</p>
		<p class="text-slate-500">{post.role}</p>
	</span>
</div>