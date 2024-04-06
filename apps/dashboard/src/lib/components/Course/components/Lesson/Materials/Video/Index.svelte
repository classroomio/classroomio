<script>
  import YoutubeVideo from './YoutubeVideo.svelte';
  import LocalVideo from './LocalVideo.svelte';
  import EmbedLink from './EmbedLink.svelte';
  import * as CONSTANTS from './constants';
  import { isFreePlan } from '$lib/utils/store/org';
  import FlashFilled from 'carbon-icons-svelte/lib/FlashFilled.svelte';

  export let lessonId = '';

  let tabs = CONSTANTS.videoTabs;
  let currentTab = tabs[0].value;

  const onChange = (tab) => () => (currentTab = tab);
</script>

<section class="w-full h-full flex flex-col md:flex-row items-start gap-3">
  <div class="flex flex-row md:flex-col gap-2 items-center">
    <p class="text-sm font-normal text-start text-[#4F4B4B] dark:text-[#b0a9a9] mb-3 w-full">
      Add By
    </p>
    {#each tabs as item (item.value)}
      <button
        on:click={onChange(item.value)}
        class={`w-full px-4 py-3 my-1 border ${
          currentTab === item.value
            ? 'border border-[#0233BD] bg-[#F5F8FE] dark:text-black'
            : 'border border-gray-200 dark:border-neutral-600'
        } rounded-md cursor-pointer flex flex-row items-center justify-start gap-2 whitespace-nowrap`}
      >
        {#if $isFreePlan && item.value === 3}
          <FlashFilled size={20} class="text-blue-700" />
        {:else}
          <svelte:component
            this={item.icon}
            size={20}
            color={`${currentTab === item.value ? 'dark:invert-0' : 'dark:invert'}`}
          />
        {/if}
        <p>{item.title}</p>
      </button>
    {/each}
  </div>
  <main class="w-full h-full">
    {#if currentTab === 1}
      <YoutubeVideo />
    {:else if currentTab === 2}
      <EmbedLink />
    {:else}
      <LocalVideo {lessonId} />
    {/if}
  </main>
</section>
