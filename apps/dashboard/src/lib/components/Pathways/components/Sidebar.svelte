<script lang="ts">
  import { page } from '$app/stores';
  import CheckmarkFilled from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import LockedIcon from 'carbon-icons-svelte/lib/Locked.svelte';
  import ChevronDownIcon from 'carbon-icons-svelte/lib/ChevronDown.svelte';
  import ChevronUpIcon from 'carbon-icons-svelte/lib/ChevronUp.svelte';
  import Certificate from 'carbon-icons-svelte/lib/Certificate.svelte';
  import Bullhorn from 'carbon-icons-svelte/lib/Bullhorn.svelte';
  import DocumentAttachment from 'carbon-icons-svelte/lib/DocumentAttachment.svelte';
  import Settings from 'carbon-icons-svelte/lib/Settings.svelte';
  import Group from 'carbon-icons-svelte/lib/Group.svelte';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { collection } from '$lib/components/Pathways/store';

  import IconButton from '$lib/components/IconButton/index.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';

  import { sideBar } from '../../Org/store';

  interface Navigation {
    id: number;
    title: string;
    path: string;
  }

  let navigation: Navigation[] = [];

  $: navigation = [
    {
      id: 1,
      title: $t('pathways.components.sideBar.news'),
      path: ''
    },
    {
      id: 2,
      title: $t('pathways.components.sideBar.courses'),
      path: '/courses'
    },
    {
      id: 3,
      title: $t('pathways.components.sideBar.people'),
      path: '/people'
    },
    {
      id: 4,
      title: $t('pathways.components.sideBar.certificates'),
      path: '/certificates'
    },
    {
      id: 5,
      title: $t('pathways.components.sideBar.landing'),
      path: '/landing'
    },
    {
      id: 6,
      title: $t('pathways.components.sideBar.settings'),
      path: '/settings'
    }
  ];

  let currentPath: string;
  let id: string;
  let orgPath: string;
  let isExpanded: boolean | undefined;
  let showCourses: boolean = false;

  function isActive(pagePath: string, itemPath: string) {
    if (itemPath === '') {
      return pagePath === `/org/${orgPath}/pathways/${id}/`;
    }
    return pagePath.includes(itemPath);
  }

  function toggleIsExpanded() {
    isExpanded = !isExpanded;
    showCourses = !showCourses;
  }

  const toggleSidebar = () => {
    $sideBar.hidden = !$sideBar.hidden;
  };

  $: {
    currentPath = $page.url?.pathname;
    id = $page.params.id;
    orgPath = $currentOrg.siteName;
  }
</script>

<aside
  class={`${
    $sideBar.hidden
      ? 'absolute z-40 -translate-x-[100%] md:relative md:translate-x-0'
      : 'absolute z-40 translate-x-0 md:relative'
  } border-r-1 h-[calc(100vh-48px)] w-[250px] min-w-[250px] overflow-y-auto border border-b-0 border-l-0 border-t-0 border-gray-100 dark:border-neutral-600 bg-gray-100 transition dark:bg-neutral-900`}
>
  <section class="bg-[#F7F7F7] dark:bg-black w-full h-full">
    <ul class="flex px-3 pt-[10%] flex-col gap-3">
      {#each navigation as nav}
        {#if nav.path === '/courses'}
          <li
            class="py-3 pl-5 pr-3 cursor-pointer rounded-md hover:bg-[#EAEAEA] dark:text-white dark:hover:bg-[#262626] transition-all duration-300 flex items-center justify-between gap-5 {isActive(
              currentPath,
              `${nav.path}`
            )
              ? 'bg-[#EAEAEA] dark:bg-[#1D4EE2] '
              : ''}"
          >
            <a
              href={`/org/${orgPath}/pathways/${id}${nav.path}`}
              on:click={toggleSidebar}
              class="text-black dark:hover:text-black no-underline"
            >
              <div class="flex gap-5 dark:text-white">
                <CourseIcon />
                <p class="text-sm font-bold">{$t('pathways.components.sideBar.courses')}</p>
              </div>
            </a>

            <IconButton size="small" onClick={toggleIsExpanded}>
              {#if isExpanded}
                <ChevronUpIcon class="carbon-icon dark:text-white" />
              {:else}
                <ChevronDownIcon class="carbon-icon dark:text-white" />
              {/if}
            </IconButton>
          </li>

          <div class="w-full {showCourses ? 'block' : 'hidden'}">
            {#if $collection.courses.length > 0 && showCourses}
              {#each $collection.courses as courses}
                <a
                  href="/courses/{courses.id}"
                  on:click={toggleSidebar}
                  class="pl-5 cursor-pointer rounded-md flex items-center gap-5 hover:bg-[#EAEAEA] dark:hover:bg-[#262626] transition-all duration-300 py-2"
                >
                  {#if !courses.is_unlocked}
                    <span class="text-md" title="This lesson is locked.">
                      <LockedIcon class="carbon-icon dark:text-white" />
                    </span>
                  {:else if courses.is_completed}
                    <span title="You have completed this lesson">
                      <CheckmarkFilled class="carbon-icon text-[#0233BD] dark:text-white" />
                    </span>
                  {/if}
                  <p class="text-xs font-medium">{courses.title}</p>
                </a>
              {/each}
            {/if}
          </div>
          <!--  -->
        {:else}
          <a
            on:click={toggleSidebar}
            href={`/org/${orgPath}/pathways/${id}${nav.path}`}
            class="text-black"
          >
            <li
              class="py-3 pl-5 cursor-pointer rounded-md hover:bg-[#EAEAEA] dark:text-white dark:hover:bg-[#262626] transition-all duration-300 flex items-center gap-5 {isActive(
                currentPath,
                `${nav.path}`
              )
                ? 'bg-[#EAEAEA] dark:bg-[#262626]'
                : ''}"
            >
              {#if nav.path === ''}
                <Bullhorn size={20} />
              {:else if nav.path === '/people'}
                <Group size={20} />
              {:else if nav.path === '/certificates'}
                <Certificate size={20} />
              {:else if nav.path === '/landing'}
                <DocumentAttachment size={20} />
              {:else if nav.path === '/settings'}
                <Settings size={20} />
              {/if}
              <span class="text-sm font-bold">{nav.title}</span>
            </li>
          </a>
        {/if}
      {/each}
    </ul>
  </section>
</aside>

<style>
  a {
    text-decoration: none !important;
  }
</style>
