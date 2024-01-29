<script>
  import { formatDate } from '$lib/utils/posthog/formatDate';
  export let data;
</script>

<svelte:head>
  <title>ClassroomIO Blog</title>
</svelte:head>

<div class=" mt-[10%] md:mt-16">
  <header class="py-16 w-full flex flex-col items-center text-center">
    <h1 class="font-bold text-5xl py-2">From the blog</h1>
    <p class=" w-[90%] md:w-[60%] text-center font-normal text-xl text-slate-500">
      Get the latest news from ClassroomIO, including product updates, team announcements and more!
    </p>
  </header>
  <div class="w-full flex items-center justify-center">
    <ul class="flex flex-col items-start justify-start gap-2 w-[90%] md:w-[50%]">
      {#each data.posts as post}
        <li class=" border-t border-slate-400 py-14 w-full">
          <p class="text-sm text-slate-500">{formatDate(post.date)}</p>
          <a href={`/blog/${post.slug}`} class="group">
            <div class="flex md:flex-row flex-col md:items-center gap-2">
              <p class="font-bold text-lg py-2 group-hover:text-slate-500">{post.title}</p>
              <!-- <div class="flex items-center gap-2">
                {#each post.tags as tag}
                  <p
                    class="bg-slate-200 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap w-fit"
                  >
                    {tag}
                  </p>
                {/each}
              </div> -->
              <div class="flex flex-col">
                <div class="flex flex-wrap gap-2">
                  {#each post.tags as tag}
                    <p
                      class="bg-slate-200 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                    >
                      {tag}
                    </p>
                  {/each}
                </div>
              </div>
            </div>
            <p class="text-slate-500 py-4">{post.description}</p>
          </a>

          <div class="flex items-center justify-start gap-4 my-2">
            <img src={post.avatar} alt="avatar" class="w-10 h-10 rounded-full" />
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
