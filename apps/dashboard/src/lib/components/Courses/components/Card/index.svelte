<script lang="ts">
  import { goto } from '$app/navigation';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { calcCourseDiscount } from '$lib/utils/functions/course';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import { t } from '$lib/utils/functions/translations';
  import type { CourseTag } from '$lib/utils/types';
  import { COURSE_TYPE } from '$lib/utils/types';
  import {
    ImageLoader,
    OverflowMenu,
    OverflowMenuItem,
    SkeletonPlaceholder,
    Tag
  } from 'carbon-components-svelte';
  import GrowthIcon from 'carbon-icons-svelte/lib/Growth.svelte';
  import RadioButtonChecked from 'carbon-icons-svelte/lib/RadioButtonChecked.svelte';
  import UserProfileIcon from 'carbon-icons-svelte/lib/UserProfile.svelte';

  export let bannerImage: string | undefined;
  export let totalCount = 0;
  export let id = '';
  export let slug = '';
  export let title = '';
  export let description = '';
  export let isPublished = false;
  export let totalLessons = 0;
  export let totalStudents = 0;
  export let currency = 'USD';
  export let isOnLandingPage = false;
  export let isLMS = false;
  export let isLearningPath = false;
  export let totalCourse = 0;
  export let pathwaycompletedCourses = 0;
  export let isExplore = false;
  export let progressRate = 45;
  export let type: COURSE_TYPE;
  export let pricingData: {
    cost: number;
    currency?: string;
    showDiscount?: boolean;
    discount?: number;
  } = {
    cost: 0
  };
  export let tags: CourseTag[] = [];

  $: formatter = getCurrencyFormatter(currency);

  function handleCloneCourse() {
    // TODO: Clone course functionality
    alert('WIP: Clone course');
  }

  function handleShareCourse() {
    goto(`/courses/${id}/settings#share`);
  }

  function handleInvite() {
    goto(`/courses/${id}/people?add=true`);
  }

  function handleDeleteCourse() {
    goto(`/courses/${id}/settings#delete`);
  }

  function getCourseUrl() {
    if (isLMS && isLearningPath) {
      return isOnLandingPage || isExplore ? `/pathway/${slug}` : `/pathways/${id}`;
    }

    return isOnLandingPage || isExplore
      ? `/course/${slug}`
      : `/courses/${id}${isLMS ? '/lessons?next=true' : ''}`;
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

  $: cost = calcCourseDiscount(
    pricingData.discount,
    pricingData.cost ?? 0,
    !!pricingData.showDiscount
  );
 
</script>

<div
  role="button"
  tabindex="0"
  on:click={(e) => {
    goto(getCourseUrl());
  }}
  on:keydown={(e) => {
    if (e.key === 'Enter') {
      goto(getCourseUrl());
    }
  }}
  class="border-gray group relative h-fit w-full max-w-[320px] rounded border text-black dark:border-neutral-600"
>
  <div class="p-4">
    <div class="relative mb-5">
      {#if !isLMS && !isOnLandingPage}
        <OverflowMenu
          class="absolute right-2 top-2 z-40 rounded-full bg-gray-200 opacity-0 transition-all delay-150  duration-200 ease-in-out group-hover:opacity-100 dark:bg-neutral-800"
          size="sm"
          on:click={(e) => e.stopPropagation()}
        >
          <OverflowMenuItem
            text={$t('courses.course_card.context_menu.clone')}
            on:click={handleCloneCourse}
          />
          <OverflowMenuItem
            text={$t('courses.course_card.context_menu.share')}
            on:click={handleShareCourse}
          />
          <OverflowMenuItem
            text={$t('courses.course_card.context_menu.invite')}
            on:click={handleInvite}
          />
          <OverflowMenuItem
            danger
            text={$t('courses.course_card.context_menu.delete')}
            on:click={handleDeleteCourse}
          />
        </OverflowMenu>
      {/if}

      <ImageLoader
        src={bannerImage}
        alt="Course Logo"
        class="relative h-[200px] w-full rounded dark:border dark:border-neutral-600"
      >
        <svelte:fragment slot="loading">
          <SkeletonPlaceholder style="width: 100%; height: 200px;" />
        </svelte:fragment>
        <svelte:fragment slot="error">{$t('courses.course_card.error_message')}</svelte:fragment>
      </ImageLoader>

      {#if isLMS && isLearningPath}
        <span
          class="text-primary-600 absolute left-2 top-2 z-10 rounded-sm bg-white p-1 text-xs font-bold uppercase"
        >
          {$t('lms_pathway.pathway')}
        </span>
      {:else if type}
        {@const tag = COURSE_TAG[type]}
        <span
          class="bg-primary-50 absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-sm p-1 font-mono text-xs capitalize"
        >
          <svelte:component this={tag?.icon} size={16} class={tag?.iconStyle} />
          {tag?.label}
        </span>
      {/if}
    </div>

    <h3 class="title text-xl dark:text-white">{title}</h3>
    <p class="description mt-2 text-sm text-gray-500 dark:text-gray-300">
      {description}
    </p>

    <div class={!isLMS && !isOnLandingPage ? 'mt-1 h-6' : ''}>
      {#if tags && tags.length > 0 && tags.every((tag) => tag !== null)}
        <div
          class="flex w-full max-w-full items-center gap-3 overflow-x-auto"
          style="overflow-x: auto; white-space: nowrap;"
        >
          {#each tags as tag}
            <span
              class="flex items-center justify-center rounded-sm border bg-gray-50 px-2 py-1 text-xs dark:bg-transparent dark:text-white"
            >
              {tag}
            </span>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <div
    class="border-gray flex justify-between border-t px-4 py-2 dark:border-neutral-600 {isLMS &&
      'items-center'}"
  >
    <div>
      <p class="text-xs {isLMS ? '' : 'pl-2'} font-normal dark:text-white">
        {#if isLearningPath && isLMS}
          <!-- for pathways -->
          {#if isExplore}
            {totalCount} {$t('lms_pathway.course')}
          {:else}
            {pathwaycompletedCourses} / {totalCourse} {$t('lms_pathway.course')}
          {/if}
        {:else if !isLearningPath}
          <!-- for courses -->
          {#if isExplore}
            {totalCount} {$t('courses.course_card.lessons_number')}
          {:else}
            {totalLessons} {$t('courses.course_card.lessons_number')}
          {/if}
        {/if}
      </p>
      <p class="py-2 text-xs">
        {#if isOnLandingPage}
          <span class="px-2">
            {#if !cost}
              {$t('course.navItem.landing_page.pricing_section.free')}
            {:else if pricingData.showDiscount}
              {formatter.format(cost)}
              <span class="line-through">
                {formatter?.format(pricingData?.cost)}
              </span>
            {:else}
              {formatter.format(cost)}
            {/if}
          </span>
        {:else if isLMS}
          {#if !isExplore}
            <div class="flex items-center gap-2">
              <div class=" relative h-1 w-[50px] bg-[#EAEAEA]">
                <div
                  style="width:{progressRate}%"
                  class={`bg-primary-700 absolute left-0 top-0 h-full`}
                />
              </div>
              <p class="text-xs text-[#656565] dark:text-white">{progressRate}%</p>
            </div>
          {/if}
        {:else}
          <Tag type={isPublished ? 'green' : 'cool-gray'}>
            {#if isPublished}
              {$t('courses.course_card.published')}
            {:else}
              {$t('courses.course_card.unpublished')}
            {/if}
          </Tag>
        {/if}
      </p>
    </div>

    {#if isLMS}
      <PrimaryButton
        label={isExplore
          ? $t('courses.course_card.learn_more')
          : isLearningPath
            ? $t('lms_pathway.continue')
            : $t('courses.course_card.continue_course')}
        variant={VARIANTS.OUTLINED}
        className="rounded-none"
      />
    {:else if !isOnLandingPage}
      <div class="flex flex-col justify-between">
        <p class="pl-2 text-xs dark:text-white">
          {totalStudents}
          {$t('courses.course_card.students')}
        </p>
        <div></div>
      </div>
    {/if}
  </div>
</div>

<style>
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
