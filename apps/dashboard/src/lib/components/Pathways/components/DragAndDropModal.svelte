<script>
  import { flip } from 'svelte/animate';
  import { dndzone } from 'svelte-dnd-action';
  import { createEventDispatcher } from 'svelte';
  import Draggable from 'carbon-icons-svelte/lib/Draggable.svelte';
  import { t } from '$lib/utils/functions/translations';

  export let pathwayCourses = [];
  const flipDurationMs = 300;
  const dispatch = createEventDispatcher();

  function updateOrder(items) {
    return items.map((item, index) => ({
      ...item,
      order: index + 1
    }));
  }

  function handleDndConsider(e) {
    pathwayCourses = updateOrder(e.detail.items);
    dispatch('update', pathwayCourses);
  }

  function handleDndFinalize(e) {
    pathwayCourses = updateOrder(e.detail.items);
    dispatch('update', pathwayCourses);
  }
</script>

<header class="bg-[#F7F7F7] p-3 rounded-md">
  {$t('pathway.components.dragAndDrop.header')}
</header>

<div class="w-full mt-5 grid grid-cols-12 items-center py-4 border-b px-10">
  <span class="col-span-4">
    <p class="font-medium text-sm text-black pl-6 dark:text-white">
      {$t('pathway.pages.course.body_title')}
    </p>
  </span>
  <span class="col-span-4 font-medium">{$t('pathway.pages.course.description')}</span>
  <span class="text-center font-medium col-span-2">{$t('pathway.pages.course.lessons')}</span>
  <span class="text-center font-medium col-span-2">{$t('pathway.pages.course.students')}</span>
</div>

<section
  use:dndzone={{
    items: pathwayCourses,
    flipDurationMs: 300,
    dropTargetStyle: {
      border: '2px #1d4ed8 solid',
      'border-style': 'dashed'
    }
  }}
  on:consider={handleDndConsider}
  on:finalize={handleDndFinalize}
>
  {#each pathwayCourses as course (course.id)}
    <div
      animate:flip={{ duration: flipDurationMs }}
      class="w-full grid grid-cols-12 items-center py-4 border-b border-[#0233BD] px-10"
    >
      <span class="col-span-4">
        <div class="flex items-center gap-3">
          <Draggable size={16} color="blue" />
          <p class="font-medium text-sm text-black dark:text-white">
            {course.course.title}
          </p>
        </div>
      </span>
      <span class="col-span-4 text-sm">{course.course.description}</span>
      <span class="text-center text-sm col-span-2">{course.course.lesson?.length || 0}</span>
      <span class="text-center text-sm col-span-2"
        >{course.course.group_id?.groupmember.length || 0}</span
      >
    </div>
  {/each}
</section>
