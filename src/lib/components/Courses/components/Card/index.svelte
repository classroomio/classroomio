<script lang="ts">
  import { Tag, ImageLoader, SkeletonPlaceholder } from 'carbon-components-svelte';
  // import { ROLE } from '$lib/utils/constants/roles';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';

  export let bannerImage: string | undefined;
  export let id = '';
  export let slug = '';
  export let title = '';
  export let description = '';
  // export let role_id = ROLE.STUDENT;
  export let isPublished = false;
  export let cost = 0;
  export let totalLessons = 0;
  export let currency = 'NGN';
  export let isOnLandingPage = false;
  // export let onDelete = (id: string) => {};

  let formatter = getCurrencyFormatter(currency);

  // function getOptions() {
  //   return [
  //     {
  //       label: 'Make a copy',
  //       // Show this option only if user has admin control over this course.
  //       show: () => role_id === ROLE.ADMIN || role_id === ROLE.TUTOR,
  //       onClick() {
  //         // IIFI of copyCourseModal
  //         (() => {
  //           $copyCourseModal.id = id;
  //           $copyCourseModal.open = true;
  //           $copyCourseModal.title = `Copy of ${title}`;
  //         })();
  //       }
  //     }
  //     // {
  //     //   label: 'Delete',
  //     //   show: () => role_id === ROLE.TUTOR,
  //     //   onClick() {
  //     //     (async () => {
  //     //       await deleteCourse(id);
  //     //       onDelete(id);
  //     //       console.log('Deleting');
  //     //     })();
  //     //   }
  //     // }
  //   ].filter((option) => option.show());
  // }
</script>

<a
  rel="prefetch"
  href={isOnLandingPage ? `/course/${slug}` : `/courses/${id}`}
  class=" text-black w-fit"
>
  <div
    class="border border-gray w-full max-w-[350px] relative hover:shadow-lg transition-all ease-in-out"
  >
    <div class="p-4">
      <div class=" mb-5">
        <ImageLoader
          src={bannerImage ?? '/images/classroomio-course-img-template.jpg'}
          alt="Course Logo"
          class="h-2/5 w-full rounded"
        >
          <svelte:fragment slot="loading">
            <SkeletonPlaceholder style="width: 100%; height: 10rem;" />
          </svelte:fragment>
          <svelte:fragment slot="error">An error occurred.</svelte:fragment>
        </ImageLoader>
      </div>

      <h3 class="text-xl dark:text-white title">{title}</h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-300 description">
        {description}
      </p>
    </div>

    <div class="px-4 border border-gray border-b-0 border-l-0 border-r-0 footer">
      <p class="text-xs pt-2 pl-2 dark:text-white">{totalLessons} lessons</p>
      <p class="text-xs py-2">
        {#if isOnLandingPage}
          <span class="px-2">{!cost ? 'Free' : formatter.format(cost)}</span>
        {:else}
          <Tag type={isPublished ? 'green' : 'cool-gray'}>
            {#if isPublished}
              Published
            {:else}
              Unpublished
            {/if}
          </Tag>
        {/if}
      </p>
    </div>
  </div>
</a>

<style>
  a,
  a:hover {
    text-decoration: none;
  }
  .title,
  .description {
    height: 40px;
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
