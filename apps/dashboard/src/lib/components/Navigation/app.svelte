<script>
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import NotificationIcon from 'carbon-icons-svelte/lib/Notification.svelte';
  import Moon from 'carbon-icons-svelte/lib/Moon.svelte';
  import Sun from 'carbon-icons-svelte/lib/Sun.svelte';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import Close from 'carbon-icons-svelte/lib/Close.svelte';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';

  import IconButton from '$lib/components/IconButton/index.svelte';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { toggleBodyByMode } from '$lib/utils/functions/app';
  import { sideBar } from '../Org/store';
  import { t } from '$lib/utils/functions/translations';

  export let title = '';
  export let navClass = '';
  export let isCoursePage = false;

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

  $: console.log('$globalStore in app.svelte', $globalStore);
  $: coursesPath = $globalStore.isOrgSite
    ? '/lms/mylearning'
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
      <a
        href={coursesPath}
        title="{$t('navigation.goto')} {isCoursePage
          ? $t('navigation.courses')
          : $t('navigation.classroomio_home')}"
        id="logo"
        class="line-clamp-1 text-lg"
      >
        {isCoursePage ? title : 'ClassroomIO'}
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
