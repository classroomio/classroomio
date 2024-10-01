<script>
  import { t } from '$lib/utils/functions/translations';
  import Footer from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/Footer.svelte';
  import Navigation from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/Navigation.svelte';
  import PageLoader from '$lib/components/Org/LandingPage/PageLoader.svelte';
  import CourseCard from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/CourseCard.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import EmptyState from '../../components/EmptyState.svelte';

  export let org = {};

  let viewAllPath = false;
  let viewAllCourses = false;
  let active = 'course';

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
  <main class="bg-[#101720] overflow-x-hidden">
    <Navigation logo={org.avatar_url} orgName={org.name} disableSignup={true} isOrgSite={true} />

    <section class="flex items-center justify-center py-10 min-h-full">
      <section class="flex flex-col text-center items-center gap-5 justify-center">
        <div class="text-white space-y-6 w-full">
          <p class="text-3xl md:text-4xl font-slab font-normal w-full md:w-[60%] mx-auto">
            Available & Upcoming Bootcamps
          </p>

          <p class="w-full font-normal font-roboto md:w-[70%] mx-auto">
            Designed to guide you step-by-step through essential skills. Browse, enroll, and start
            transforming your career today!
          </p>
        </div>
        <div class="rounded-lg h-[250px] max-h-[300px] w-[800px] max-w-[80vw] lg:max-w-[80%] flex">
          <img
            style="min-width:280px; min-height:200px"
            alt="landing page banner"
            src="/images/classroomio-course-img-template.jpg"
            class="h-full max-h-[300px] w-full rounded-lg object-cover"
          />
        </div>
      </section>
    </section>

    <div class="bg-white py-10 px-2 md:px-8">
      <div class="flex flex-col md:flex-row items-center justify-between mb-4">
        <span class="text-start space-y-2 mb-4 lg:mb-0">
          <p class=" text-2xl lg:text-3xl font-slab">Our Bootcamps</p>
          <p class=" text-[#878787] text-xs lg:text-sm font-roboto">
            Explore creative and tech courses that will help you own you skill set
          </p>
        </span>

        <div
          class="flex items-center font-roboto justify-between border border-[#EAEAEA] p-2 bg-[#FCFCFC] w-fit"
        >
          <button
            on:click={() => (active = 'course')}
            class="{active == 'course'
              ? 'bg-[#00E577]'
              : ''}  w-[10rem] text-center text-xl p-2 whitespace-nowrap font-normal"
          >
            Course
          </button>
          <button
            on:click={() => (active = 'path')}
            class="{active == 'path'
              ? 'bg-[#00E577]'
              : ''} w-[10rem] text-xl text-center p-2 whitespace-nowrap font-normal"
          >
            Learning Path
          </button>
        </div>
      </div>
      <div>
        {#if $courseMetaDeta.isLoading}
          <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
            <CardLoader />
            <CardLoader />
            <CardLoader />
          </div>
        {:else if $courses.length > 0}
          <div class="w-full lg:flex items-start gap-6 lg:ml-[5%]">
            <div class="hidden lg:block w-fit">
              <p class="font-medium mb-2 font-slab">Filter by</p>
              <div class="flex flex-col w-fit space-y-2">
                {#each filter as item}
                  <label
                    for={item.title}
                    class="font-inter text-[#3C4043] font-medium border border-[#EAEAEA] bg-[#FDFDFD] rounded-md px-4 py-4"
                  >
                    <input type="checkbox" name={item.title} class="text-[#00E577] mr-2" />

                    {item.title}
                  </label>
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
                />
              {/each}
            </section>
          </div>

          {#if $courses.length > 3}
            <div class="w-full flex items-center justify-center my-5">
              <PrimaryButton
                variant={VARIANTS.NONE}
                label="VIEW MORE"
                className="rounded-none text-lg bg-[#00E577] font-roboto"
                onClick={() => (viewAllCourses = !viewAllCourses)}
              />
            </div>
          {/if}
        {:else}
          <div class="px-4 md:px-10">
            <EmptyState
              template="bootcamp"
              className="bg-[#FCFCFC]"
              headerClassName="font-slab"
              subtitleClassName="font-roboto"
            />
          </div>
        {/if}
      </div>
    </div>
    <div class="bg-white py-10 px-2 md:px-8">
      <div class="text-start mb-4 px-4 py-4">
        <p class="text-2xl md:text-3xl mb-4 font-slab">Available career learning Paths</p>
        <p class=" text-[#878787] text-xs lg:text-sm font-roboto">
          We are preparing students for success in the following career paths in creative and tech
          industry
        </p>
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
                  slug={courseData.slug}
                  bannerImage={courseData.logo || '/images/classroomio-course-img-template.jpg'}
                  title={courseData.title}
                  isLearningPath={true}
                />
              {/each}
            </section>
            {#if $courses.length > 3}
              <div class="w-full flex items-center justify-center my-5">
                <PrimaryButton
                  variant={VARIANTS.NONE}
                  label="VIEW MORE"
                  className="rounded-none text-lg"
                  onClick={() => (viewAllPath = !viewAllPath)}
                />
              </div>
            {/if}
          {:else}
            <div class="px-4 md:px-10">
              <EmptyState
                template="bootcamp"
                type="pathways"
                className="bg-[#FCFCFC]"
                headerClassName="font-slab"
                subtitleClassName="font-roboto"
              />
            </div>
          {/if}
        </div>
      </div>
      <Footer logo={org.avatar_url} orgName={org.name} />
    </div>
  </main>
{/if}
