<script lang="ts">
  import Dropdown from '../../../Dropdown/index.svelte';
  import { copyCourseModal } from '../../store';
  import { ROLE } from '../../../../utils/constants/roles';
  import getCurrencyFormatter from '../../../../utils/functions/getCurrencyFormatter';
  import OverflowMenuHorizontal24 from 'carbon-icons-svelte/lib/OverflowMenuHorizontal24';

  export let bannerImage: string | undefined;
  export let id = '';
  export let title = '';
  export let description = '';
  export let role_id = ROLE.STUDENT;
  export let isPublished = false;
  export let cost = 0;
  export let totalLessons = 0;
  export let currency = 'NGN';

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
        },
      },
      // {
      //   label: 'Delete',
      //   onClick() {
      //     console.log('Deleting');
      //   },
      // },
    ].filter((option) => option.show());
  }
</script>

<a rel="prefetch" href="/courses/{id}" class=" text-black ">
  <div
    class="root w-72 border bg-white mb-4 rounded-md transition ease-in-out relative"
  >
    <Dropdown
      options={getOptions()}
      classNames="absolute top-4 right-4"
      isIcon={true}
    >
      <div class="p-1 rounded-full bg-white">
        <OverflowMenuHorizontal24 class="carbon-icon" />
      </div>
    </Dropdown>
    <img
      class="h-2/5 w-full rounded-tl rounded-tr"
      src={bannerImage ?? '/images/classroomio-course-img-template.jpg'}
      alt="Course Logo"
    />
    <div class="p-3 pb-0">
      <h4 class="title text-md font-bold">
        {title}
      </h4>
      <p
        class="description text-left text-sm font-small flex flex-col text-gray-500 my-3"
        title={description}
      >
        {description}
      </p>
      <div class="flex justify-between">
        <p>{totalLessons} lessons</p>
        <div class="rounded bg-{isPublished ? 'green' : 'red'}-200 py-1 px-2">
          {#if isPublished}
            Published
          {:else}
            Unpublished
          {/if}
        </div>
      </div>
      <p class="text-gray-500 text-xs mt-1">
        {!cost ? 'free' : formatter.format(cost)}
      </p>
    </div>
  </div>
</a>

<style>
  .root {
    min-height: 370px;
  }

  a {
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
