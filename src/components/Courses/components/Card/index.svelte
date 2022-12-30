<script>
  import Dropdown from '../../../Dropdown/index.svelte';
  import { copyCourseModal } from '../../store';
  import { ROLE } from '../../../../utils/constants/roles';
  import OverflowMenuVertical24 from 'carbon-icons-svelte/lib/OverflowMenuVertical24';
  export let logo = '';
  export let id = '';
  export let title = '';
  export let description = '';
  export let role_id = ROLE.STUDENT;

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

<div
  class="root w-72 border bg-white px-2 py-3 mr-4 mb-4 rounded-md hover:shadow-2xl transition ease-in-out relative"
>
  <Dropdown
    options={getOptions()}
    classNames="absolute top-4 right-0"
    isIcon={true}
  >
    <OverflowMenuVertical24 class="carbon-icon" />
  </Dropdown>
  <img
    class="w-24 h-24 rounded-full border mx-auto"
    src={logo}
    alt="Course Logo"
  />
  <a rel="prefetch" href="/courses/{id}" class="pt-3 text-center space-y-4">
    <h3 class="text-lg font-semibold hover:underline">
      {title}
    </h3>
    <div
      class="description text-left font-small flex flex-col text-gray-500"
      title={description}
    >
      {description}
    </div>
  </a>
</div>

<style>
  .root {
    min-height: 300px;
  }

  a {
    text-decoration: none;
  }
  .description {
    line-height: 20px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -moz-box-orient: vertical;
    -ms-box-orient: vertical;
    box-orient: vertical;
    -webkit-line-clamp: 5;
    -moz-line-clamp: 5;
    -ms-line-clamp: 5;
    line-clamp: 5;
    overflow: hidden;
  }
</style>
