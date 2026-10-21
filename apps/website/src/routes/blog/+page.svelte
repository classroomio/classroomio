<script>
  import { PageSignupCTA, PageHeader, BlogListItem } from '$lib/components';

  let { data } = $props();
</script>

<svelte:head>
  <title>Blog | ClassroomIO</title>
</svelte:head>

<section>
  <PageHeader className="mx-auto flex max-w-content flex-col items-center justify-center px-6 text-center md:px-10">
    <h1 class="text-display flex flex-col items-center text-balance text-slate-900">
      <span>What's new on</span>
      <span class="relative text-blue-700">ClassroomIO?</span>
    </h1>
    <p class="text-lead mt-6 max-w-[640px] text-pretty text-slate-700">
      Get the latest news from ClassroomIO, including product updates, team announcements and more!
    </p>
  </PageHeader>
  <div class="px-6 py-12 md:px-10 md:py-16">
    <ul class="max-w-lede mx-auto flex w-full flex-col items-start justify-start">
      {#each data.posts as post}
        <li class="w-full border-b border-gray-200 py-10">
          <BlogListItem {post} />
        </li>
      {/each}
    </ul>
  </div>

  <PageSignupCTA
    header="Turn what your team already knows into training."
    subText="ClassroomIO helps you convert docs, policies, videos, and internal knowledge into courses, quizzes, certificates, and completion evidence."
    btnLabel="Start for free"
    link="/signup"
    demo={false}
  />
</section>
