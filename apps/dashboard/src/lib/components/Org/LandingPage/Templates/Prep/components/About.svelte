<script>
  import CourseCard from '$lib/components/Org/LandingPage/Templates/Prep/components/CourseCard.svelte';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { CheckmarkFilled } from 'carbon-icons-svelte';
</script>

{#if $landingPageSettings.aboutUs.show}
  <section id="course" class="px-4 pt-4 pb-20 h-full bg-white md:px-10">
    <h1 class="text-center text-3xl font-serif">{$landingPageSettings.aboutUs.title}</h1>
    <p class="text-center text-[#656565] w-[70%] mx-auto font-medium mb-8">
      {$landingPageSettings.aboutUs.subtitle}
    </p>

    <section class="flex flex-wrap items-center justify-center gap-8 p-4">
      {#each $landingPageSettings.aboutUs.benefits.list as item}
        <div
          class="bg-[#FDFDFD] flex flex-col justify-between gap-4 p-4 border-2 border-[#EAEAEA] max-h-[300px] max-w-[300px] md:max-w-[500px] md:max-h-[150px] rounded-lg"
        >
          <span class="flex items-center gap-2">
            <CheckmarkFilled size={24} class="fill-[#0F62FE]" />
            <p class="text-xl font-serif">{item.title}</p>
          </span>
          <p class="text-base text-[#878787]">{item.subtitle}</p>
        </div>
      {/each}
    </section>
  </section>
{/if}
