<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import hotkeys from 'hotkeys-js';
  import Forum from 'carbon-icons-svelte/lib/Forum.svelte';
  import AlignBoxTopLeft from 'carbon-icons-svelte/lib/AlignBoxTopLeft.svelte';
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

  let resize = false;
  let isDragging = false;
  let isDown = writable(false);
  let startX: number;
  let initialWidth: number;
  let appBarRef: HTMLDivElement;
  let appContentRef: HTMLDivElement;

  let topPadding = $apps.isStudent ? '48px' : '109px';

  const getResizableSidebar = () => {
    if (!browser) return;

    return window.innerWidth >= 1024;
  };

  function handleClose() {
    $apps.selectedApp = undefined;
    if (getResizableSidebar()) {
      appBarRef.style.width = '60px';
    } else if (!getResizableSidebar() && $apps.isStudent) {
      $apps.open = false;
    }
  }

  function handleAppClick(appName?: string) {
    if (!$apps.selectedApp && getResizableSidebar()) {
      if (window.innerWidth <= 1024) {
        appBarRef.style.width = '300px';
      } else {
        appBarRef.style.width = '500px';
      }
    }
    if (appName === $apps.selectedApp) {
      handleClose();
    } else {
      $apps.selectedApp = appName;
    }
    $apps.dropdown = false;
  }

  function handleCursor(event: MouseEvent) {
    if (!getResizableSidebar()) return;
    if (!resize && $apps.selectedApp) {
      const isNearLeftBorder = event.clientX - appContentRef.getBoundingClientRect().left < 8;
      const isNearRightBorder = appContentRef.getBoundingClientRect().right - event.clientX < 8;

      if (isNearLeftBorder || isNearRightBorder) {
        appContentRef.style.cursor = 'ew-resize';
      } else {
        appContentRef.style.cursor = 'auto';
      }
    }
  }

  function startDragging(event: MouseEvent) {
    console.log('start dragging');
    $isDown = true;
    setTimeout(() => {
      console.log('is down', $isDown);
      if (event.button === 0 && $apps.selectedApp && $isDown) {
        console.log('start dragging if');
        event.preventDefault();
        const isNearLeftBorder = event.clientX - appContentRef.getBoundingClientRect().left < 5;
        const isNearRightBorder = appContentRef.getBoundingClientRect().right - event.clientX < 5;

        if (
          (isNearRightBorder || isNearLeftBorder) &&
          event.clientX >= 0 &&
          event.clientX <= window.innerWidth
        ) {
          console.log('is dragging');
          isDragging = true;
          resize = true;
          startX = event.clientX;
          initialWidth = parseInt(getComputedStyle(appBarRef).width, 10) + 5;
        }
      }
    }, 100);
  }

  function stopDragging() {
    isDragging = false;
    resize = false;
    $isDown = false;
  }

  function dragSidebar(event: MouseEvent) {
    if (!getResizableSidebar()) return;
    if (!isDragging || !$apps.selectedApp) return;
    const deltaX = startX - event.clientX + 60;
    let newWidth = initialWidth + deltaX;
    if (newWidth <= 250) {
      handleClose();
      appBarRef.style.width = '60px';
      appContentRef.style.width = '0';
    } else {
      appBarRef.style.width = newWidth + 'px';
    }
  }

  function updateTopPadding(isStudent: boolean) {
    topPadding = isStudent ? '48px' : '109px';
  }

  onMount(() => {
    updateTopPadding($apps.isStudent);
    if (getResizableSidebar()) {
      appBarRef.addEventListener('mousedown', startDragging);
      document.addEventListener('mousemove', dragSidebar);
      document.addEventListener('mouseup', stopDragging);
      document.addEventListener('mousemove', handleCursor);
    }
    hotkeys('A+1,A+2,A+3,A+4', function (event, handler) {
      event.preventDefault();
      switch (handler.key) {
        case 'A+1':
          handleAppClick(APPS_CONSTANTS.APPS.COMMENTS);
          break;
        case 'A+2':
          handleAppClick(APPS_CONSTANTS.APPS.QANDA);
          break;
        case 'A+3':
          handleAppClick(APPS_CONSTANTS.APPS.NOTES);
          break;
        case 'A+4':
          handleAppClick(APPS_CONSTANTS.APPS.POLL);
          break;
      }
    });
  });

  onDestroy(() => {
    if (getResizableSidebar()) {
      appBarRef.removeEventListener('mousedown', startDragging);
      document.removeEventListener('mousemove', dragSidebar);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('mousemove', handleCursor);
    }
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
          $apps.dropdown = !$apps.dropdown;
        }}
      >
        <Settings size={24} class="carbon-icon dark:text-white lg:hidden" />
      </IconButton>
    </div>

    <div class="mb-2 relative">
      <IconButton
        toolTipProps={{ title: 'Comments', hotkeys: ['A', '1'] }}
        value={APPS_CONSTANTS.APPS.COMMENTS}
        onClick={handleAppClick}
        contained={APPS_CONSTANTS.APPS.COMMENTS === $apps.selectedApp}
        buttonClassName="relative"
      >
        <Chip value={$lesson.totalComments} className="absolute -top-2 right-0 bg-primary-500" />
        <SendAlt size={24} class="carbon-icon dark:text-white" />
      </IconButton>
    </div>
    <div class="mb-2">
      <IconButton
        toolTipProps={{ title: 'QandA', hotkeys: ['A', '2'] }}
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
    </div>
    <div class="mb-2">
      <IconButton
        toolTipProps={{ title: 'Poll', hotkeys: ['A', '4'] }}
        value={APPS_CONSTANTS.APPS.POLL}
        onClick={handleAppClick}
        contained={APPS_CONSTANTS.APPS.POLL === $apps.selectedApp}
      >
        <ChartPie size={24} class="carbon-icon dark:text-white" />
      </IconButton>
    </div>
  </div>

  {#if !!$apps.selectedApp}
    <div
      class={`app cursor-auto lg:cursor-ew-resize  ${
        resize && ' border-l-8 border-l-blue-500 transition-none'
      } `}
      bind:this={appContentRef}
    >
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
      min-width: 280px;
      max-width: 300px;
      width: 300px;
      position: relative;
      overflow: auto;
    }
  }

  @media screen and (max-width: 767px) {
    .app {
      width: 100%;
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
