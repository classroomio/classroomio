<script>
  import Draggable from 'carbon-icons-svelte/lib/Draggable.svelte';
  import { createEventDispatcher } from 'svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  import { t } from '$lib/utils/functions/translations';

  export let courses = [];

  const flipDurationMs = 300;
  const dispatch = createEventDispatcher();

  function updateOrder(items) {
    return items.map((item, index) => ({
      ...item,
      order: index + 1
    }));
  }

  function handleDndConsider(e) {
    courses = updateOrder(e.detail.items);
    dispatch('update', courses);
  }

  function handleDndFinalize(e) {
    courses = updateOrder(e.detail.items);
    dispatch('update', courses);
  }
</script>

<header class="rounded-md bg-[#F7F7F7] p-3 text-black dark:bg-transparent dark:text-white">
  {$t('pathway.components.dragAndDrop.header')}
</header>

<div
  class="mt-5 grid w-full grid-cols-12 items-center border-b px-10 py-4 text-black dark:text-white"
>
  <span class="col-span-4">
    <p class="pl-6 text-sm font-medium text-black dark:text-white">
      {$t('pathway.pages.course.body_title')}
    </p>
  </span>
  <span class="col-span-4 font-medium">{$t('pathway.pages.course.description')}</span>
  <span class="col-span-2 text-center font-medium">{$t('pathway.pages.course.lessons')}</span>
  <span class="col-span-2 text-center font-medium">{$t('pathway.pages.course.students')}</span>
</div>

<section
  use:dndzone={{
    items: courses,
    flipDurationMs: 300,
    dropTargetStyle: {
      border: '2px #1d4ed8 solid',
      'border-style': 'dashed'
    }
  }}
  on:consider={handleDndConsider}
  on:finalize={handleDndFinalize}
>
  {#each courses as course (course.id)}
    <div
      animate:flip={{ duration: flipDurationMs }}
      class="grid w-full grid-cols-12 items-center border-b border-[#0233BD] px-10 py-4 text-black dark:text-white"
    >
      <span class="col-span-4">
        <div class="flex items-center gap-3">
          <Draggable size={16} color="blue" />
          <p class="text-sm font-medium">
            {course.course.title}
          </p>
        </div>
      </span>
      <span class="col-span-4 text-sm">{course.course.description}</span>
      <span class="col-span-2 text-center text-sm">{course.course.lesson?.length || 0}</span>
      <span class="col-span-2 text-center text-sm"
        >{course.course.group_id?.groupmember.length || 0}</span
      >
    </div>
  {/each}
</section>
