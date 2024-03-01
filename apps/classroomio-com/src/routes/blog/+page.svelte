<script>
  import Chip from '$lib/Chip/Chip.svelte';
  import { formatDate } from '$lib/utils/formatDate';
  export let data;
</script>

<svelte:head>
  <title>Blog | ClassroomIO</title>
</svelte:head>

<div class=" mt-[10%] md:mt-16">
  <header class="pt-24 pb-16 w-full flex flex-col items-center text-center">
    <h1
      class="mx-auto text-3xl md:text-4xl lg:text-6xl font-normal leading-[1.5] text-slate-900 flex flex-col items-center"
    >
      <span>What's new on</span>
      <span class="text-blue-700 relative"
        >ClassroomIO?
        <svg
          aria-hidden="true"
          viewBox="0 0 418 42"
          class="absolute right-0 top-3/4 h-[0.58em] fill-indigo-300/70"
          preserveAspectRatio="none"
        >
          <path
            d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z"
          />
        </svg>
      </span>
    </h1>
    <p class="w-[90%] md:w-[60%] text-center font-normal text-lg text-slate-700 mt-10 lg:mt-7">
      Get the latest news from ClassroomIO, including product updates, team announcements and more!
    </p>
  </header>
  <div class="w-full flex items-center justify-center">
    <ul class="flex flex-col items-start justify-start gap-2 w-[90%] md:w-[50%]">
      {#each data.posts as post}
        <li class=" border-t border-slate-400 py-14 w-full">
          <div class="flex md:flex-row flex-col md:items-center gap-2">
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
            <p class="font-bold text-lg py-2 group-hover:text-slate-500">{post.title}</p>

            <p class="text-slate-500 py-4">{post.description}</p>
          </a>

          <div class="flex items-center justify-start gap-4 my-2">
            <img loading="lazy" src={post.avatar} alt="avatar" class="w-10 h-10 rounded-full" />
            <span>
              <p class="font-semibold">{post.author}</p>
              <p class="text-slate-500">{post.role}</p>
            </span>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</div>
