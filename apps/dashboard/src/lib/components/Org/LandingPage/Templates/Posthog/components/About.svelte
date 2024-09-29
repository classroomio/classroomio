<script>
  import CourseCard from '$lib/components/Org/LandingPage/Templates/Prep/components/CourseCard.svelte';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { CheckmarkFilled } from 'carbon-icons-svelte';
</script>

{#if $landingPageSettings.aboutUs.show}
  <section id="course" class="px-4 pt-4 pb-20 h-full md:px-20">
    <h1 class="text-start text-3xl">{$landingPageSettings.aboutUs.title}</h1>
    <p class="text-start text-sm w-[70%] mb-8">
      {$landingPageSettings.aboutUs.subtitle}
    </p>
    <div>
      <p class="text-xl font-bold capitalize">{$landingPageSettings.aboutUs.benefits.title}</p>
      <section class="flex flex-wrap items-start justify-start gap-8 py-4">
        {#each $landingPageSettings.aboutUs.benefits.list as item}
          <div
            class="flex flex-col justify-between gap-4 p-4 bg-[#E5E7E0] dark:bg-[#232429] border border-[#D0D1C9] max-h-[300px] max-w-[300px] md:max-w-[500px] md:max-h-[150px] rounded-lg"
          >
            <span class="flex items-center gap-2">
              <CheckmarkFilled size={24} class="fill-[#EB9D2A]" />
              <p class="text-lg font-bold capitalize">{item.title}</p>
            </span>
            <p class="text-sm line-clamp-4">{item.subtitle}</p>
          </div>
        {/each}
      </section>
    </div>
  </section>
{/if}
