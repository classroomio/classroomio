<script>
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';

  export let data;
</script>

<svelte:head>
  <title>Our Open-source Friends | ClassroomIO</title>
</svelte:head>

<section>
  <PageHeader className="flex flex-col items-center justify-center text-center">
    <h1
      class="mx-auto text-3xl md:text-4xl lg:text-6xl font-normal leading-[1.5] text-slate-900 items-center"
    >
      Our <span class="text-blue-700">Open-source</span> Friends
    </h1>
    <p class="w-[90%] md:w-[60%] text-center font-normal text-lg text-slate-700 mt-10 lg:mt-7">
      In ClassroomIO, we are committed to building a commercial open source company and here are
      some of our friends on the same mission.
    </p>
  </PageHeader>

  <ul role="list" class="m-4 mt-12 grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8">
    {#each data.friends as friend}
      <li
        class="overflow-hidden rounded-md border border-gray-200 flex flex-col justify-between py-6"
      >
        <div>
          <div class="text-xl font-medium leading-6 text-gray-900 pb-1 px-6">
            {friend.name}
          </div>
          <p class="px-6 mt-2 text-gray-600 text-sm">
            {friend.description}
          </p>
        </div>
        <div class="text-left px-6 mt-3">
          <a
            href={friend.href}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block w-full"
          >
            <button
              class="font-semibold text-base text-white bg-gray-800 hover:bg-gray-900 hover:shadow-xl transition-all delay-100 px-4 py-3 rounded-md"
            >
              Learn more
            </button>
          </a>
        </div>
      </li>
    {/each}
  </ul>
</section>
