<script>
  import { onMount } from 'svelte';
  import { Search } from 'carbon-components-svelte';
  import LogoFacebook from 'carbon-icons-svelte/lib/LogoFacebook.svelte';
  import LogoTwitter from 'carbon-icons-svelte/lib/LogoTwitter.svelte';
  import LogoLinkedin from 'carbon-icons-svelte/lib/LogoLinkedin.svelte';

  import Navigation from '$lib/components/Navigation/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import Card from '$lib/components/Courses/components/Card/index.svelte';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { courses, courseMetaDeta } from '$lib/components/Courses/store';
  import { getCourseBySiteName } from '$lib/utils/services/org';
  import { appStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';

  let searchValue = '';

  onMount(async () => {
    console.log('sitename', $appStore.siteNameFromDomain);
    $courseMetaDeta.isLoading = true;
    const coursesResult = await getCourseBySiteName(
      $appStore.siteNameFromDomain
    );
    courses.set(coursesResult);
    $courseMetaDeta.isLoading = false;
  });
</script>

<main>
  <Navigation logo={$currentOrg.avatar_url} orgName={$currentOrg.name} />

  <!-- Header Section -->
  <header class="banner w-full flex items-center justify-center p-">
    <div
      class="w-full flex items-center justify-center flex-col-reverse md:flex-row"
    >
      <!-- Course Description -->
      <div class="course-descr w-11/12 py-10">
        <h1
          class="dark:text-white text-5xl text-white text-center my-4 font-bold"
        >
          Explore courses
        </h1>
        <p class="dark:text-white text-md text-white mb-6 text-center">
          Find courses you will love from best teachers all over the world🌎.
        </p>

        <Search placeholder="Find a course..." bind:value={searchValue} />
      </div>
    </div>
  </header>

  <section class="my-10 mx-auto max-w-6xl w-full">
    <div class="flex items-center justify-evenly flex-wrap my-4 m-auto">
      {#if $courseMetaDeta.isLoading}
        <CardLoader />
        <CardLoader />
        <CardLoader />
      {:else}
        {#each $courses as courseData}
          <Card
            id={courseData.id}
            slug={courseData.slug}
            logo={courseData.logo}
            bannerImage={courseData.banner_image}
            title={courseData.title}
            description={courseData.description}
            role_id={courseData.role_id}
            isPublished={courseData.is_published}
            cost={courseData.cost}
            currency={courseData.currency}
            totalLessons={courseData.total_lessons}
            isOnLandingPage={true}
          />
        {:else}
          <Box>
            <CoursesEmptyIcon />
            <h3 class="dark:text-white text-2xl my-5">No Courses Created</h3>
            <p class="dark:text-white w-1/3 text-center">
              We've got great courses coming your way, stay tuned!!!
            </p>
          </Box>
        {/each}
      {/if}
    </div>
  </section>

  <footer
    class="flex justify-center mt-10 w-full px-5 py-5 sm:py-10 border-b-0 border-r-0 border-t border-l-0 border-gray-300"
  >
    <ul class="flex w-11/12 items-center flex-col sm:flex-row">
      <div class="logo">
        <a
          href="/"
          title={`Go to ${$currentOrg.name} Home`}
          id="logo"
          data-hveid="8"
          class="flex items-center"
        >
          <img
            src={`${$currentOrg.avatar_url}`}
            alt={`${$currentOrg.name} logo`}
            class="rounded h-10 w-10 inline-block mx-auto"
            data-atf="1"
          />
          <h3 class="text-black ml-3">{$currentOrg.name}</h3>
        </a>
      </div>

      <span class="flex-grow" />

      <div class="flex mt-5 sm:mt-0">
        <li class="mx-2">
          <a
            href="facebook.com"
            target="_blank"
            title="Facebook"
            id="logo-fb"
            data-hveid="8"
          >
            <LogoFacebook size={24} />
          </a>
        </li>
        <li class="mx-2">
          <a
            href="twitter.com"
            target="_blank"
            title="Twitter"
            id="logo-tw"
            data-hveid="8"
          >
            <LogoTwitter size={24} />
          </a>
        </li>
        <li class="mx-2">
          <a
            href="linkedin.com"
            target="_blank"
            title="Linkedin"
            id="logo-ln"
            data-hveid="8"
          >
            <LogoLinkedin size={24} />
          </a>
        </li>
      </div>
    </ul>
  </footer>
</main>

<style lang="scss">
  .banner {
    background-color: #040f2d;
    min-height: 337px;
  }

  .course-descr {
    max-width: 400px;
  }
</style>
