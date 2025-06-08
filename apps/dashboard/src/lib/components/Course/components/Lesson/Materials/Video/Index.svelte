<script>
  import YoutubeVideo from './YoutubeVideo.svelte';
  import UploadVideo from './UploadVideo.svelte';
  import EmbedLink from './EmbedLink.svelte';
  import * as CONSTANTS from './constants';
  import { t } from '$lib/utils/functions/translations';
  import { isFreePlan } from '$lib/utils/store/org';
  import FlashFilled from 'carbon-icons-svelte/lib/FlashFilled.svelte';

  export let lessonId = '';

  const tabs = CONSTANTS.videoTabs;
  let currentTab = tabs[0].value;

  const onChange = (tab) => () => (currentTab = tab);
</script>

<section class="flex h-full w-full flex-col items-start gap-3 md:flex-row">
  <div class="flex flex-row items-center gap-2 md:flex-col">
    <p class="mb-3 w-full text-start text-sm font-normal text-[#4F4B4B] dark:text-[#b0a9a9]">
      {$t('course.navItem.lessons.materials.tabs.video.add_video.add_by')}
    </p>
    {#each tabs as item (item.value)}
      <button
        on:click={onChange(item.value)}
        class={`my-1 w-full border px-4 py-3 ${
          currentTab === item.value
            ? 'border border-[#0233BD] bg-[#F5F8FE] dark:text-black'
            : 'border border-gray-200 dark:border-neutral-600'
        } flex cursor-pointer flex-row items-center justify-start gap-2 whitespace-nowrap rounded-md`}
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
        <p>{$t(item.title)}</p>
      </button>
    {/each}
  </div>
  <main class="h-full w-full">
    {#if currentTab === 1}
      <YoutubeVideo />
    {:else if currentTab === 2}
      <EmbedLink />
    {:else}
      <UploadVideo {lessonId} />
    {/if}
  </main>
</section>
