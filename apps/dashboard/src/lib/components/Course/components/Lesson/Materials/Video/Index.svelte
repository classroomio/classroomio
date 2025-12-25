<script lang="ts">
  import YoutubeVideo from './YoutubeVideo.svelte';
  import UploadVideo from './UploadVideo.svelte';
  import EmbedLink from './EmbedLink.svelte';
  import * as CONSTANTS from './constants';
  import { t } from '$lib/utils/functions/translations';
  import { isFreePlan } from '$lib/utils/store/org';
  import ZapIcon from '@lucide/svelte/icons/zap';

  interface Props {
    lessonId?: string;
  }

  let { lessonId = '' }: Props = $props();

  const tabs = CONSTANTS.videoTabs;
  let currentTab = $state(tabs[0].value);

  const onChange = (tab) => () => (currentTab = tab);
</script>

<section class="flex h-full w-full flex-col items-start gap-3 md:flex-row">
  <div class="flex flex-row items-center gap-2 md:flex-col">
    <p class="mb-3 w-full text-start text-sm font-normal text-[#4F4B4B] dark:text-[#b0a9a9]">
      {$t('course.navItem.lessons.materials.tabs.video.add_video.add_by')}
    </p>
    {#each tabs as item (item.value)}
      <button
        onclick={onChange(item.value)}
        class={`my-1 w-full border px-4 py-3 ${
          currentTab === item.value
            ? 'border border-[#0233BD] bg-[#F5F8FE] dark:text-black'
            : 'border border-gray-200'
        } flex cursor-pointer flex-row items-center justify-start gap-2 whitespace-nowrap rounded-md`}
      >
        {#if $isFreePlan && item.value === 3}
          <ZapIcon size={16} class="filled" />
        {:else}
          <item.icon color={`${currentTab === item.value ? 'dark:invert-0' : 'dark:invert'}`} />
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
