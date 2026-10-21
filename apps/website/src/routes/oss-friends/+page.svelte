<script>
  import { PageHeader } from '$lib/components';
  import { CtaButton } from '$lib/components/ui';

  let { data } = $props();
</script>

<svelte:head>
  <title>Our Open-source Friends | ClassroomIO</title>
</svelte:head>

<section>
  <PageHeader className="mx-auto flex max-w-content flex-col items-center justify-center px-6 text-center md:px-10">
    <h1 class="text-display text-balance text-slate-900">
      Our <span class="text-blue-700">Open-source</span> Friends
    </h1>
    <p class="text-lead mt-6 max-w-[640px] text-pretty text-slate-700">
      In ClassroomIO, we are committed to building a commercial open source company and here are some of our friends on
      the same mission.
    </p>
  </PageHeader>

  <div class="px-6 py-20 md:px-10 md:py-28">
    <ul role="list" class="max-w-content mx-auto grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each data.friends as friend}
        <li class="flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 p-[26px]">
          <div>
            <h2 class="text-card-title font-medium text-gray-900">
              {friend.name}
            </h2>
            <p class="mt-2 text-[15px] leading-relaxed text-gray-600">
              {friend.description}
            </p>
          </div>
          <div class="mt-6 text-left">
            <CtaButton href={friend.href} target="_blank" rel="noopener noreferrer" variant="secondary" size="md">
              Learn more
            </CtaButton>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</section>
