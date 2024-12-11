<script lang="ts">
  import { getPageSection } from '@/utils/helpers/page';
  import InstructorCard from './InstructorsCard.svelte';
  import { homePage } from '@/utils/stores/pages';
  import PrimaryButton from './PrimaryButton.svelte';

  const content = $derived(getPageSection($homePage, 'instructors'));
</script>

{#if content?.show}
  <section class="px-4 lg:px-14 pt-4 pb-20 h-full bg-white">
    <div class="w-full xl:w-[90%] mx-auto">
      <h1 class="  text-center lg:text-start text-3xl text-[#3F3F3F] font-bold mb-4">
        Meet some of our Instructors
      </h1>
      <section class="grid place-items-center grid-cols-1 md:grid-cols-2 gap-2 w-full">
        {#each content.settings.list as item}
          <InstructorCard name={item.name} description={item.description} rating={item.rating} />
        {/each}
      </section>
      <div class="w-full flex justify-center md:justify-end px-4 mt-6">
        <PrimaryButton
          class="text-lg font-semibold text-white p-6 rounded"
          label="Start learning & Explore courses"
        />
      </div>
    </div>
  </section>
{/if}
