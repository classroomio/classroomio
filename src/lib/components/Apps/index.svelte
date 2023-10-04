<script>
  import { onDestroy, onMount } from 'svelte';
  import hotkeys from 'hotkeys-js';
  import Forum from 'carbon-icons-svelte/lib/Forum.svelte';
  import AlignBoxTopLeft from 'carbon-icons-svelte/lib/AlignBoxTopLeft.svelte';
  import SendAlt from 'carbon-icons-svelte/lib/SendAlt.svelte';
  import ChartPie from 'carbon-icons-svelte/lib/ChartPie.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import Settings from 'carbon-icons-svelte/lib/Settings.svelte';
  import { apps } from './store';

  import QandA from './components/QandA/index.svelte';
  import LiveChat from './components/LiveChat/index.svelte';
  import Notes from './components/Notes/index.svelte';
  import Poll from './components/Poll/index.svelte';
  import APPS_CONSTANTS from './constants';
  import { browser } from '$app/environment';

  let selectedApp;
  let resize = false;
  let isDragging = false;
  let startX;
  let initialWidth;
  let appBarRef;
  let appContentRef;

  const getResizableSidebar = () => {
    if (!browser) return;

    return window.innerWidth >= 1024;
  };

  function handleClose() {
    selectedApp = null;
    if (getResizableSidebar()) {
      appBarRef.style.width = '60px';
    }
  }

  function handleAppClick(appName) {
    if (!selectedApp && getResizableSidebar()) {
      if (window.innerWidth <= 1024) {
        appBarRef.style.width = '300px';
      } else {
        appBarRef.style.width = '500px';
      }
    }
    if (appName === selectedApp) {
      handleClose();
    } else {
      selectedApp = appName;
    }
    $apps.dropdown = false;
  }

  function handleCursor(event) {
    if (!getResizableSidebar()) return;
    if (!resize && selectedApp) {
      const isNearLeftBorder = event.clientX - appContentRef.getBoundingClientRect().left < 8;
      const isNearRightBorder = appContentRef.getBoundingClientRect().right - event.clientX < 8;

      if (isNearLeftBorder || isNearRightBorder) {
        appContentRef.style.cursor = 'ew-resize';
      } else {
        appContentRef.style.cursor = 'auto';
      }
    }
  }

  function startDragging(event) {
    if (!getResizableSidebar()) return;
    if (event.button === 0 && selectedApp) {
      event.preventDefault();
      const isNearLeftBorder = event.clientX - appContentRef.getBoundingClientRect().left < 8;
      const isNearRightBorder = appContentRef.getBoundingClientRect().right - event.clientX < 8;

      if (
        (isNearRightBorder || isNearLeftBorder) &&
        event.clientX >= 0 &&
        event.clientX <= window.innerWidth
      ) {
        isDragging = true;
        resize = true;
        startX = event.clientX;
        initialWidth = parseInt(getComputedStyle(appBarRef).width, 10);
      }
    }
  }

  function stopDragging() {
    if (!getResizableSidebar()) return;
    isDragging = false;
    resize = false;
  }

  function dragSidebar(event) {
    if (!getResizableSidebar()) return;
    if (!isDragging || !selectedApp) return;
    const deltaX = startX - event.clientX + 60;
    let newWidth = initialWidth + deltaX;
    if (newWidth <= 100) {
      handleClose();
      appBarRef.style.width = '60px';
      appContentRef.style.width = '0';
    } else {
      appBarRef.style.width = newWidth + 'px';
    }
  }

  onMount(() => {
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
          handleAppClick(APPS_CONSTANTS.APPS.LIVE_CHAT);
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
  $: getResizableSidebar();
</script>

<div
  class={`${$apps.open ? 'open dark:bg-black' : 'close dark:bg-black'} root`}
  bind:this={appBarRef}
>
  <div class="apps">
    <div class="lg:hidden">
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

    <IconButton
      toolTipProps={{ title: 'Live Chat', hotkeys: ['A', '1'] }}
      value={APPS_CONSTANTS.APPS.LIVE_CHAT}
      onClick={handleAppClick}
      selected={APPS_CONSTANTS.APPS.LIVE_CHAT === selectedApp}
    >
      <SendAlt size={24} class="carbon-icon dark:text-white" />
    </IconButton>

    <IconButton
      toolTipProps={{ title: 'QandA', hotkeys: ['A', '2'] }}
      value={APPS_CONSTANTS.APPS.QANDA}
      onClick={handleAppClick}
      selected={APPS_CONSTANTS.APPS.QANDA === selectedApp}
    >
      <Forum size={24} class="carbon-icon dark:text-white" />
    </IconButton>

    <IconButton
      toolTipProps={{ title: 'Notes', hotkeys: ['A', '3'] }}
      value={APPS_CONSTANTS.APPS.NOTES}
      onClick={handleAppClick}
      selected={APPS_CONSTANTS.APPS.NOTES === selectedApp}
    >
      <AlignBoxTopLeft size={24} class="carbon-icon dark:text-white" />
    </IconButton>

    <IconButton
      toolTipProps={{ title: 'Poll', hotkeys: ['A', '4'] }}
      value={APPS_CONSTANTS.APPS.POLL}
      onClick={handleAppClick}
      selected={APPS_CONSTANTS.APPS.POLL === selectedApp}
    >
      <ChartPie size={24} class="carbon-icon dark:text-white" />
    </IconButton>
  </div>

  {#if !!selectedApp}
    <div
      class={`app cursor-auto lg:cursor-ew-resize  ${
        resize && ' border-l-8 border-l-blue-500 transition-none'
      } `}
      bind:this={appContentRef}
    >
      {#if selectedApp === APPS_CONSTANTS.APPS.QANDA}
        <QandA {handleClose} />
      {:else if selectedApp === APPS_CONSTANTS.APPS.LIVE_CHAT}
        <LiveChat {handleClose} />
      {:else if selectedApp === APPS_CONSTANTS.APPS.POLL}
        <Poll {handleClose} />
      {:else if selectedApp === APPS_CONSTANTS.APPS.NOTES}
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
      height: calc(100vh - 109px);
      top: 109px;
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
