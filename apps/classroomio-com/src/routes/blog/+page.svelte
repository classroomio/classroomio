<script>
  import Chip from '$lib/Chip/Chip.svelte';
  import { formatDate } from '$lib/utils/formatDate';
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';

  export let data;
</script>

<svelte:head>
  <title>Blog | ClassroomIO</title>
</svelte:head>

<section>
  <PageHeader className="flex flex-col items-center justify-center text-center">
    <h1
      class="mx-auto text-4xl md:text-7xl lg:text-6xl font-bold text-slate-900 flex flex-col items-center"
    >
      <span>What's new on</span>
      <span class="text-blue-700 relative">ClassroomIO?</span>
    </h1>
    <p class="w-[90%] md:w-[60%] text-center font-normal text-lg text-slate-700 mt-10 lg:mt-7">
      Get the latest news from ClassroomIO, including product updates, team announcements and more!
    </p>
  </PageHeader>
  <div class="w-full flex items-center justify-center">
    <ul class="flex flex-col items-start justify-start gap-2 w-[90%] md:w-[50%]">
      {#each data.posts as post}
        <li class="py-10 w-full border-b border-gray-200">
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
        </li>
      {/each}
    </ul>
  </div>

  <PageSignupCTA
    header="Ready To Launch Your First Training?"
    subText="It's free to sign up and start getting value out of the product."
    btnLabel="Sign me up"
    link="/signup"
    demo={false}
  />
</section>
