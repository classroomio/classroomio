<script>
  import CardLoader from '$lib/component/CardLoader.svelte';
  import CourseCard from '$lib/component/CourseCard.svelte';
  import EmptyState from '$lib/component/EmptyState.svelte';
  import Footer from '$lib/component/Footer.svelte';
  import Navigation from '$lib/component/Navigation.svelte';
  import PageLoader from '$lib/component/PageLoader.svelte';
  import { courseMetaData } from '$lib/component/store.js';
  import Button from '$lib/components/ui/button/button.svelte';

  export let data;
  const { org, courses } = data;
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
      type: DISPLAY_COURSE.ALL,
      checked: true
    },
    {
      title: 'Self Paced',
      type: DISPLAY_COURSE.PACED,
      checked: false
    },
    {
      title: 'Live Sessions',
      type: DISPLAY_COURSE.LIVE,
      checked: false
    }
  ];

  const filterCourse = (item) => {
    item.checked = !item.checked;
    console.log(`${item.title} item is ${item.checked}`);
  };
</script>

<svelte:head>
  <title>
    {!org.name ? '' : `${org.name}'s `} Courses
  </title>
</svelte:head>

{#if !data}
  <PageLoader />
  <!-- <p>loading</p> -->
{:else}
  <main class="bg-[#101720] font-ibm">
    <Navigation />
    {#if org.header.banner.show}
      <div class="relative h-full md:h-screen">
        <div
          class="absolute inset-0 bg-cover bg-center"
          style="background-image: url('/classroomio-course-img-template.jpg');"
        ></div>

        <div
          class="absolute inset-0 bg-gradient-to-r from-[#0233BD99] via-[#00000033] to-[#FFFFFF00]"
        ></div>

        <div
          class="relative flex items-center justify-center h-full text-white px-4 py-20 md:px-10"
        >
          <div class="text-white space-y-6 w-full">
            <p class="text-2xl md:text-4xl font-mono font-semibold w-full md:w-[60%] lg:w-[40%]">
              {org.header.title}
            </p>

            <p class="w-full md:w-[60%] lg:w-[40%]">
              {org.header.subtitle}
            </p>
            <div class="flex items-center gap-2 md:gap-4">
              <Button
                class="uppercase bg-blue-900 px-6 py-3 font-semibold hover:bg-blue-900 hover:scale-95 rounded-none"
                >VIEW COURSES</Button
              >
              <!-- <bButton
              class="uppercase bg-blue-900 p-2 border border-[#0542CC] text-white font-semibold hover:bg-[#0542CC] transition"
              >LEARNING PATH</Button
            > -->
            </div>
          </div>
        </div>
      </div>
    {/if}
    {#if org.courses.show}
      <div class="bg-white py-10 px-2 md:px-8">
        <p class="dark:text-white text-3xl text-center font-semibold pb-10">{org.courses.title}</p>
        <div>
          {#if $courseMetaData.isLoading}
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
              <CardLoader />
              <CardLoader />
              <CardLoader />
            </div>
          {:else if courses.length > 0}
            <div class="w-full lg:flex items-start gap-6 lg:ml-[5%]">
              <div class="hidden lg:block w-max">
                <p class="font-medium mb-2">Filter by</p>
                <div class="w-max space-y-2">
                  {#each filter as item}
                    <form
                      class="space-x-2 text-[#3C4043] font-medium border border-[#EAEAEA] bg-[#FDFDFD] rounded-md px-4 py-4"
                    >
                      <input
                        type="checkbox"
                        name={item.title}
                        checked={item.checked}
                        on:change={() => filterCourse(item)}
                      />
                      <label for={item.title}>{item.title}</label>
                    </form>
                  {/each}
                </div>
              </div>
              <section
                class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4"
              >
                {#each courses.slice(0, viewAllCourses ? courses.length : 3) as courseData}
                  <CourseCard
                    className="bg-[#FDFDFD]"
                    slug={courseData.data.slug}
                    bannerImage={courseData.data.logo ||
                      '/images/classroomio-course-img-template.jpg'}
                    title={courseData.data.title}
                    description={courseData.data.description}
                    cost={courseData.data.cost}
                    currency={courseData.data.currency}
                  />
                {/each}
              </section>
            </div>

            {#if courses.length > 3}
              <div class="w-full flex items-center justify-center my-5">
                <Button
                  class="uppercase bg-blue-900 p-2"
                  on:click={() => (viewAllCourses = !viewAllCourses)}>VIEW COURSES</Button
                >
              </div>
            {/if}
          {:else}
            <div class="px-4 w-full lg:w-[70%] mx-auto">
              <EmptyState />
            </div>
          {/if}
        </div>
      </div>
      <!-- <div class=" py-10 px-2 md:px-8">
      <p class="text-white text-3xl text-center font-semibold pb-10">Available Learning Path</p>
      <div>
        {#if courseMetaData.isLoading}
          <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
            <CardLoader />
            <CardLoader />
            <CardLoader />
          </div>
        {:else if data.courses.length > 0}
          <section class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
            {#each data.courses.slice(0, viewAllPath ? data.courses.length : 3) as courseData}
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
          {#if data.courses.length > 3}
            <div class="w-full flex items-center justify-center my-5">
              <Button
                class="uppercase bg-blue-900 p-2"
                on:click={() => (viewAllCourses = !viewAllCourses)}>VIEW COURSES</Button
              >
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
    </div> -->
    {/if}

    <Footer data={org} />
  </main>
{/if}
