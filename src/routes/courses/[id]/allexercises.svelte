<script context="module">
  export async function preload({ params }) {
    let [courseId] = params.id;
    const res = await this.fetch(`api/course?id=${courseId}`);
    const data = await res.json();

    if (res.status === 200) {
      return { courseId, courseData: data };
    } else {
      this.error(res.status, data.message);
    }
  }
</script>

<script>
  import { flip } from 'svelte/animate';
  import { dndzone } from 'svelte-dnd-action';
  import PageNav from '../../../components/PageNav/index.svelte';
  import Chip from '../../../components/Chip/index.svelte';
  import PageBody from '../../../components/PageBody/index.svelte';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  const flipDurationMs = 300;

  export let courseData = {};

  let sections = [
    {
      id: 1,
      title: 'Submitted',
      value: 5,
      items: [
        { id: 41, name: 'item41' },
        { id: 42, name: 'item42' },
        { id: 43, name: 'item43' },
        { id: 44, name: 'item44' },
        { id: 45, name: 'item45' },
        { id: 46, name: 'item46' },
        { id: 47, name: 'item47' },
        { id: 48, name: 'item48' },
        { id: 49, name: 'item49' },
      ],
    },
    {
      id: 2,
      title: 'In Progress',
      value: 0,
      items: [],
    },
    {
      id: 3,
      title: 'Graded',
      value: 10,
      items: [],
    },
  ];

  function handleItemFinalize(columnIdx, newItems) {
    sections[columnIdx].items = newItems;
    // onFinalUpdate([...sections]);
  }

  function handleDndConsiderCards(columnIdx) {
    return (e) => {
      console.warn('got consider');
      sections[columnIdx].items = e.detail.items;
    };
  }

  function handleDndFinalizeCards(columnIdx) {
    return (e) => handleItemFinalize(columnIdx, e.detail.items);
  }
</script>

<CourseContainer {courseData}>
  <PageNav title="All Exercises" />

  <PageBody width="w-11/12 overflow-x-auto overflow-y-hidden h-3/4">
    <div class="flex items-center justify-between h-full w-full">
      {#each sections as { id, title, items }, idx (id)}
        <div
          class="section rounded-md bg-gray-100 border border-gray-50 p-3 h-full mr-3 overflow-hidden"
          animate:flip={{ duration: flipDurationMs }}
        >
          <div class="flex items-center mb-2">
            <Chip value={items.length} />
            <p class="ml-2 font-bold">{title}</p>
          </div>
          <div
            class="content pr-2 overflow-y-auto mb-3"
            use:dndzone={{
              items,
              flipDurationMs,
              dropTargetStyle: { outline: 'blue' },
            }}
            on:consider={handleDndConsiderCards(idx)}
            on:finalize={handleDndFinalizeCards(idx)}
          >
            {#each items as item (item.id)}
              <div
                class="border border-grey-700 w-full my-2 mx-0 rounded-md bg-white py-2 px-3"
                animate:flip={{ duration: flipDurationMs }}
              >
                <a class="text-blue-700 text-md font-bold" href="courses/1"
                  >{item.name}</a
                >
                <p class="text-grey text-sm mb-2">#2 created by sergey-semko</p>

                <a
                  class="flex items-center no-underline hover:underline text-black"
                  href="/"
                >
                  <img
                    alt="Placeholder"
                    class="block rounded-full"
                    width="24"
                    height="20"
                    src="https://picsum.photos/32/32/?random"
                  />
                  <p class="ml-2 text-sm">rotimi-best</p>
                </a>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </PageBody>
</CourseContainer>

<style>
  .section {
    max-width: 355px;
    min-width: 355px;
  }

  .content {
    height: 90%;
  }
</style>
