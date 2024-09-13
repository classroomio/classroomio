<script>
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import { onMount } from 'svelte';
  import Footer from './components/Footer.svelte';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Navigation from './components/Navigation.svelte';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import CourseCard from './components/CourseCard.svelte';
  import EmptyState from '../../components/EmptyState.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { get } from 'lodash';
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
    window.history.pushState({}, '', url); // Update URL without reloading the page
  };

  // On mount, set the active type based on the URL parameter
  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const urlType = params.get('type');

    if (urlType && Object.values(DISPLAY_COURSE).includes(urlType)) {
      type = urlType;
    }
  });
</script>

<section class="overflow-x-hidden">
  <Navigation logo={org.avatar_url} orgName={org.name} disableSignup={true} isOrgSite={true} />
  <!-- hero -->
  <div
    class="h-full pt-20 pb-36 flex flex-col items-center justify-center text-center w-full bg-gradient-to-r from-[#f0a5f11a] via-white to-[#f6e7f61a]"
  >
    <h1 class="font-bold text-5xl">Our <span class="text-[#CE02CE]">Programs</span></h1>
    <p class="md:text-xl text-[#878787] w-full md:w-[60%] lg:w-[40%] text-center">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa dolore assumenda distinctio amet
      eveniet! Inventore earum quisquam qui suscipit quis?
    </p>
  </div>

  <!-- course -->
  {#if $landingPageSettings.courses.show}
    <section id="course" class="px-4 pt-4 pb-20 h-full bg-white">
      <h1 class="text-center text-3xl text-[#3F3F3F]">{$landingPageSettings.courses.title}</h1>

      <div class="flex items-center justify-center border-b-2 py-4 px-2 mx-auto w-full mb-4">
        <nav
          class="flex justify-between items-center font-semibold uppercase list-none w-full md:w-[80%]"
        >
          {#each navItems as item}
            <li
              class="hover:bg-[#FFE8FF] hover:text-[#CE02CE] cursor-pointer p-1 {type ==
                item.type && 'bg-[#FFE8FF] text-[#CE02CE]'} uppercase"
              on:click={() => displayCourse(item.type)}
            >
              {item.title}
            </li>
          {/each}
        </nav>
      </div>
      <div class="w-full flex gap-2 md:ml-[5%]">
        <div class="hidden lg:block w-fit space-y-2">
          <p class="font-medium text-[#3C4043] uppercase">Filter</p>
          <div class="w-fit border border-[#EAEAEA] p-6 space-y-8">
            {#each filter as item}
              <form class="space-x-2 text-[#3C4043]">
                <input type="checkbox" name={item.title} />
                <label for={item.title}>{item.title}</label>
              </form>
            {/each}
          </div>
        </div>
        <div class="w-full md:w-[80%] mx-auto">
          {#if $courseMetaDeta.isLoading}
            <div class="cards-container my-4 mx-2">
              <CardLoader />
              <CardLoader />
              <CardLoader />
            </div>
          {:else if $courses.length > 0}
            <section class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
              {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
                <CourseCard
                  id={courseData.id}
                  slug={courseData.slug}
                  bannerImage={courseData.logo || '/images/classroomio-course-img-template.jpg'}
                  title={courseData.title}
                  type={courseData.type}
                  description={courseData.description}
                  cost={courseData.cost}
                  currency={courseData.currency}
                  totalLessons={get(courseData, 'lessons[0].count', 0)}
                />
              {/each}
            </section>
            {#if $courses.length > 3}
              <div class="w-full flex items-center justify-center my-5">
                <PrimaryButton
                  label="View more programs"
                  variant={VARIANTS.NONE}
                  className="text-lg font-semibold text-white !bg-[#CE02CE]"
                  onClick={() => (viewAll = !viewAll)}
                />
              </div>
            {/if}
          {:else}
            <div class="px-10">
              <EmptyState template="org" headerClassName="text-[#CE02CE]" />
            </div>
          {/if}
        </div>
      </div>
    </section>
  {/if}

  <Footer logo={org.avatar_url} orgName={org.name} />
</section>
