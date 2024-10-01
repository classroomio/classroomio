<script>
  import { t } from '$lib/utils/functions/translations';
  import Footer from '$lib/components/Org/LandingPage/Templates/Posthog/components/Footer.svelte';
  import Navigation from '$lib/components/Org/LandingPage/Templates/Posthog/components/Navigation.svelte';
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';
  import Hero from '$lib/components/Org/LandingPage/Templates/Posthog/components/Hero.svelte';

  import CourseCard from '$lib/components/Org/LandingPage/Templates/Posthog/components/CourseCard.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';

  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';

  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import EmptyState from '../../components/EmptyState.svelte';
  import { onMount } from 'svelte';

  export let org = {};

  const DISPLAY_COURSE = {
    ALL: 'all',
    COURSE: 'course',
    PATH: 'path'
  };

  let viewAll = false;
  let type = DISPLAY_COURSE.ALL;

  const filter = [
    {
      title: 'Live Sessions'
    },
    {
      title: 'Self Paced'
    },
    {
      title: 'Learning Path'
    }
  ];

  const navItems = [
    {
      title: 'All',
      type: DISPLAY_COURSE.ALL
    },
    {
      title: 'Course',
      type: DISPLAY_COURSE.COURSE
    },
    {
      title: 'Learning Path',
      type: DISPLAY_COURSE.PATH
    }
  ];

  const displayCourse = (course) => {
    type = course;
    const url = new URL(window.location);
    url.searchParams.set('type', course);
    window.history.pushState({}, '', url);
  };

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const urlType = params.get('type');

    if (urlType && Object.values(DISPLAY_COURSE).includes(urlType)) {
      type = urlType;
    }
  });
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
    {#if $landingPageSettings.header.banner.show}
      <section class="flex items-center justify-center my-12 py-10 px-8 md:px-14 min-h-full">
        <section
          class="mx-auto text-center px-4 lg:px-10 py-20 space-y-4 bg-[#E5E7E0] dark:bg-[#232429] rounded-md w-full md:w-[70%]"
        >
          <div class="flex flex-col items-center gap-8 relative rounded-lg">
            <span class="absolute w-2 h-2 rounded-full bg-red-500 -top-14 left-3" />
            <span class="absolute w-2 h-2 rounded-full bg-white top-10 -left-10" />
            <span class="absolute w-2 h-2 rounded-full bg-yellow-500 -top-10 -right-3" />
            <span class="absolute w-2 h-2 rounded-full bg-blue-800 top-14 -right-10" />

            <p class="text-center text-3xl md:text-5xl font-bold w-full md:w-[90%]">
              {$landingPageSettings.header.title}
            </p>

            <p class="text-center w-full text-lg text-[#878787] md:w-[70%]">
              {$landingPageSettings.header.subtitle}
            </p>
          </div>
        </section>
      </section>
    {/if}

    {#if $landingPageSettings.courses.show}
      <section id="course" class=" pt-4 pb-20 h-full">
        <div
          class="flex items-center justify-center border-b-2 border-[#ADADAD] bg-[#E5E7E0] dark:bg-[#232429] px-2 mx-auto w-full mb-4"
        >
          <nav class="flex justify-between items-center font-semibold list-none w-full md:w-[80%]">
            {#each navItems as item}
              <li
                class="border-b-4 border-transparent hover:border-[#F54E00] hover:dark:border-[#EB9D2A] cursor-pointer py-3 px-4 {type ==
                  item.type && ' border-[#F54E00] dark:border-[#EB9D2A]'} capitalize"
                on:click={() => displayCourse(item.type)}
              >
                {item.title}
              </li>
            {/each}
          </nav>
        </div>
        <div class="w-full md:w-[80%] mx-auto">
          {#if $courseMetaDeta.isLoading}
            <div class="cards-container my-4 mx-2">
              <CardLoader />
              <CardLoader />
              <CardLoader />
            </div>
          {:else if $courses.length > 0}
            <div class="w-full flex gap-2 mt-10">
              <div class="hidden lg:block w-[25%]">
                <p class="font-semibold mb-4">Filter by</p>
                <div class="w-full space-y-2">
                  {#each filter as item}
                    <form
                      class="space-x-2 text-[#3C4043] dark:text-white font-medium border border-[#EAEAEA] dark:border-[#232429] bg-[#FDFDFD] dark:bg-[#232429] rounded-md px-4 py-4"
                    >
                      <input
                        type="checkbox"
                        name={item.title}
                        class="text-[#F54E00] dark:text-[#EB9D2A] focus:ring-0"
                      />
                      <label for={item.title} class="whitespace-nowrap">{item.title}</label>
                    </form>
                  {/each}
                </div>
              </div>
              <section
                class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4 w-full"
              >
                {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
                  <CourseCard
                    slug={courseData.slug}
                    title={courseData.title}
                    description={courseData.description}
                  />
                {/each}
              </section>
            </div>
            {#if $courses.length > 0}
              <div class="w-full flex items-center justify-center my-5">
                <PrimaryButton
                  className="rounded-md uppercase !ring-1 !ring-[#B17816] dark:!bg-[#EB9D2A] hover:bg-[#EB9D2A] shadow-[0px_3px_#B17816] font-semibold mb-4 !px-10"
                  variant={VARIANTS.NONE}
                  label="View more courses"
                  onClick={() => (viewAll = !viewAll)}
                />
              </div>
            {/if}
          {:else}
            <div class="px-10">
              <EmptyState
                template="posthog"
                className="dark:bg-[#232429] dark:border-[#EAEAEA]"
                type={type == DISPLAY_COURSE.PATH ? 'pathways' : 'course'}
              />
            </div>
          {/if}
        </div>
      </section>
    {/if}

    <Footer logo={org.avatar_url} orgName={org.name} />
  </main>
{/if}
