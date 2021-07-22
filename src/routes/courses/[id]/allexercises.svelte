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
  import { stores, goto } from '@sapper/app';
  import PageNav from '../../../components/PageNav/index.svelte';
  import MarkExerciseModal from '../../../components/Course/components/Lesson/Exercise/MarkExerciseModal.svelte';
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
        {
          id: 41,
          exerciseTitle: 'Practice props in React.js',
          student: {
            avatar: 'https://picsum.photos/32/32/?random',
            name: 'Brad Traversy',
          },
          tutor: {
            name: 'sergey-semko',
            id: 1,
          },
          lesson: {
            number: 1,
          },
        },
        {
          id: 42,
          exerciseTitle: 'Practice props in React.js',
          student: {
            avatar: 'https://picsum.photos/32/32/?random',
            name: 'James Kola',
          },
          tutor: {
            name: 'sergey-semko',
            id: 1,
          },
          lesson: {
            number: 1,
          },
        },
        {
          id: 43,
          exerciseTitle: 'Practice props in React.js',
          student: {
            avatar: 'https://picsum.photos/32/32/?random',
            name: 'linus-torvalds',
          },
          tutor: {
            name: 'sergey-semko',
            id: 1,
          },
          lesson: {
            number: 1,
          },
        },
        {
          id: 44,
          exerciseTitle: 'Practice props in React.js',
          student: {
            avatar: 'https://picsum.photos/32/32/?random',
            name: 'rotimi-best',
          },
          tutor: {
            name: 'sergey-semko',
            id: 1,
          },
          lesson: {
            number: 1,
          },
        },
        {
          id: 45,
          exerciseTitle: 'Home task: Class and Functional component',
          student: {
            avatar: 'https://picsum.photos/32/32/?random',
            name: 'james-two',
          },
          tutor: {
            name: 'sergey-semko',
            id: 1,
          },
          lesson: {
            number: 2,
          },
        },
        {
          id: 46,
          exerciseTitle: 'Home task: Class and Functional component',
          student: {
            avatar: 'https://picsum.photos/32/32/?random',
            name: 'brarack-obama',
          },
          tutor: {
            name: 'sergey-semko',
            id: 1,
          },
          lesson: {
            number: 2,
          },
        },
        {
          id: 47,
          exerciseTitle: 'Lesson task: Class and Functional component',
          student: {
            avatar: 'https://picsum.photos/32/32/?random',
            name: 'bill-gates',
          },
          tutor: {
            name: 'sergey-semko',
            id: 1,
          },
          lesson: {
            number: 3,
          },
        },
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
  let openExercise = false;

  const { page } = stores();

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

  function handleModalClose() {
    console.log('closing', page.path);

    goto($page.path);
  }

  $: openExercise = !!$page.query.submissionId;
</script>

<MarkExerciseModal bind:open={openExercise} onClose={handleModalClose} />

<CourseContainer {courseData}>
  <PageNav title="All Exercises" />

  <PageBody width="w-11/12 overflow-x-auto overflow-y-hidden">
    <div class="flex items-center justify-between w-full">
      {#each sections as { id, title, items }, idx (id)}
        <div
          class="section rounded-md bg-gray-100 border border-gray-50 p-3 h-80 mr-3 overflow-hidden"
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
                <a
                  class="flex items-center no-underline hover:underline text-black mb-2"
                  href="{$page.path}?submissionId={item.id}"
                >
                  <img
                    alt="Placeholder"
                    class="block rounded-full"
                    width="24"
                    height="20"
                    src={item.student.avatar}
                  />
                  <p class="ml-2 text-sm">{item.student.name}</p>
                </a>
                <a
                  class="text-blue-700 text-md font-bold"
                  href="{$page.path}?submissionId={item.id}"
                  >{item.exerciseTitle}</a
                >
                <p class="text-grey text-sm">
                  #{item.lesson.number} created by {item.tutor.name}
                </p>
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
    height: 80vh;
  }

  .content {
    height: 95%;
  }
</style>
