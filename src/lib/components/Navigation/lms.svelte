<script>
  import { page } from '$app/stores';
  import NotificationIcon from 'carbon-icons-svelte/lib/Notification.svelte';
  import MoonIcon from 'carbon-icons-svelte/lib/Moon.svelte';
  import SunIcon from 'carbon-icons-svelte/lib/Sun.svelte';

  import IconButton from '$lib/components/IconButton/index.svelte';
  import { appStore } from '$lib/utils/store/app';
  import { toggleBodyByTheme } from '$lib/utils/functions/app';

  export let navClass = '';

  function toggleTheme() {
    $appStore.isDark = !$appStore.isDark;

    toggleBodyByTheme($appStore.isDark);
    localStorage.setItem('theme', $appStore.isDark ? 'dark' : '');
  }
</script>

<nav class="{navClass} flex w-full p-2 md:px-6 bg-blue-600">
  <ul class="flex w-full items-center">
    <div class="">
      <a
        href={$page.url.pathname}
        title="Go to ClassroomIO Home"
        id="logo"
        class="text-lg"
      >
        ClassroomIO
      </a>
    </div>

    <span class="flex-grow" />

    <li>
      <NotificationIcon size={20} class="text-white mr-2" />
    </li>
    <li>
      <IconButton size="small" onClick={toggleTheme}>
        {#if $appStore.isDark}
          <SunIcon size={16} class="text-white" />
        {:else}
          <MoonIcon size={16} class="text-white" />
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
