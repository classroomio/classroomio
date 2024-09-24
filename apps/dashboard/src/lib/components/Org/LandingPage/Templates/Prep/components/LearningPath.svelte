<script>
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import NextFilled from 'carbon-icons-svelte/lib/NextFilled.svelte';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import EmptyState from '../../../components/EmptyState.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';

  let viewAll = false;

  function getCourseUrl(slug) {
    return `/pathway/${slug}`;
  }
</script>

{#if $landingPageSettings.pathway.show}
  <section id="course" class="px-4 pt-4 pb-20 h-full bg-white md:px-20">
    <h1 class="text-start text-3xl font-serif">{$landingPageSettings.pathway.title}</h1>
    <p class="text-start text-[#656565] w-[60%] font-medium mb-8">
      {$landingPageSettings.pathway.subtitle}
    </p>

    {#if $courseMetaDeta.isLoading}
      <div class="cards-container my-4 mx-2">
        <CardLoader />
        <CardLoader />
        <CardLoader />
      </div>
    {:else if $courses.length > 0}
      <section class="flex flex-wrap items-center justify-start gap-8 py-4">
        {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
          <div
            class="relative flex flex-col justify-between gap-4 p-4 h-[400px] w-[300px] max-w-[400px] md:max-h-[500px] rounded-lg bg-cover"
            style="background-image: url('/org-banner.png');"
          >
            <div class="absolute bg-black/30 w-full h-full top-0 left-0" />
            <div class="text-white space-y-2 z-10">
              <p class="font-serif font-medium text-xl uppercase line-clamp-2">
                {courseData.title}
              </p>
              <p>{courseData.description}</p>
            </div>

            <a href={getCourseUrl(courseData.slug)} class="hover:no-underline z-10">
              <div
                class=" flex items-center justify-between uppercase font-medium text-white text-start w-full bg-[#0233BD]/90 p-3 cursor-pointer hover:scale-90 transition-all duration-200"
              >
                Register here
                <NextFilled size={24} class="fill-white stroke-black" />
              </div>
            </a>
          </div>
        {/each}
      </section>
      {#if $courses.length > 3}
        <div class="w-full flex items-center justify-center my-5">
          <PrimaryButton
            label="VIEW MORE PACKAGES"
            variant={VARIANTS.NONE}
            className="rounded-none text-lg !bg-[#0233BD] text-white font-semibold"
            onClick={() => (viewAll = !viewAll)}
          />
        </div>
      {/if}
    {:else}
      <div class="px-10">
        <EmptyState type="pathway" />
      </div>
    {/if}
  </section>
{/if}
