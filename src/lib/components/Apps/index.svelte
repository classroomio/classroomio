<script lang="ts">
  import { onMount } from 'svelte';
  import hotkeys from 'hotkeys-js';
  import { fade } from 'svelte/transition';
  import SendAlt from 'carbon-icons-svelte/lib/SendAlt.svelte';
  import ChartPie from 'carbon-icons-svelte/lib/ChartPie.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import Settings from 'carbon-icons-svelte/lib/Settings.svelte';
  import { apps } from './store';

  import Chip from '$lib/components/Chip/index.svelte';
  import QandA from './components/QandA/index.svelte';
  import Comments from './components/Comments/index.svelte';
  import Notes from './components/Notes/index.svelte';
  import Poll from './components/Poll/index.svelte';
  import APPS_CONSTANTS from './constants';
  import { browser } from '$app/environment';
  import { lesson } from '$lib/components/Course/components/Lesson/store/lessons';

  let appBarRef: HTMLDivElement;
  let appContentRef: HTMLDivElement;
  let topPadding = $apps.isStudent ? '48px' : '109px';

  const getResizableSidebar = () => {
    if (!browser) return;

    return window.innerWidth >= 1024;
  };

  function handleClose() {
    $apps.selectedApp = undefined;
    if ($apps.isStudent) {
      $apps.open = false;
    }
  }

  function handleAppClick(appName?: string) {
    if (appName === $apps.selectedApp) {
      handleClose();
    } else {
      $apps.selectedApp = appName;
    }
    $apps.dropdown = !$apps.dropdown;
  }

  function updateTopPadding(isStudent: boolean) {
    topPadding = isStudent ? '48px' : '109px';
  }

  function getAppClass(appName: string, selected: string | undefined) {
    return `transition duration-500 delay-150 ease-in-out border-t-0 border-b-0 border-r-0 ${
      appName === selected ? 'border-l-4 border-indigo-600 focus:border-indigo-600' : 'border-l-0'
    }`;
  }

  onMount(() => {
    updateTopPadding($apps.isStudent);

    hotkeys('A+1,A+2', function (event, handler) {
      event.preventDefault();
      switch (handler.key) {
        case 'A+1':
          handleAppClick(APPS_CONSTANTS.APPS.COMMENTS);
          break;
        case 'A+2':
          handleAppClick(APPS_CONSTANTS.APPS.POLL);
          break;
        // case 'A+3':
        //   handleAppClick(APPS_CONSTANTS.APPS.NOTES);
        //   break;
        // case 'A+4':
        //   handleAppClick(APPS_CONSTANTS.APPS.QANDA);
        //   break;
      }
    });
  });

  $: updateTopPadding($apps.isStudent);
  $: getResizableSidebar();
</script>

<div
  style={`--top-padding:${topPadding}`}
  class={`${$apps.open ? 'open ' : 'close'} root bg-white dark:bg-black`}
  bind:this={appBarRef}
>
  <div class="apps">
    <div class="lg:hidden mb-2">
      <IconButton
        buttonClassName="lg:hidden"
        toolTipProps={{ title: 'Settings', hotkeys: ['A', '0'] }}
        onClick={() => {
          handleAppClick();
        }}
      >
        <Settings size={24} class="carbon-icon dark:text-white lg:hidden" />
      </IconButton>
    </div>

    <div class="mb-2 relative {getAppClass(APPS_CONSTANTS.APPS.COMMENTS, $apps.selectedApp)}">
      <IconButton
        toolTipProps={{ title: 'Comments', hotkeys: ['A', '1'] }}
        value={APPS_CONSTANTS.APPS.COMMENTS}
        onClick={handleAppClick}
        buttonClassName="relative"
      >
        <Chip
          value={$lesson.totalComments}
          className="absolute -top-1 right-0 bg-primary-600 text-white"
        />
        <SendAlt size={24} class="carbon-icon dark:text-white" />
      </IconButton>
    </div>
    <div class="mb-2 {getAppClass(APPS_CONSTANTS.APPS.POLL, $apps.selectedApp)}">
      <IconButton
        toolTipProps={{ title: 'Poll', hotkeys: ['A', '2'] }}
        value={APPS_CONSTANTS.APPS.POLL}
        onClick={handleAppClick}
      >
        <ChartPie size={24} class="carbon-icon dark:text-white" />
      </IconButton>
    </div>
    <!-- <div class="mb-2">
      <IconButton
        toolTipProps={{ title: 'QandA', hotkeys: ['A', '3'] }}
        value={APPS_CONSTANTS.APPS.QANDA}
        onClick={handleAppClick}
        contained={APPS_CONSTANTS.APPS.QANDA === $apps.selectedApp}
      >
        <Forum size={24} class="carbon-icon dark:text-white" />
      </IconButton>
    </div>
    <div class="mb-2">
      <IconButton
        toolTipProps={{ title: 'Notes', hotkeys: ['A', '3'] }}
        value={APPS_CONSTANTS.APPS.NOTES}
        onClick={handleAppClick}
        contained={APPS_CONSTANTS.APPS.NOTES === $apps.selectedApp}
      >
        <AlignBoxTopLeft size={24} class="carbon-icon dark:text-white" />
      </IconButton>
    </div> -->
  </div>

  {#if !!$apps.selectedApp}
    <div
      class="app max-w-[350px] transition ease-in-out delay-150 duration-100"
      bind:this={appContentRef}
    >
      {#key $apps.selectedApp}
        <div class="h-full w-full" transition:fade={{ duration: 200 }}>
          {#if $apps.selectedApp === APPS_CONSTANTS.APPS.QANDA}
            <QandA {handleClose} />
          {:else if $apps.selectedApp === APPS_CONSTANTS.APPS.COMMENTS}
            <Comments {handleClose} />
          {:else if $apps.selectedApp === APPS_CONSTANTS.APPS.POLL}
            <Poll {handleClose} />
          {:else if $apps.selectedApp === APPS_CONSTANTS.APPS.NOTES}
            <Notes {handleClose} />
          {/if}
        </div>
      {/key}
    </div>
  {/if}
</div>

<style lang="scss">
  .root {
    height: calc(100vh - 48px);
    position: sticky;
    top: 0;
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: row;
    z-index: 1;

    & .apps {
      padding-top: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 60px;
      border-right: 1px solid var(--border-color);
      height: 100%;
    }

    & .app {
      width: 100%;
      position: relative;
      overflow: auto;
    }
  }

  @media screen and (min-width: 768px) and (max-width: 1023px) {
    .app {
      width: 50vw;
      position: relative;
      overflow: auto;
    }
  }

  @media screen and (max-width: 767px) {
    .app {
      width: 100vw;
      min-width: calc(100vw - 60px);
      position: relative;
      overflow: auto;
    }
  }

  @media screen and (max-width: 1023px) {
    .root {
      position: absolute;
      height: calc(100vh - var(--top-padding));
      top: var(--top-padding);
      right: 0;
      z-index: 999;
    }
    .open {
      position: absolute;
      transform: translateX(0);

      transition: all 0.2s ease-in-out;
    }
    .close {
      position: absolute;
      transform: translateX(100%);
      display: none;
      transition: all 0.2s ease-in-out;
    }
  }

  @media screen and (min-width: 1024px) {
    .root {
      height: calc(100vh - 48px);
      position: sticky;
      top: 0;
      border-left: 1px solid var(--border-color);
      display: flex;
      flex-direction: row;
      z-index: 1;

      & .apps {
        padding-top: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 60px;
        border-right: 1px solid var(--border-color);
        height: 100%;
      }

      & .app {
        width: 100%;
        position: relative;
        overflow: auto;
      }
    }
  }
</style>
