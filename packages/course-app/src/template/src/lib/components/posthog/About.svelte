<script lang="ts">
  import { CheckmarkFilled } from 'carbon-icons-svelte';
  import { homePage } from '$lib/utils/stores/pages';
  import { getPageSection } from '$lib/utils/helpers/page';

  /**
   * Constants
   */
  const content = $derived(getPageSection($homePage, 'about'));
</script>

{#if content?.show}
  <section id="about" class="px-4 md:px-10 pt-4 pb-20 h-full w-full mx-auto md:w-[90%] lg:w-[80%]">
    <h1 class="text-start text-3xl mb-2 font-bold md:w-[50%]">{content.settings.title}</h1>
    <p class="text-start text-[#3D3D3D] dark:text-white text-sm font-semibold md:w-[70%] mb-8">
      {content.settings.subtitle}
    </p>
    <div>
      <p class="text-xl font-bold capitalize mb-6">{content.settings.benefits.title}</p>
      <section class="grid place-items-center grid-cols-1 md:grid-cols-2 gap-4">
        {#each content.settings.benefits.list as item}
          <div
            class="flex flex-col gap-2 p-4 bg-[#E5E7E0] dark:bg-[#232429] border border-[#D0D1C9] h-[150px] max-h-[200px] w-full max-w-full md:max-w-[320px] lg:max-w-[450px] rounded-lg overflow-hidden"
          >
            <span class="flex items-center gap-2">
              <CheckmarkFilled size={24} class=" fill-[#F54E00] dark:fill-[#EB9D2A]" />
              <p class="text-lg font-bold capitalize line-clamp-1">{item.title}</p>
            </span>
            <p class="text-sm line-clamp-4">{item.subtitle}</p>
          </div>
        {/each}
      </section>
    </div>
  </section>
{/if}
