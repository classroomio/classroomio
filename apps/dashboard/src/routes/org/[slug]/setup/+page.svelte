<script>
  import Chip from '$lib/components/Chip/Text.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import StepDoneIcon from '$lib/components/Icons/StepDoneIcon.svelte';

  export let data;
  let setupList = [];

  $: setupList = data.setup;
  console.log(data);
</script>

<section>
  <div class="py-2 md:py-10 px-2 md:px-5">
    <div class="flex items-baseline gap-2">
      <h1 class="dark:text-white text-2xl md:text-3xl font-bold">Courses</h1>
      <Chip value="0/6" className="text-[10px] font-semibold px-3 !py-1" shape="rounded-full" />
    </div>

    <section class="px-4">
      {#each setupList as list, i}
        <div
          class="flex flex-col lg:flex-row lg:items-center justify-between gap-2 w-full py-8 border-b border-gray-300"
        >
          <div class="space-y-2 flex-1">
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
          <div class="w-fit ml-auto lg:w-[15vw]">
            {#if list.isCompleted}
              <div class="w-full flex justify-center">
                <StepDoneIcon />
              </div>
            {:else}
              <PrimaryButton
                label={list.buttonLabel}
                className="!w-full font-normal text-sm"
                onClick={() => (list.isCompleted = true)}
              />
            {/if}
          </div>
        </div>
      {/each}
    </section>
  </div>
</section>
