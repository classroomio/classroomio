<script>
  import { browser } from '$app/environment';
  import NotificationIcon from 'carbon-icons-svelte/lib/Notification.svelte';
  import Moon from 'carbon-icons-svelte/lib/Moon.svelte';
  import Sun from 'carbon-icons-svelte/lib/Sun.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import Close from 'carbon-icons-svelte/lib/Close.svelte';

  import IconButton from '$lib/components/IconButton/index.svelte';
  import { appStore } from '$lib/utils/store/app';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { toggleBodyByMode } from '$lib/utils/functions/app';
  import { goto } from '$app/navigation';
  import { menu } from '../Org/store';

  export let title = '';
  export let navClass = '';
  export let isCoursePage = false;

  const toggleSidebar = () => {
    $menu.hidden = !$menu.hidden;
  };

  function toggleDarkMode() {
    $appStore.isDark = !$appStore.isDark;

    toggleBodyByMode($appStore.isDark);

    if (browser) {
      localStorage.setItem('mode', $appStore.isDark ? 'dark' : '');
    }
  }

  $: coursesPath = $appStore.isOrgSite ? '/lms/mylearning' : `${$currentOrgPath}/courses`;
</script>

<nav
  class="{navClass} flex w-full p-1 md:px-6 bg-primary-700 transition delay-150 duration-300 ease-in-out h-[48px]"
>
  <ul class="flex w-full items-center">
    <div class="flex items-center text-white">
      <li class="md:hidden">
        <IconButton onClick={toggleSidebar}>
          {#if $menu.hidden}
            <Menu size={16} class=" text-white" />
          {:else}
            <Close size={16} class=" text-white" />
          {/if}
        </IconButton>
      </li>

      {#if isCoursePage}
        <div class="hidden md:block">
          <IconButton
            onClick={() => {
              goto(coursesPath);
            }}
            size="small"
          >
            <CourseIcon color="#fff" />
          </IconButton>
        </div>
      {/if}
      <a
        href={coursesPath}
        title="Go to {isCoursePage ? 'Courses' : 'ClassroomIO Home'}"
        id="logo"
        class="text-lg {isCoursePage && '-ml-2 md:ml-2'} line-clamp-1"
      >
        {isCoursePage ? title : 'ClassroomIO'}
      </a>
    </div>

    <span class="flex-grow" />

    <li>
      <NotificationIcon size={20} class="text-white mr-2" />
    </li>
    <li>
      <IconButton size="small" onClick={toggleDarkMode}>
        {#if $appStore.isDark}
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
