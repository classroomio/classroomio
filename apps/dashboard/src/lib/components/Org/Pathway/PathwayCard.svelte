<script lang="ts">
  import { goto } from '$app/navigation';
  import { t } from '$lib/utils/functions/translations';
  import { ImageLoader, SkeletonPlaceholder, Tag } from 'carbon-components-svelte';

  export let id: string = '';
  export let title: string = '';
  export let description: string = '';
  export let bannerImage: string = '';
  export let isPublished: boolean = false;
  export let totalCourse: number = 0;
  export let totalStudent: number = 0;
</script>

<div
  role="button"
  tabindex="0"
  on:click={() => {
    goto(`/pathways/${id}`);
  }}
  on:keydown={(e) => {
    if (e.key === 'Enter') {
      goto(`/pathways/${id}`);
    }
  }}
  class="border-gray group relative w-full max-w-[320px] rounded border text-black dark:border-neutral-600 dark:text-white"
>
  <div class="p-4">
    <ImageLoader
      src={bannerImage ? bannerImage : '/images/classroomio-course-img-template.jpg'}
      alt="Pathway Logo"
      class="relative h-[200px] w-full object-cover dark:border dark:border-neutral-600"
    >
      <svelte:fragment slot="loading">
        <SkeletonPlaceholder style="width: 100%; height: 200px;" />
      </svelte:fragment>
      <svelte:fragment slot="error">{$t('courses.course_card.error_message')}</svelte:fragment>
    </ImageLoader>

    <p class="mt-3 text-2xl font-medium">{title}</p>
    <p class="mt-2 line-clamp-2 text-base">{description}</p>
  </div>

  <div class="border-gray mt-5 w-full border-t-2 p-4 dark:border-neutral-600">
    <div class="mb-3 flex items-center justify-between">
      <p class="text-xs">
        {totalCourse}
        {#if totalCourse === 1}
          {$t('pathway.pathway_card.course')}
        {:else}
          {$t('pathway.pathway_card.courses')}
        {/if}
      </p>

      <p class="text-xs">
        {totalStudent}
        {#if totalStudent === 1}
          {$t('pathway.pathway_card.student')}
        {:else}
          {$t('pathway.pathway_card.students')}
        {/if}
      </p>
    </div>

    <div>
      {#if isPublished}
        <Tag type="blue">
          {$t('pathway.pathway_card.published')}
        </Tag>
      {:else}
        <Tag type="blue">
          {$t('pathway.pathway_card.unpublished')}
        </Tag>
      {/if}
    </div>
  </div>
</div>
