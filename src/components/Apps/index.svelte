<script>
  import { onMount } from "svelte";
  import hotkeys from "hotkeys-js";
  import Forum24 from "carbon-icons-svelte/lib/Forum24";
  import AlignBoxTopLeft24 from "carbon-icons-svelte/lib/AlignBoxTopLeft24";
  import SendAlt24 from "carbon-icons-svelte/lib/SendAlt24";
  import ChartPie24 from "carbon-icons-svelte/lib/ChartPie24";
  import IconButton from "../IconButton/index.svelte";

  import QandA from "./components/QandA/index.svelte";
  import LiveChat from "./components/LiveChat/index.svelte";
  import Notes from "./components/Notes/index.svelte";
  import Poll from "./components/Poll/index.svelte";
  import APPS_CONSTANTS from "./constants";

  let selectedApp;

  function handleClose() {
    selectedApp = null;
  }

  function handleAppClick(appName) {
    if (appName === selectedApp) {
      handleClose();
    } else {
      selectedApp = appName;
    }
  }

  onMount(() => {
    hotkeys("A+1,A+2,A+3,A+4", function (event, handler) {
      event.preventDefault();
      switch (handler.key) {
        case "A+1":
          handleAppClick(APPS_CONSTANTS.APPS.LIVE_CHAT);
          break;
        case "A+2":
          handleAppClick(APPS_CONSTANTS.APPS.QANDA);
          break;
        case "A+3":
          handleAppClick(APPS_CONSTANTS.APPS.NOTES);
          break;
        case "A+4":
          handleAppClick(APPS_CONSTANTS.APPS.POLL);
          break;
      }
    });
  });
</script>

<div class="root">
  <div class="apps">
    <IconButton
      toolTipProps={{ title: "Live Chat", hotkeys: ["A", "1"] }}
      value={APPS_CONSTANTS.APPS.LIVE_CHAT}
      onClick={handleAppClick}
      selected={APPS_CONSTANTS.APPS.LIVE_CHAT === selectedApp}
    >
      <SendAlt24 class="carbon-icon" />
    </IconButton>

    <IconButton
      toolTipProps={{ title: "QandA", hotkeys: ["A", "2"] }}
      value={APPS_CONSTANTS.APPS.QANDA}
      onClick={handleAppClick}
      selected={APPS_CONSTANTS.APPS.QANDA === selectedApp}
    >
      <Forum24 class="carbon-icon" />
    </IconButton>

    <IconButton
      toolTipProps={{ title: "Notes", hotkeys: ["A", "3"] }}
      value={APPS_CONSTANTS.APPS.NOTES}
      onClick={handleAppClick}
      selected={APPS_CONSTANTS.APPS.NOTES === selectedApp}
    >
      <AlignBoxTopLeft24 class="carbon-icon" />
    </IconButton>

    <IconButton
      toolTipProps={{ title: "Poll", hotkeys: ["A", "4"] }}
      value={APPS_CONSTANTS.APPS.POLL}
      onClick={handleAppClick}
      selected={APPS_CONSTANTS.APPS.POLL === selectedApp}
    >
      <ChartPie24 class="carbon-icon" />
    </IconButton>
  </div>

  {#if !!selectedApp}
    <div class="app">
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
    height: 95vh;
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
      width: 400px;
      transition: all 1s ease-out;
      position: relative;
      overflow: auto;
    }
  }
</style>
