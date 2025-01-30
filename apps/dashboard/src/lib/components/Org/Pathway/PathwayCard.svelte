<script lang="ts">
  import { goto } from '$app/navigation';
  import { t } from '$lib/utils/functions/translations';
  import { ImageLoader, SkeletonPlaceholder, Tag } from 'carbon-components-svelte';

  export let id: string = '';
  export let slug: string = '';
  export let title: string = '';
  export let description: string = '';
  export let bannerImage: string = '';
  export let isPublished: boolean = false;
  export let totalCourse: number = 0;
  export let isOnLandingPage: boolean = false;
  export let isExplore: boolean = false;

  function getCourseUrl() {
    return isOnLandingPage || isExplore ? `/pathway/${slug}` : `/pathways/${id}`;
  }
</script>

<div
  role="button"
  tabindex="0"
  on:click={() => {
    goto(getCourseUrl());
  }}
  on:keydown={(e) => {
    if (e.key === 'Enter') {
      goto(getCourseUrl());
    }
  }}
  class="border-gray hover:border-primary-600 group relative w-[480px] rounded-md border-2 p-3 text-black dark:border-neutral-600 dark:text-white"
>
  <div class="flex items-center justify-evenly gap-3">
    <div class="w-full max-w-[122px]">
      <ImageLoader
        src={bannerImage ? bannerImage : '/images/classroomio-course-img-template.jpg'}
        alt="Pathway Logo"
        class="relative h-[122px] w-full rounded-md object-cover dark:border dark:border-neutral-600"
      >
        <svelte:fragment slot="loading">
          <SkeletonPlaceholder style="width: 100%; height: 122px;" />
        </svelte:fragment>
        <svelte:fragment slot="error">{$t('courses.course_card.error_message')}</svelte:fragment>
      </ImageLoader>
    </div>

    <div class="w-4/6">
      <h3 class="mb-2 mt-0 text-lg font-medium">{title}</h3>
      <p class="line-clamp-2 text-sm text-gray-500">{description}</p>

      <div class="mt-2 flex items-center justify-between">
        <div>
          <p class="text-xs">
            {totalCourse}
            {#if totalCourse === 1}
              {$t('pathway.pathway_card.course')}
            {:else}
              {$t('pathway.pathway_card.courses')}
            {/if}
          </p>

          <!-- <p class="text-xs">
            {totalStudent}
            {#if totalStudent === 1}
              {$t('pathway.pathway_card.student')}
            {:else}
              {$t('pathway.pathway_card.students')}
            {/if}
          </p> -->
        </div>

        <Tag type={isPublished ? 'green' : 'cool-gray'}>
          {$t(`pathway.pathway_card.${isPublished ? 'published' : 'unpublished'}`)}
        </Tag>
      </div>
    </div>
  </div>
</div>
