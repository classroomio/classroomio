<script>
  import { t } from '$lib/utils/functions/translations';
  import Footer from '$lib/components/Org/LandingPage/Templates/Prep/components/Footer.svelte';
  import Navigation from '$lib/components/Org/LandingPage/Templates/Prep/components/Navigation.svelte';
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';
  import CourseCard from '$lib/components/Org/LandingPage/Templates/Prep/components/CourseCard.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import EmptyState from '../../components/EmptyState.svelte';
  import { NextFilled } from 'carbon-icons-svelte';

  export let org = {};

  let viewAllPath = false;
  let viewAllCourses = false;

  const DISPLAY_COURSE = {
    PACED: 'paced',
    LIVE: 'live'
  };

  const filter = [
    {
      title: 'Live Sessions',
      type: DISPLAY_COURSE.LIVE
    },
    {
      title: 'Self Paced',
      type: DISPLAY_COURSE.PACED
    }
  ];

  function getCourseUrl(slug) {
    return `/pathway/${slug}`;
  }
</script>

<svelte:head>
  <title>
    {!org.name ? '' : `${org.name}'s `}{$t('course.navItem.landing_page.landing_page')}
  </title>
</svelte:head>

{#if !org.landingpage}
  <PageLoader />
{:else}
  <main class="overflow-x-hidden">
    <Navigation logo={org.avatar_url} orgName={org.name} disableSignup={true} isOrgSite={true} />

    <section class="flex items-center justify-center py-10 h-screen">
      <section class="flex flex-col text-center items-start md:items-center gap-10 p-4">
        <div class="space-y-6 w-full">
          <p
            class="text-3xl md:text-4xl font-medium w-full md:w-[60%] text-[#3D3D3D] mx-auto font-serif"
          >
            Ace your Prep Exams on the very first trial
          </p>

          <p class="w-full font-normal md:w-[70%] mx-auto text-[#656565]">
            Meticulously designed prep courses to offer you the best resources, expert guidance, and
            personalized support to excel in your exams.
          </p>
        </div>

        <div
          class="flex flex-col md:flex-row items-center w-[90%] mx-auto justify-between md:justify-center gap-4 md:gap-8"
        >
          <PrimaryButton
            className="!bg-[#0233BD] rounded-none uppercase text-white font-semibold w-full"
            variant={VARIANTS.NONE}
            label="Explore prep courses"
          />
          <PrimaryButton
            className="!border !border-[#0233BD] rounded-none uppercase font-semibold !text-[#0233BD]  hover:!bg-[#0233BD] hover:!text-white w-full"
            variant={VARIANTS.OUTLINED}
            label="Explore prep packages"
          />
        </div>
      </section>
    </section>

    <div class="bg-white py-10 px-2 md:px-10 lg:px-20 border-b">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
        <span class="text-start px-4 space-y-2 mb-4 lg:mb-0">
          <p class="text-2xl md:text-3xl mb-4 font-serif">Available Prep Courses</p>
          <p class=" text-[#878787] text-sm font-medium w-full md:w-[80%]">
            Whether you prefer self-paced online learning or interactive in-person sessions, we have
            the right course for you.
          </p>
        </span>
        <div class=" w-full md:w-fit">
          <div class="flex items-center bg-[#F7F7F7] p-2 w-full gap-1 md:gap-4">
            <p class="text-sm md:text-base font-medium whitespace-nowrap">Filter by</p>
            <div class="flex flex-row items-center w-full md:w-fit bg-white p-1">
              {#each filter as item}
                <label
                  for={item.title}
                  class="text-[#3C4043] flex flex-row whitespace-nowrap items-center text-xs font-medium bg-[#FDFDFD] rounded-md p-2"
                >
                  <input type="checkbox" name={item.title} class="text-[#0233BD] mr-2" />

                  {item.title}
                </label>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <div>
        {#if $courseMetaDeta.isLoading}
          <div class="cards-container my-4 mx-2">
            <CardLoader />
            <CardLoader />
            <CardLoader />
          </div>
        {:else if $courses.length > 0}
          <section class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
            {#each $courses.slice(0, viewAllCourses ? $courses.length : 3) as courseData}
              <CourseCard
                slug={courseData.slug}
                title={courseData.title}
                description={courseData.description}
              />
            {/each}
          </section>
          {#if $courses.length > 3}
            <div class="w-full flex items-center justify-center my-5">
              <PrimaryButton
                label="VIEW MORE PREPCOURSES"
                variant={VARIANTS.NONE}
                className="rounded-none text-lg !bg-[#0233BD] text-white font-semibold"
                onClick={() => (viewAllCourses = !viewAllCourses)}
              />
            </div>
          {/if}
        {:else}
          <div class="px-10">
            <EmptyState />
          </div>
        {/if}
      </div>
    </div>
    <div class="bg-white py-10 px-2 md:px-10 lg:px-20">
      <div class="text-start mb-4 px-4 py-4">
        <p class="text-2xl md:text-3xl mb-4 font-serif">Prep Course Packages</p>
        <p class=" text-[#878787] text-sm font-medium w-full md:w-[80%]">
          We offer tailored packages that group similar prep courses to suit your specific goals and
          needs.
        </p>
        <div>
          {#if $courseMetaDeta.isLoading}
            <div class="cards-container my-4 mx-2">
              <CardLoader />
              <CardLoader />
              <CardLoader />
            </div>
          {:else if $courses.length > 0}
            <section class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
              {#each $courses.slice(0, viewAllPath ? $courses.length : 3) as courseData}
                <div
                  class="relative flex flex-col justify-between gap-4 p-4 h-[400px] min-w-[280px] max-w-[400px] md:max-h-[500px] rounded-lg bg-cover"
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
                  onClick={() => (viewAllPath = !viewAllPath)}
                />
              </div>
            {/if}
          {:else}
            <div class="px-10">
              <EmptyState type="pathway" />
            </div>
          {/if}
        </div>
      </div>
      <Footer logo={org.avatar_url} orgName={org.name} />
    </div>
  </main>
{/if}
