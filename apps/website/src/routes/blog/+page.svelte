<script>
  import { PageSignupCTA, PageHeader, BlogListItem } from '$lib/components';

  let { data } = $props();
</script>

<svelte:head>
  <title>Blog | ClassroomIO</title>
</svelte:head>

<section>
  <PageHeader className="flex flex-col items-center justify-center text-center">
    <h1 class="mx-auto flex flex-col items-center text-4xl text-slate-900 md:text-6xl">
      <span>What's new on</span>
      <span class="relative text-blue-700">ClassroomIO?</span>
    </h1>
    <p class="mt-10 w-[90%] text-center text-lg font-normal text-slate-700 md:w-[60%] lg:mt-7">
      Get the latest news from ClassroomIO, including product updates, team announcements and more!
    </p>
  </PageHeader>
  <div class="flex w-full items-center justify-center">
    <ul class="flex w-[90%] flex-col items-start justify-start gap-2 md:w-[50%]">
      {#each data.posts as post}
        <li class="w-full border-b border-gray-200 py-10">
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
