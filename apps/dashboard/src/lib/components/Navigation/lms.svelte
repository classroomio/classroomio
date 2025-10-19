<script lang="ts">
  import { page } from '$app/state';
  import { browser } from '$app/environment';
  import BellIcon from '@lucide/svelte/icons/bell';
  import MoonIcon from '@lucide/svelte/icons/moon';
  import SunIcon from '@lucide/svelte/icons/sun';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import XIcon from '@lucide/svelte/icons/x';
  import MenuIcon from '@lucide/svelte/icons/menu';

  import { IconButton } from '$lib/components/IconButton';
  import { globalStore } from '$lib/utils/store/app';
  import { sideBar } from '$lib/components/Org/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { toggleBodyByMode } from '$lib/utils/functions/app';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    navClass?: string;
  }

  let { navClass = '' }: Props = $props();

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

  function shortenName(name: string) {
    return name?.substring(0, 2)?.toUpperCase() || '';
  }
</script>

<nav class="{navClass} bg-primary-700 flex h-[48px] w-full p-2 md:px-6">
  <ul class="flex w-full items-center">
    <li class="md:hidden">
      <IconButton onClick={toggleSidebar}>
        {#if $sideBar.hidden}
          <MenuIcon size={16} />
        {:else}
          <XIcon size={16} />
        {/if}
      </IconButton>
    </li>
    <div class="">
      <a href={page.url.pathname} title={$t('navigation.goto_home')} id="logo" class="flex items-center text-lg">
        {#if $currentOrg.avatar_url}
          <Avatar
            src={$currentOrg.avatar_url}
            name={$currentOrg.name}
            shape="rounded-md"
            width="w-7"
            height="h-7"
            className="mr-2"
          />
        {:else}
          <TextChip value={shortenName($currentOrg.name)} className="bg-primary-200 font-bold mr-2 dark:text-black" />
        {/if}
        <span class="line-clamp-1">
          {$currentOrg.name}
        </span>
      </a>
    </div>

    <span class="grow"></span>

    <li>
      <BellIcon class="text-white" size={16} />
    </li>
    <li>
      <IconButton size="small" onClick={toggleDarkMode}>
        {#if $globalStore.isDark}
          <SunIcon class="text-white" size={16} />
        {:else}
          <MoonIcon class="text-white" size={16} />
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
