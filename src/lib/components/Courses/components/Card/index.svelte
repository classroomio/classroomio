<script lang="ts">
  import Dropdown from '$lib/components/Dropdown/index.svelte';
  import { copyCourseModal } from '$lib/components/Courses/store';
  import { ROLE } from '$lib/utils/constants/roles';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import OverflowMenuHorizontalIcon from 'carbon-icons-svelte/lib/OverflowMenuHorizontal.svelte';
  import ArrowRight from 'carbon-icons-svelte/lib/ArrowRight.svelte';

  export let bannerImage: string | undefined;
  export let id = '';
  export let slug = '';
  export let title = '';
  export let description = '';
  export let role_id = ROLE.STUDENT;
  export let isPublished = false;
  export let cost = 0;
  export let totalLessons = 0;
  export let currency = 'NGN';
  export let isOnLandingPage = false;

  let formatter = getCurrencyFormatter(currency);

  function getOptions() {
    return [
      {
        label: 'Make a copy',
        // Show this option only if user has admin control over this course.
        show: () => role_id === ROLE.ADMIN || role_id === ROLE.TUTOR,
        onClick() {
          // IIFI of copyCourseModal
          (() => {
            $copyCourseModal.id = id;
            $copyCourseModal.open = true;
            $copyCourseModal.title = `Copy of ${title}`;
          })();
        }
      }
      // {
      //   label: 'Delete',
      //   onClick() {
      //     console.log('Deleting');
      //   },
      // },
    ].filter((option) => option.show());
  }
</script>

<a rel="prefetch" href={isOnLandingPage ? `/course/${slug}` : `/courses/${id}`} class=" text-black">
  <div
    class="root w-80 border bg-gray-100 dark:bg-gray-700 sm:mr-4 mb-4 rounded-md hover:shadow-2xl transition ease-in-out relative"
  >
    {#if !isOnLandingPage}
      <Dropdown options={getOptions()} classNames="absolute top-4 right-4" isIcon={true}>
        <div class="p-1 rounded-full bg-white dark:bg-gray-600">
          <OverflowMenuHorizontalIcon size={20} class="carbon-icon dark:text-white" />
        </div>
      </Dropdown>
    {/if}
    <img
      class="h-2/5 w-full rounded-tl rounded-tr"
      src={bannerImage ?? '/images/classroomio-course-img-template.jpg'}
      alt="Course Logo"
    />
    <div class="px-3 py-5">
      <h4 class="dark:text-white title text-md font-bold">
        {title}
      </h4>
      <p
        class="description text-left text-sm font-small flex flex-col text-gray-500 dark:text-white my-3"
        title={description}
      >
        {description}
      </p>
      <div class="flex justify-between">
        <p class="dark:text-white">{totalLessons} lessons</p>

        {#if isOnLandingPage}
          <ArrowRight size={24} class="carbon-class" />
        {:else}
          <div class="rounded dark:text-white bg-{isPublished ? 'green' : 'red'}-200 py-1 px-2">
            {#if isPublished}
              Published
            {:else}
              Unpublished
            {/if}
          </div>
        {/if}
      </div>
      <p class="dark:text-white text-gray-500 text-xs mt-1">
        {!cost ? 'free' : formatter.format(cost)}
      </p>
    </div>
  </div>
</a>

<style>
  .root {
    min-height: 370px;
  }

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
