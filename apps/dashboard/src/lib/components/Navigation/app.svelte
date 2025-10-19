<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import BellIcon from '@lucide/svelte/icons/bell';
  import MoonIcon from '@lucide/svelte/icons/moon';
  import SunIcon from '@lucide/svelte/icons/sun';
  import MenuIcon from '@lucide/svelte/icons/menu';
  import XIcon from '@lucide/svelte/icons/x';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

  import { IconButton } from '$lib/components/IconButton';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { toggleBodyByMode } from '$lib/utils/functions/app';
  import { sideBar } from '../Org/store';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    title?: string;
    navClass?: string;
    isCoursePage?: boolean;
  }

  let { title = $bindable(''), navClass = '', isCoursePage = false }: Props = $props();

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

  let coursesPath = $derived(
    $globalStore.isOrgSite ? '/lms/mylearning' : isCoursePage ? `${$currentOrgPath}/courses` : $currentOrgPath
  );
</script>

<nav class="{navClass} bg-primary-700 flex h-[48px] w-full p-1 transition delay-150 duration-300 ease-in-out md:px-6">
  <ul class="flex w-full items-center gap-2">
    <div class="flex items-center text-white">
      <li class="md:hidden">
        <IconButton
          onClick={() => {
            toggleSidebar();
          }}
        >
          {#if $sideBar.hidden}
            <MenuIcon size={16} class="custom" />
          {:else}
            <XIcon size={16} class="custom" />
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
            <MenuIcon size={16} class="custom" />
          </IconButton>
        </li>
        <li class="hidden md:block">
          <IconButton onClick={() => goto(coursesPath)}>
            <ArrowLeftIcon size={16} class="custom" />
          </IconButton>
        </li>
      {/if}
      <a
        href={coursesPath}
        title="{$t('navigation.goto')} {isCoursePage ? $t('navigation.courses') : $t('navigation.classroomio_home')}"
        id="logo"
        class="line-clamp-1 text-lg"
      >
        {isCoursePage ? title : 'ClassroomIO'}
      </a>
    </div>

    <span class="grow"></span>

    <li>
      <BellIcon class="custom text-white" size={16} />
    </li>
    <li>
      <IconButton size="small" onClick={toggleDarkMode}>
        {#if $globalStore.isDark}
          <SunIcon size={16} class="custom" />
        {:else}
          <MoonIcon class="custom text-white" size={16} />
        {/if}
      </IconButton>
    </li>

    <li></li>
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
