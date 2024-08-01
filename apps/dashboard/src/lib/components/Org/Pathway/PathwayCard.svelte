<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { ImageLoader, SkeletonPlaceholder } from 'carbon-components-svelte';

  export let id: string = '';
  export let title: string = '';
  export let description: string = '';
  export let banner_url: string = '';
  export let isPublished: boolean = false;
  export let totalCourse: number = 0;

  const getPathwayUrl = () => {
    return `/pathways/${id}`;
  };
</script>

<a
  rel="prefetch"
  href={getPathwayUrl()}
  class="text-black flex items-center p-4 gap-4 border border-gray dark:border-neutral-600 rounded w-full max-w-[520px] relative hover:scale-95 transition-all ease-in-out hover:no-underline"
>
  <ImageLoader
    src={banner_url ? banner_url : '/images/classroomio-course-img-template.jpg'}
    alt="Course Logo"
    class="h-[150px] !w-[30%]  dark:border dark:border-neutral-600 object-cover relative"
  >
    <svelte:fragment slot="loading">
      <SkeletonPlaceholder style="width: 100%; height: 200px;" />
    </svelte:fragment>
    <svelte:fragment slot="error">{$t('courses.course_card.error_message')}</svelte:fragment>
  </ImageLoader>
  <div class="space-y-2 w-full">
    <p class="text-xl font-medium">{title}</p>
    <p class="text-sm line-clamp-3">{description}</p>

    <span class="flex justify-between items-center">
      <p class="text-xs">{totalCourse} {$t('pathway.pathway_card.courses')}</p>
      {#if isPublished}
        <p class="text-xs">{$t('pathway.pathway_card.published')}</p>
      {:else}
        <p class="text-xs">{$t('pathway.pathway_card.unpublished')}</p>
      {/if}
    </span>
  </div>
</a>
