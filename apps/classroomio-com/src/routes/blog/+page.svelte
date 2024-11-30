<script>
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';
  import BlogListItem from '$lib/Blog/BlogListItem.svelte';

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
          <BlogListItem {post} />
        </li>
      {/each}
    </ul>
  </div>

  <PageSignupCTA
    header="Ready To Scale Your Training Efforts?"
    subText="It's free to sign up and start getting value out of the product."
    btnLabel="Sign me up"
    link="/signup"
    demo={false}
  />
</section>
