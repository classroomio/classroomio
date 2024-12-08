<script lang="ts">
  import { CheckmarkFilled } from 'carbon-icons-svelte';
  import { getPageSection } from '$lib/utils/helpers/page';
  import { homePage } from '$lib/utils/stores/pages';

  const content = $derived(getPageSection($homePage, 'about'));
</script>

{#if content?.show}
  <section id="about">
    <div class="relative px-4 md:px-10 py-10 h-full w-full mx-auto xl:w-[80%]">
      <h1 class="text-center text-5xl mb-2 font-bold md:w-[60%] mx-auto">
        {content.settings.title}
      </h1>
      <p class="text-center dark:text-white text-lg font-semibold md:w-[70%] mb-8 mx-auto">
        {content.settings.subtitle}
      </p>
      <div>
        <section class="flex flex-wrap items-start justify-center w-full gap-6 py-4">
          {#each content.settings.benefits.list as item}
            <div
              class="flex flex-col gap-2 p-4 bg-white border border-[#282828] h-[130px] max-h-[180px] w-full max-w-full md:max-w-[320px] lg:max-w-[450px] rounded-lg overflow-hidden"
            >
              <span class="flex items-center gap-2">
                <CheckmarkFilled size={24} />
                <p class="text-lg capitalize line-clamp-1">{item.title}</p>
              </span>
              <p class="text-sm text-[#878787] line-clamp-3">{item.subtitle}</p>
            </div>
          {/each}
        </section>
      </div>
    </div>
  </section>
{/if}
