<script context="module">
  import { fetchCourse } from '../../../utils/services/courses';

  export async function preload({ params }, session) {
    if (process.browser) {
      return {};
    }

    const {
      data,
      // error
    } = await fetchCourse(params.id, session);

    return { courseData: data };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { dndzone } from 'svelte-dnd-action';
  import { stores, goto } from '@sapper/app';
  import PageNav from '../../../components/PageNav/index.svelte';
  import MarkExerciseModal from '../../../components/Course/components/Lesson/Exercise/MarkExerciseModal.svelte';
  import Chip from '../../../components/Chip/index.svelte';
  import PageBody from '../../../components/PageBody/index.svelte';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  import { setCourseData, course } from '../../../components/Course/store';
  import { fetchSubmissions } from '../../../utils/services/submissions';
  const flipDurationMs = 300;

  export let courseData = {};

  let sections = [
    {
      id: 1,
      title: 'Submitted',
      value: 0,
      items: [],
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
  let submissionIdData = {};
  let submissionId;

  let openExercise = false;

  const { page } = stores();

  function handleItemFinalize(columnIdx, newItems) {
    console.log('handleItemFinalize columnIdx=>', columnIdx, newItems);
    sections[columnIdx].items = newItems;
    // onFinalUpdate([...sections]);
  }

  function handleDndConsiderCards(columnIdx) {
    return (e) => {
      console.warn(
        'handleDndConsiderCards columnIdx',
        columnIdx,
        e.detail.items
      );
      sections[columnIdx].items = e.detail.items;
    };
  }

  function handleDndFinalizeCards(columnIdx) {
    return (e) => handleItemFinalize(columnIdx, e.detail.items);
  }

  function handleModalClose() {
    goto($page.path);
  }

  function formatAnswers(data) {
    const answers = {};
    const questionByIdAndName = {};

    for (const question of data.questions) {
      questionByIdAndName[question.id] = question.name;
    }

    for (const answer of data.answers) {
      const questionName = questionByIdAndName[answer.question_id];

      answers[questionName] =
        Array.isArray(answer.answers) && answer.answers.length
          ? answer.answers
          : answer.open_answer;
    }

    return answers;
  }

  onMount(async () => {
    setCourseData(courseData);
    console.log(`courseData`, courseData);
    console.log(`$course`, $course);
    const { data: submissions } = await fetchSubmissions(
      courseData.id || $course.id
    );
    const sectionById = {};

    for (const submission of submissions) {
      const { id, exercise, course, answers, groupmember, status_id } =
        submission;

      const submissionItem = {
        id,
        exercise: {
          id: exercise.id,
          title: exercise.title,
        },
        answers,
        student: groupmember && groupmember.profile ? groupmember.profile : {},
        lesson: {
          id: exercise.lesson.id,
          title: exercise.lesson.title,
        },
      };

      submissionIdData[id] = {
        questions: exercise.questions,
        answers: formatAnswers({ questions: exercise.questions, answers }),
      };

      if (Array.isArray(sectionById[status_id])) {
        sectionById[status_id].push(submissionItem);
      } else {
        sectionById[status_id] = [submissionItem];
      }
    }

    sections = sections.map((section, index) => ({
      ...section,
      value: Array.isArray(sectionById[index + 1])
        ? sectionById[index + 1].length
        : 0,
      items: Array.isArray(sectionById[index + 1])
        ? sectionById[index + 1]
        : [],
    }));

    console.log(`submissionIdData`, submissionIdData);
  });

  $: {
    submissionId = $page.query.submissionId;
    openExercise = !!submissionId;
  }
</script>

<MarkExerciseModal
  bind:open={openExercise}
  onClose={handleModalClose}
  data={submissionIdData[submissionId] || {}}
  {submissionId}
/>

<CourseContainer>
  <PageNav title="Submitted Exercises" />

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
                  href="{$page.path}?submissionId={item.student.id}"
                >
                  <img
                    alt="Placeholder"
                    class="block rounded-full"
                    width="24"
                    height="20"
                    src={item.student.avatar_url}
                  />
                  <p class="ml-2 text-sm">{item.student.username}</p>
                </a>
                <a
                  class="text-blue-700 text-md font-bold"
                  href="{$page.path}?submissionId={item.id}"
                >
                  {item.exercise.title}
                </a>
                <a
                  class="flex items-center no-underline hover:underline text-black my-2"
                  href="{$page.path.replace('submissions', 'lessons')}/{item
                    .lesson.id}/exercises"
                >
                  <p class="text-grey text-sm">
                    #{item.lesson.title}
                    {`${item.tutor ? 'created by' + item.tutor.name : ''}`}
                  </p>
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
    height: 80vh;
  }

  .content {
    height: 95%;
  }
</style>
