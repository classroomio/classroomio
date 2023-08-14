<script lang="ts">
  import { fade } from 'svelte/transition';
  import get from 'lodash/get';
  import { onMount } from 'svelte';
  import { Search } from 'carbon-components-svelte';
  import LogoFacebook from 'carbon-icons-svelte/lib/LogoFacebook.svelte';
  import LogoTwitter from 'carbon-icons-svelte/lib/LogoTwitter.svelte';
  import LogoLinkedin from 'carbon-icons-svelte/lib/LogoLinkedin.svelte';

  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Navigation from '$lib/components/Navigation/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import Card from '$lib/components/Courses/components/Card/index.svelte';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { courses, courseMetaDeta } from '$lib/components/Courses/store';
  import { getCourseBySiteName } from '$lib/utils/services/org';
  import { currentOrg } from '$lib/utils/store/org';
  import { validateEmail } from '$lib/utils/functions/validateEmail';
  import { goto } from '$app/navigation';

  export let orgSiteName;

  let searchValue = '';
  let email: string | undefined;
  let isAdding = false;
  let success = false;
  let viewAll = false;

  const supabase = getSupabase();

  async function handleSubmit() {
    if (!email || !validateEmail(email)) return;
    isAdding = true;

    const { error, data } = await supabase.from('organization_emaillist').insert({
      email,
      organization_id: $currentOrg.id
    });

    if (error) {
      console.error('Error', error);
    }

    success = true;
    setTimeout(() => {
      isAdding = false;
      success = false;
      email = undefined;
    }, 5000);
  }

  onMount(async () => {
    if (!orgSiteName) return;

    try {
      console.log('sitename', orgSiteName);
      $courseMetaDeta.isLoading = true;
      const coursesResult = await getCourseBySiteName(orgSiteName);
      courses.set(coursesResult);
      $courseMetaDeta.isLoading = false;
    } catch (error) {
      console.log('error', error);
    }
  });
</script>

<svelte:head>
  {$currentOrg.name}
</svelte:head>

<main>
  <Navigation logo={$currentOrg.avatar_url} orgName={$currentOrg.name} />

  <!-- Header Section -->
  <header transition:fade class="banner w-full flex items-center justify-center p-">
    <div class="w-full flex items-center justify-center flex-col-reverse md:flex-row">
      <!-- Course Description -->
      <div class="course-descr w-11/12 py-10">
        <h1 class="dark:text-white text-5xl text-white text-center my-4 font-bold">
          Explore courses
        </h1>
        <p class="dark:text-white text-md text-white mb-6 text-center">
          Find courses you will love from best teachers all over the world🌎.
        </p>

        <Search placeholder="Find a course..." bind:value={searchValue} />
      </div>
    </div>
  </header>

  <section transition:fade class="my-10 mx-auto max-w-6xl w-full">
    <div
      class="flex gap-5 items-center {$courses.length < 4 && 'justify-center'} flex-wrap my-4 mx-2"
    >
      {#if $courseMetaDeta.isLoading}
        <CardLoader />
        <CardLoader />
        <CardLoader />
      {:else}
        {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
          <Card
            id={courseData.id}
            slug={courseData.slug}
            bannerImage={courseData.banner_image}
            title={courseData.title}
            description={courseData.description}
            role_id={courseData.role_id}
            isPublished={courseData.is_published}
            cost={courseData.cost}
            currency={courseData.currency}
            totalLessons={get(courseData, 'lessons[0].count', 0)}
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

    {#if $courses.length > 3}
      <div class="w-full flex justify-center">
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          onClick={() => (viewAll = !viewAll)}
          label={viewAll ? 'View Less' : 'View All'}
          className="px-10 py-5 w-fit"
        />
      </div>
    {/if}
  </section>

  <section transition:fade class="my-10 mx-auto max-w-6xl w-[95%]">
    <div
      class="bg-blue-700 rounded-lg flex flex-col lg:flex-row lg:items-center px-4 md:px-10 py-14"
    >
      <div class="w-full md:w-[65%] md:mr-4">
        <h1 class="text-4xl font-bold mb-5 mt-0 text-white">Join our mailing list</h1>
        <p class="text-lg text-white">
          We are constantly releasing new courses and sharing them with our email list. Subscribe to
          get notified once we release a new course
        </p>
      </div>
      <form on:submit|preventDefault={handleSubmit} class="my-4 w-full md:w-fit">
        <div class="flex items-center flex-col sm:flex-row">
          {#if success}
            <p class="text-white">You have been added successfully. Thanks for subscribing.</p>
          {:else}
            <TextField
              bind:value={email}
              type="email"
              placeholder="Enter your email.."
              className="md:mr-3 my-0 w-full md:w-fit"
              isRequired={true}
              isDisabled={isAdding}
              inputClassName="py-2"
            />
            <PrimaryButton
              className="my-1 w-full"
              variant={VARIANTS.CONTAINED_LIGHT}
              type="submit"
              isLoading={isAdding}>Subscribe</PrimaryButton
            >
          {/if}
        </div>
      </form>
    </div>
  </section>

  <footer
    class="flex justify-center mt-10 w-full px-5 py-10 md:py-3 border-b-0 border-r-0 border-t border-l-0 border-gray-300"
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
          <h3 class="text-black ml-3 text-xl">{$currentOrg.name}</h3>
        </a>
      </div>

      <span class="flex-grow" />

      <div class="flex mt-5 sm:mt-0">
        <li class="mx-2">
          <a href="facebook.com" target="_blank" title="Facebook" id="logo-fb" data-hveid="8">
            <LogoFacebook size={24} />
          </a>
        </li>
        <li class="mx-2">
          <a href="twitter.com" target="_blank" title="Twitter" id="logo-tw" data-hveid="8">
            <LogoTwitter size={24} />
          </a>
        </li>
        <li class="mx-2">
          <a href="linkedin.com" target="_blank" title="Linkedin" id="logo-ln" data-hveid="8">
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
