<script>
  import { PageHeader } from '$lib/components';
  import { Button } from '@cio/ui/base/button';

  let { data } = $props();
</script>

<svelte:head>
  <title>Our Open-source Friends | ClassroomIO</title>
</svelte:head>

<section>
  <PageHeader className="flex flex-col items-center justify-center text-center">
    <h1 class="mx-auto items-center text-3xl leading-[1.5] font-normal text-slate-900 md:text-4xl lg:text-6xl">
      Our <span class="text-blue-700">Open-source</span> Friends
    </h1>
    <p class="mt-10 w-[90%] text-center text-lg font-normal text-slate-700 md:w-[60%] lg:mt-7">
      In ClassroomIO, we are committed to building a commercial open source company and here are some of our friends on
      the same mission.
    </p>
  </PageHeader>

  <ul role="list" class="m-4 mt-12 grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8">
    {#each data.friends as friend}
      <li class="flex flex-col justify-between overflow-hidden rounded-md border border-gray-200 py-6">
        <div>
          <div class="px-6 pb-1 text-xl leading-6 font-medium text-gray-900">
            {friend.name}
          </div>
          <p class="mt-2 px-6 text-sm text-gray-600">
            {friend.description}
          </p>
        </div>
        <div class="mt-3 px-6 text-left">
          <Button href={friend.href} target="_blank" rel="noopener noreferrer" variant="outline">Learn more</Button>
        </div>
      </li>
    {/each}
  </ul>
</section>
