<script lang="ts">
  import {
    Tag,
    ImageLoader,
    SkeletonPlaceholder,
    ContextMenu,
    ContextMenuDivider,
    ContextMenuOption
  } from 'carbon-components-svelte';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import CopyFile from 'carbon-icons-svelte/lib/CopyFile.svelte';
  import Share from 'carbon-icons-svelte/lib/Share.svelte';
  import UserFollow from 'carbon-icons-svelte/lib/UserFollow.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { COURSE_TYPE } from '$lib/utils/types';
  import RadioButtonChecked from 'carbon-icons-svelte/lib/RadioButtonChecked.svelte';
  import GrowthIcon from 'carbon-icons-svelte/lib/Growth.svelte';
  import UserProfileIcon from 'carbon-icons-svelte/lib/UserProfile.svelte';

  export let bannerImage: string | undefined;
  export let id = '';
  export let slug = '';
  export let title = '';
  export let description = '';
  export let cost = 0;
  export let totalLessons = 0;
  export let currency = 'USD';
  export let isLMS = false;

  export let type: COURSE_TYPE;

  let target: any;

  $: formatter = getCurrencyFormatter(currency);

  function getCourseUrl() {
    return `/course/${slug}`;
  }

  const COURSE_TAG: Record<
    string,
    {
      style: string;
      label: string;
      icon: any;
      iconStyle?: string;
    }
  > = {
    [COURSE_TYPE.LIVE_CLASS]: {
      style: '',
      label: $t('course.navItem.settings.live_class'),
      icon: RadioButtonChecked,
      iconStyle: 'text-red-700'
    },
    [COURSE_TYPE.SELF_PACED]: {
      style: '',
      label: $t('course.navItem.settings.self_paced'),
      icon: UserProfileIcon,
      iconStyle: 'text-primary-700'
    },
    SPECIALIZATION: {
      style: '',
      label: $t('specialization.course_tag'),
      icon: GrowthIcon
    }
  };
</script>

<a
  rel="prefetch"
  bind:this={target}
  href={getCourseUrl()}
  class="text-black border border-gray dark:border-neutral-600 rounded w-full max-w-[300px] relative hover:scale-95 transition-all ease-in-out"
>
  <div class="p-4">
    <div class="relative mb-5">
      <ImageLoader
        src={bannerImage}
        alt="Course Logo"
        class="h-[170px] w-full rounded dark:border dark:border-neutral-600 relative"
      >
        <svelte:fragment slot="loading">
          <SkeletonPlaceholder style="width: 100%; height: 170px;" />
        </svelte:fragment>
        <svelte:fragment slot="error">{$t('courses.course_card.error_message')}</svelte:fragment>
      </ImageLoader>
      {#if type}
        {@const tag = COURSE_TAG[type]}
        <span
          class="absolute bottom-2 left-2 z-10 text-xs capitalize bg-primary-50 rounded-sm p-1 flex items-center gap-1 font-mono"
        >
          <svelte:component this={tag.icon} size={16} class={tag.iconStyle} />
          {tag.label}
        </span>
      {/if}
    </div>

    <h3 class="text-xl dark:text-white title">{title}</h3>
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-300 description">
      {description}
    </p>
  </div>

  <div class="p-3 border-t border-gray dark:border-neutral-600 flex justify-between">
    <div>
      <p class="text-xs {!isLMS && 'pl-2'} dark:text-white">
        {totalLessons}
        {$t('courses.course_card.lessons_number')}
      </p>
    </div>
    <p class="text-xs">
      <span class="px-2 font-semibold"
        >{!cost
          ? $t('course.navItem.landing_page.pricing_section.free')
          : formatter.format(cost)}</span
      >
    </p>
  </div>
</a>

<style>
  a,
  a:hover {
    text-decoration: none;
  }
  .title,
  .description {
    height: 42px;
    line-height: 20px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -moz-box-orient: vertical;
    -ms-box-orient: vertical;
    box-orient: vertical;
    -webkit-line-clamp: 2;
    -moz-line-clamp: 2;
    -ms-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
</style>
