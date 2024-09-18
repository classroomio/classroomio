<script>
  import { t } from '$lib/utils/functions/translations';
  import Footer from '$lib/components/Org/LandingPage/Templates/Experts/components/Footer.svelte';
  import Navigation from '$lib/components/Org/LandingPage/Templates/Experts/components/Navigation.svelte';
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';

  import CourseCard from '$lib/components/Org/LandingPage/Templates/Experts/components/CourseCard.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import { get } from 'lodash';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import EmptyState from '../../components/EmptyState.svelte';

  export let org = {};

  let viewAllPath = false;
  let viewAllCourses = false;

  const DISPLAY_COURSE = {
    ALL: 'all',
    PACED: 'paced',
    LIVE: 'live'
  };

  const filter = [
    {
      title: 'All Courses',
      type: DISPLAY_COURSE.ALL
    },
    {
      title: 'Self Paced',
      type: DISPLAY_COURSE.PACED
    },
    {
      title: 'Live Sessions',
      type: DISPLAY_COURSE.LIVE
    }
  ];
</script>

<svelte:head>
  <title>
    {!org.name ? '' : `${org.name}'s `}{$t('course.navItem.landing_page.landing_page')}
  </title>
</svelte:head>

{#if !org.landingpage}
  <PageLoader />
{:else}
  <main class="bg-[#101720]">
    <Navigation logo={org.avatar_url} orgName={org.name} disableSignup={true} isOrgSite={true} />

    <div class="relative h-full md:h-screen">
      <div
        class="absolute inset-0 bg-cover bg-center"
        style="background-image: url('/images/classroomio-course-img-template.jpg');"
      ></div>

      <div
        class="absolute inset-0 bg-gradient-to-r from-[#0233BD99] via-[#00000033] to-[#FFFFFF00]"
      ></div>

      <div
        class="relative z-10 flex items-center justify-center h-full text-white px-4 py-20 md:px-10"
      >
        <div class="text-white space-y-6 w-full">
          <p class="text-2xl md:text-4xl font-semibold w-full md:w-[60%] lg:w-[40%]">
            Explore Available Courses and Learning Path
          </p>

          <p class="w-full md:w-[60%] lg:w-[40%]">
            Our courses cater to all learning needs and styles. Join us and embark on a journey of
            growth and discovery
          </p>
          <div class="flex items-center gap-2 md:gap-4">
            <PrimaryButton className="rounded-none bg-[#0542CC]" label="VIEW COURSES" />
            <PrimaryButton
              variant={VARIANTS.OUTLINED}
              className="rounded-none uppercase border !border-[#0542CC] text-white font-semibold hover:!bg-[#0542CC]  transition"
              label="LEARNING PATH"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="bg-white py-10 px-2 md:px-8">
      <p class="dark:text-white text-3xl text-center font-semibold pb-10">Available Courses</p>
      <div>
        {#if $courseMetaDeta.isLoading}
          <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
            <CardLoader />
            <CardLoader />
            <CardLoader />
          </div>
        {:else if $courses.length > 0}
          <div class="w-full lg:flex items-center gap-2 lg:ml-[5%]">
            <div class="hidden lg:block w-fit space-y-2">
              <p class="font-medium text-[#3C4043] uppercase">Filter</p>
              <div class="w-fit p-6 space-y-8">
                {#each filter as item}
                  <form class="space-x-2 text-[#3C4043] border border-[#EAEAEA] rounded-md p-2">
                    <input type="checkbox" name={item.title} />
                    <label for={item.title}>{item.title}</label>
                  </form>
                {/each}
              </div>
            </div>
            <section class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
              {#each $courses.slice(0, viewAllCourses ? $courses.length : 3) as courseData}
                <CourseCard
                  className="bg-[#FDFDFD]"
                  slug={courseData.slug}
                  bannerImage={courseData.logo || '/images/classroomio-course-img-template.jpg'}
                  title={courseData.title}
                  description={courseData.description}
                  cost={courseData.cost}
                  currency={courseData.currency}
                />
              {/each}
            </section>
          </div>

          {#if $courses.length > 3}
            <div class="w-full flex items-center justify-center my-5">
              <PrimaryButton
                label="VIEW MORE COURSES"
                className="rounded-none text-lg"
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
    <div class=" py-10 px-2 md:px-8">
      <p class="text-white text-3xl text-center font-semibold pb-10">Available Learning Path</p>
      <div>
        {#if $courseMetaDeta.isLoading}
          <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
            <CardLoader />
            <CardLoader />
            <CardLoader />
          </div>
        {:else if $courses.length > 0}
          <section class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
            {#each $courses.slice(0, viewAllPath ? $courses.length : 3) as courseData}
              <CourseCard
                className="bg-[#192533] text-white"
                slug={courseData.slug}
                bannerImage={courseData.logo || '/images/classroomio-course-img-template.jpg'}
                title={courseData.title}
                description={courseData.description}
                cost={courseData.cost}
                currency={courseData.currency}
                isLearningPath={true}
              />
            {/each}
          </section>
          {#if $courses.length > 3}
            <div class="w-full flex items-center justify-center my-5">
              <PrimaryButton
                label="VIEW MORE COURSES"
                className="rounded-none text-lg"
                onClick={() => (viewAllPath = !viewAllPath)}
              />
            </div>
          {/if}
        {:else}
          <div class="px-10">
            <EmptyState
              type="pathways"
              headerClassName="text-white"
              subtitleClassName="text-white"
              className="bg-[#192533] border-[#233A5A]"
            />
          </div>
        {/if}
      </div>
    </div>
    <Footer logo={org.avatar_url} orgName={org.name} />
  </main>
{/if}
