<script lang="ts">
  import { goto } from '$app/navigation';
  import { t } from '$lib/utils/functions/translations';
  import { ImageLoader, SkeletonPlaceholder, Tag } from 'carbon-components-svelte';

  export let id: string = '';
  export let title: string = '';
  export let description: string = '';
  export let banner_url: string = '';
  export let isPublished: boolean = false;
  export let totalCourse: number = 0;
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
  class="border-gray relative flex w-full max-w-[520px] items-start gap-4 rounded border-2 p-4 text-black transition-all ease-in-out hover:scale-95 hover:no-underline dark:border-neutral-600"
>
  <ImageLoader
    src={banner_url ? banner_url : '/images/classroomio-course-img-template.jpg'}
    alt="Course Logo"
    class="relative h-[150px]  !w-[30%] object-cover dark:border dark:border-neutral-600"
  >
    <svelte:fragment slot="loading">
      <SkeletonPlaceholder style="width: 100%; height: 200px;" />
    </svelte:fragment>
    <svelte:fragment slot="error">{$t('courses.course_card.error_message')}</svelte:fragment>
  </ImageLoader>
  <div class="flex h-full w-full flex-col justify-between text-black dark:text-white">
    <p class="text-2xl font-medium">{title}</p>
    <p class="line-clamp-3 text-base">{description}</p>

    <span class="flex items-center justify-between text-xs">
      <Tag type="blue">
        {totalCourse}
        {$t('pathway.pathway_card.courses')}
      </Tag>
      {#if isPublished}
        <Tag type="blue">
          {$t('pathway.pathway_card.published')}
        </Tag>
      {:else}
        <Tag type="blue">
          {$t('pathway.pathway_card.unpublished')}
        </Tag>
      {/if}
    </span>
  </div>
</div>
