<script>
  import { onMount } from 'svelte';
  import RecentlyViewed16 from 'carbon-icons-svelte/lib/RecentlyViewed16';
  import CurrencyDollar16 from 'carbon-icons-svelte/lib/CurrencyDollar16';
  import Alarm16 from 'carbon-icons-svelte/lib/Alarm16';
  import { stores } from '@sapper/app';
  import Expandable from '../Expandable/index.svelte';
  import PrimaryButton from '../PrimaryButton/index.svelte';
  import MarkdownRender from '../MarkdownRender/index.svelte';
  import { NAV_ITEMS, SECTION_KEYS } from './constants';
  import { landingPageStore } from './store';

  let activeNavItem = '';

  const expandableRootClass =
    'max-w-4xl pt-5 my-3 border-r-0 border-b border-l-0 border-gray-300';
  const { page } = stores();

  function handleEnrol() {}
  function handleNavItemClick(navItem) {
    return () => {
      activeNavItem = navItem;
    };
  }

  onMount(() => {
    activeNavItem = (window.location.hash || NAV_ITEMS[0].key).replace('#', '');
  });
</script>

<svelte:head>
  <title>{$landingPageStore.header.title}</title>
</svelte:head>

<div class="w-full bg-white flex flex-col items-center">
  <section
    class="w-full flex items-center justify-center bg-gray-900 text-white p-6 pb-10"
  >
    <div class="container flex justify-between items-center">
      <div class="course-description mr-3">
        <h1>
          {$landingPageStore.header.title}
        </h1>
        <h5>
          {$landingPageStore.header.description}
        </h5>
        <div>
          <span class="flex items-center">
            <RecentlyViewed16 class="carbon-icon mr-2" />
            Last updated 10/2021
          </span>
        </div>
      </div>
      <div class="action-container bg-white p-3 flex items-start flex-col">
        <p class="mb-2 text-black text-md flex items-center">
          <Alarm16 class="carbon-icon active mr-2" />
          {$landingPageStore.header.duration}
        </p>
        <p class="mb-2 text-black text-md flex items-center">
          <CurrencyDollar16 class="carbon-icon active mr-2" />
          {$landingPageStore.header.currency}{$landingPageStore.header.cost}
        </p>
        <PrimaryButton
          label={$landingPageStore.header.buttonLabel}
          onClick={handleEnrol}
          className="md:w-full"
        />
      </div>
    </div>
  </section>

  <nav
    class="w-full z-10 max-w-4xl flex items-center justify-evenly py-4 px-4 bg-gray-100 mt-4 sticky top-0"
  >
    {#each NAV_ITEMS as navItem}
      <p
        class="text-md text-gray-900 {activeNavItem === navItem.key &&
          'font-bold'}"
        on:click={handleNavItemClick(navItem.key)}
      >
        <a href="{$page.path}#{navItem.key}">{navItem.label}</a>
      </p>
    {/each}
  </nav>

  <Expandable
    id={SECTION_KEYS.REQUIREMENT}
    title="Requirement"
    titleClass="text-2xl"
    rootClass={expandableRootClass}
    supportsLink={true}
  >
    <MarkdownRender
      content={$landingPageStore.requirement.content}
      disableMaxWidth={true}
    />
  </Expandable>

  <Expandable
    id={SECTION_KEYS.DESCRIPTION}
    title="Description"
    titleClass="text-2xl"
    rootClass={expandableRootClass}
    supportsLink={true}
  >
    <MarkdownRender
      content={$landingPageStore.description.content}
      disableMaxWidth={true}
    />
  </Expandable>

  <Expandable
    id={SECTION_KEYS.SYLLABUS}
    title="Syllabus"
    titleClass="text-2xl"
    rootClass={expandableRootClass}
    supportsLink={true}
  >
    {#each $landingPageStore.syllabus.lessons as lesson, index}
      <div class="flex items-center my-2">
        <strong class="mr-2">Lesson {index + 1}. </strong>
        {lesson.title}
      </div>
    {/each}
  </Expandable>

  <Expandable
    id={SECTION_KEYS.ABOUT_US}
    title="About Us - {$landingPageStore.aboutUs.companyName}"
    titleClass="text-2xl"
    rootClass={expandableRootClass}
    supportsLink={true}
  >
    <div class="w-full">
      <img
        src={$landingPageStore.aboutUs.logoUrl}
        alt={$landingPageStore.aboutUs.companyName}
        height="260"
        width="260"
        class="rounded-full m-auto"
      />
    </div>
    <MarkdownRender
      content={$landingPageStore.aboutUs.description}
      disableMaxWidth={true}
    />
  </Expandable>
</div>

<style lang="scss">
  .container {
    max-width: 800px;

    .course-description {
      max-width: 500px;
    }

    .action-container {
      height: fit-content;
      width: 200px;
    }
  }
</style>
