<script>
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import Close from 'carbon-icons-svelte/lib/Close.svelte';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import Moon from 'carbon-icons-svelte/lib/Moon.svelte';
  import NotificationIcon from 'carbon-icons-svelte/lib/Notification.svelte';
  import Sun from 'carbon-icons-svelte/lib/Sun.svelte';

  import IconButton from '$lib/components/IconButton/index.svelte';
  import { toggleBodyByMode } from '$lib/utils/functions/app';
  import { t } from '$lib/utils/functions/translations';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { sideBar } from '../Org/store';

  export let title = '';
  export let navClass = '';
  export let isCoursePage = false;
  export let isPathwayPage = false;

  const toggleSidebar = () => {
    $sideBar.hidden = !$sideBar.hidden;
  };

  function toggleDarkMode() {
    $globalStore.isDark = !$globalStore.isDark;

    toggleBodyByMode($globalStore.isDark);

    if (browser) {
      localStorage.setItem('mode', $globalStore.isDark ? 'dark' : '');
    }
  }

  $: coursesPath = $globalStore.isOrgSite
    ? '/lms/mylearning'
    : isPathwayPage
      ? `${$currentOrgPath}/pathways`
      : isCoursePage
        ? `${$currentOrgPath}/courses`
        : $currentOrgPath;
</script>

<nav
  class="{navClass} bg-primary-700 flex h-[48px] w-full p-1 transition delay-150 duration-300 ease-in-out md:px-6"
>
  <ul class="flex w-full items-center">
    <div class="flex items-center text-white">
      <li class="md:hidden">
        <IconButton
          onClick={() => {
            toggleSidebar();
          }}
        >
          {#if $sideBar.hidden}
            <Menu size={16} class=" text-white" />
          {:else}
            <Close size={16} class=" text-white" />
          {/if}
        </IconButton>
      </li>

      {#if isCoursePage}
        <li class="hidden md:block">
          <IconButton
            onClick={() => {
              toggleSidebar();
            }}
          >
            <Menu size={16} class=" text-white" />
          </IconButton>
        </li>
        <li class="hidden md:block">
          <IconButton onClick={() => goto(coursesPath)}>
            <ArrowLeft size={16} class="text-white" />
          </IconButton>
        </li>
      {/if}

      {#if isPathwayPage}
        <li class="hidden md:block">
          <IconButton
            onClick={() => {
              toggleSidebar();
            }}
          >
            <Menu size={16} class=" text-white" />
          </IconButton>
        </li>
        <li class="hidden md:block">
          <IconButton onClick={() => goto(coursesPath)}>
            <ArrowLeft size={16} class="text-white" />
          </IconButton>
        </li>
      {/if}
      <a
        href={coursesPath}
        title="{$t('navigation.goto')} {isCoursePage
          ? $t('navigation.courses')
          : isPathwayPage
            ? $t('navigation.pathways')
            : $t('navigation.classroomio_home')}"
        id="logo"
        class="line-clamp-1 text-lg"
      >
        {title}
      </a>
    </div>

    <span class="flex-grow" />

    <li>
      <NotificationIcon size={20} class="mr-2 text-white" />
    </li>
    <li>
      <IconButton size="small" onClick={toggleDarkMode}>
        {#if $globalStore.isDark}
          <Sun size={16} class="text-white" />
        {:else}
          <Moon size={16} class="text-white" />
        {/if}
      </IconButton>
    </li>

    <li />
  </ul>
</nav>

<style>
  ul {
    padding: 0;
  }

  /* clearfix */
  ul::after {
    content: '';
    display: block;
    clear: both;
  }

  /* li.new-question {
    margin-top: 10px;
  } */

  a {
    text-decoration: none;
    color: #fff;
    font-weight: 700;
  }

  @media only screen and (max-width: 1002px) {
    nav.hide {
      display: none;
    }
    ul {
      align-items: center;
    }

    a {
      padding: 0 0.5em;
    }
  }
</style>
