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
  export let totalCount = 0;
  export let id = '';
  export let slug = '';
  export let title = '';
  export let description = '';
  export let isPublished = false;
  export let cost = 0;
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

  let target: any;

  $: formatter = getCurrencyFormatter(currency);

  function handleCloneCourse() {
    // TODO: Clone course functionality
    alert('WIP: Clone course');
  }

  function handleShareCourse() {
    // TODO: Share course functionality
    alert('WIP: Share course');
  }

  function handleInvite() {
    // TODO: Invite functionality
    alert('WIP: Invite people to course');
  }

  function handleDeleteCourse() {
    // TODO: Delete course functionality
    alert('WIP: Delete course');
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
</script>

{#if !isLMS && !isOnLandingPage}
  <ContextMenu {target}>
    <ContextMenuOption
      indented
      labelText={$t('courses.course_card.context_menu.clone')}
      icon={CopyFile}
      on:click={handleCloneCourse}
    />
    <ContextMenuOption
      indented
      labelText={$t('courses.course_card.context_menu.share')}
      icon={Share}
      on:click={handleShareCourse}
    />
    <ContextMenuOption
      indented
      labelText={$t('courses.course_card.context_menu.invite')}
      icon={UserFollow}
      on:click={handleInvite}
    />
    <ContextMenuDivider />
    <ContextMenuOption
      kind="danger"
      labelText={$t('courses.course_card.context_menu.delete')}
      on:click={handleDeleteCourse}
    />
  </ContextMenu>
{/if}

<a
  rel="prefetch"
  bind:this={target}
  href={getCourseUrl()}
  class="text-black border border-gray dark:border-neutral-600 rounded w-full max-w-[320px] relative hover:scale-95 transition-all ease-in-out"
>
  <div class="p-4">
    <div class="relative mb-5">
      <ImageLoader
        src={bannerImage}
        alt="Course Logo"
        class="h-[200px] w-full rounded dark:border dark:border-neutral-600 relative"
      >
        <svelte:fragment slot="loading">
          <SkeletonPlaceholder style="width: 100%; height: 200px;" />
        </svelte:fragment>
        <svelte:fragment slot="error">{$t('courses.course_card.error_message')}</svelte:fragment>
      </ImageLoader>

      {#if isLMS && isLearningPath}
        <span
          class="absolute top-2 left-2 z-10 text-xs font-bold uppercase bg-white text-primary-600 rounded-sm p-1"
        >
          {$t('lms_pathway.pathway')}
        </span>
      {:else if type}
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

  <div
    class="px-4 py-2 border border-gray dark:border-neutral-600 border-b-0 border-l-0 border-r-0 flex justify-between {isLMS &&
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
      <p class="text-xs py-2">
        {#if isOnLandingPage}
          <span class="px-2"
            >{!cost
              ? $t('course.navItem.landing_page.pricing_section.free')
              : formatter.format(cost)}</span
          >
        {:else if isLMS}
          {#if !isExplore}
            <div class="flex items-center gap-2">
              <div class=" relative bg-[#EAEAEA] w-[50px] h-1">
                <div
                  style="width:{progressRate}%"
                  class={`absolute top-0 left-0 bg-primary-700 h-full`}
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
        <p class="text-xs pl-2 dark:text-white">
          {totalStudents}
          {$t('courses.course_card.students')}
        </p>
        <div></div>
      </div>
    {/if}
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
