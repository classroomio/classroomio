<script>
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import NotificationIcon from 'carbon-icons-svelte/lib/Notification.svelte';
  import Moon from 'carbon-icons-svelte/lib/Moon.svelte';
  import Sun from 'carbon-icons-svelte/lib/Sun.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';

  import IconButton from '$lib/components/IconButton/index.svelte';
  import { course } from '$lib/components/Course/store';
  import { appStore } from '$lib/utils/store/app';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { toggleBodyByTheme } from '$lib/utils/functions/app';
  import { goto } from '$app/navigation';

  export let title = '';
  export let navClass = '';
  export let isCoursePage = false;

  function toggleTheme() {
    $appStore.isDark = !$appStore.isDark;

    toggleBodyByTheme($appStore.isDark);

    if (browser) {
      localStorage.setItem('theme', $appStore.isDark ? 'dark' : '');
    }
  }

  function getPathName(_isCoursePage = false, slug = '') {
    if (!_isCoursePage) {
      return '/';
    }

    return slug ? `/course/${slug}` : `${$currentOrgPath}/courses`;
  }
</script>

<nav class="{navClass} flex w-full p-2 md:px-6 bg-blue-500">
  <ul class="flex w-full items-center">
    <div class="flex items-center text-white">
      {#if isCoursePage}
        <IconButton
          onClick={() => {
            goto(`${$currentOrgPath}/courses`);
          }}
          size="small"
        >
          <CourseIcon color="#fff" />
        </IconButton>
      {/if}
      <a
        href={getPathName(isCoursePage, $course.slug)}
        target={isCoursePage && $course.slug ? '_blank' : ''}
        title="Go to {isCoursePage ? 'Courses' : 'ClassroomIO Home'}"
        id="logo"
        class="text-lg {isCoursePage && 'ml-2'}"
      >
        {isCoursePage ? title : 'ClassroomIO'}
      </a>
    </div>

    <span class="flex-grow" />

    <li>
      <NotificationIcon size={20} class="text-white mr-2" />
    </li>
    <li>
      <IconButton size="small" onClick={toggleTheme}>
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

  /* [aria-current] {
    color: var(--main-primary-color);
    position: relative;
    display: inline-block;
  }
  [aria-current]::after {
    position: absolute;
    content: '';
    width: calc(100% - 3em);
    height: 2px;
    background-color: var(--main-primary-color);
    display: block;
    bottom: -17px;
  } */

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
