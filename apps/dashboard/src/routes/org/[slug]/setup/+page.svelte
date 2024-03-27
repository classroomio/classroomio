<script>
  import Chip from '$lib/components/Chip/Text.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  export let data;
  let setupList = [];

  $: setupList = data.setup;
  console.log(data);
</script>

<section>
  <div class="py-2 md:py-10 px-2 md:px-5">
    <div class="flex items-center gap-2">
      <h1 class="dark:text-white text-2xl md:text-3xl font-bold">Courses</h1>
      <Chip value="0/6" className="text-[10px] font-semibold px-3 !py-1" shape="rounded-full" />
    </div>

    <section class="px-4">
      {#each setupList as list, i}
        <div
          class="flex flex-col md:flex-row md:items-center justify-between gap-2 w-full py-8 border-b border-gray-300"
        >
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <Chip
                value={i + 1}
                className="text-[10px] font-semibold !py-1"
                shape="rounded-full"
              />
              <p class="font-semibold text-xl">{list.title}</p>
            </div>
            <p class="text-sm">{list.desc}</p>
          </div>
          <div class="w-fit lg:max-w-[20%]">
            <PrimaryButton label={list.buttonLabel} className="!w-full font-normal text-sm" />
          </div>
        </div>
      {/each}
    </section>
  </div>
</section>
