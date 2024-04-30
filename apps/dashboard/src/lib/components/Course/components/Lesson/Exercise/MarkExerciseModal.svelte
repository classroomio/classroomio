<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import Select from '$lib/components/Form/Select.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Preview from './Preview.svelte';
  import { SELECTABLE_STATUS } from './constants';
  import { snackbar } from '$lib/components/Snackbar/store';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import { Dropdown, Tag } from 'carbon-components-svelte';
  import { useCompletion } from 'ai/svelte';
  import { QUESTION_TYPE } from '$lib/components/Question/constants';
  // import { isGradeWithAI } from './store';

  export let open = false;
  export let onClose = () => {};
  export let handleSave = () => {};

  // export let submissionId;
  export let data = {};
  export let updateStatus = () => {};

  let status = SELECTABLE_STATUS[0];
  let selectedId = status.id;
  let isGradeWithAI = false;
  let reasons = {};
  let isLoading = false;
  let hasCalled = false;
  let total = 0;
  let maxPoints = 0;

  function getMaxPoints(questions) {
    return (questions || []).reduce((acc, question) => acc + question.points, 0);
  }

  function calculateTotal(grades) {
    if (!grades) return 0;
    return Object.values(grades).reduce((acc, grade) => acc + parseInt(grade || 0), 0);
  }

  function handleStatusChange(event) {
    const newSelectedId = event.detail.selectedId;

    setStatus({
      status_id: newSelectedId
    });

    updateStatus({
      submissionId: data.id,
      prevStatusId: data.status_id,
      nextStatusId: status.id,
      total
    });

    snackbar.success(`snackbar.exercise.submission_updated '${status.text}'`);
  }

  function setStatus(data) {
    const statusBySelectedId = SELECTABLE_STATUS.find((status) => status.id === data.status_id);

    if (!statusBySelectedId) {
      return;
    }

    status = statusBySelectedId;

    if (data.status_id !== selectedId) {
      selectedId = data.status_id;
    }
  }

  const { input, handleSubmit, completion } = useCompletion({
    api: '/api/completion/gradingprompt',
    onFinish: async () => {
      console.log('response', $completion);
      isLoading = false;
      // try {
      //   const aiResponses = JSON.parse($completion);

      //   // if (!Array.isArray(aiResponses)) {
      //   //   console.error();
      //   //   return;
      //   // }
      //   console.log('response', aiResponses);
      // } catch (error) {
      //   console.error('Error', error);
      // } finally {
      //   isLoading = false;
      // }
    }
  });

  // const generateReasonAndPoints = async (id, question, point, type) => {
  //   // this function would receive the oncompletion
  //   try {
  //     // this would be an foreach loop
  //     const answer = data.questionAnswers.find((q) => q.question_id === id);

  //     if (type !== 'Paragraph') {
  //       reasons = {
  //         ...reasons,
  //         [id]: `This grade was allocated because he got the answer after ${answer.answers.length} tries`
  //       };
  //       return (data.questionAnswerByPoint[id] = point / answer.answers.length);
  //     } else if (!hasCalled) {
  //       $input = JSON.stringify({ question, answer: answer.open_answer, point });

  //       handleSubmit({ preventDefault: () => {} });
  //       hasCalled = true;
  //       data.questionAnswerByPoint[id] = Math.floor(Math.random() * point);

  //       reasons = {
  //         ...reasons,
  //         [id]: `This reason would be given by ai for question with id ${id}`
  //       };
  //       return data.questionAnswerByPoint[id];
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  function gradeWithAI() {
    isGradeWithAI = true;
    isLoading = true;
    const paragraphAiInput = data.questions
      .filter((q) => q.question_type_id === QUESTION_TYPE.TEXTAREA)
      .map((q) => {
        const answer = data.questionAnswers.find((qA) => qA.question_id === q.id); // { open_answer: '' }
        return {
          id: q.id,
          question: q.title,
          answer: answer?.open_answer,
          point: q.points
        };
      });
    console.log(paragraphAiInput);
    $input = JSON.stringify(paragraphAiInput);
    console.log('input value', $input);
    handleSubmit({ preventDefault: () => {} });
  }

  function getStatusColor(status) {
    // if (!status)
    return '';

    // switch (status.id) {
    //   case STATUS.SUBMITTED:
    //     return '';
    //   case STATUS.IN_PROGRESS:
    //     return 'text-white bg-primary-700';
    //   case STATUS.GRADED:
    //     return 'text-white bg-green-700';
    // }
  }

  $: total = calculateTotal(data.questionAnswerByPoint);
  $: maxPoints = getMaxPoints(data.questions);
  $: setStatus(data);
</script>

<Modal
  modalHeading={data.title}
  bind:open
  {onClose}
  width="w-4/5 h-[90%]"
  containerClass="flex items-start !max-h-full h-[85%] py-0 px-4"
  headerClass="py-2"
  labelClass="text-base font-semibold"
>
  {#if isLoading}
    <div class="absolute w-full h-full bg-black/60">
      <p>Grading...</p>
    </div>
  {/if}
  <div class="w-full h-full">
    <Preview
      questions={Array.isArray(data.questions)
        ? data.questions.sort((a, b) => a.order - b.order)
        : []}
      questionnaireMetaData={{
        answers: data.answers || {},
        isFinished: true
      }}
      bind:grades={data.questionAnswerByPoint}
      bind:reasons
      bind:isGradeWithAI
    />
  </div>
  <div class="ml-4 w-2/5 sticky top-0">
    <div class="border border-gray-300 rounded-md">
      <div
        class="hover:bg-gray-100 dark:bg-neutral-800 border-b border-t-0 border-l-0 border-r-0 border-gray-300 p-3"
      >
        <p class="dark:text-white font-bold text-base">
          Details:
          {#if data.isEarly}
            <span class="ml-2 text-sm badge rounded-sm px-2 bg-green-500 text-white"> early </span>
          {:else}
            <span class="ml-2 badge text-sm rounded-sm px-2 bg-red-500 text-white"> late </span>
          {/if}
        </p>
      </div>

      <div class="flex items-center space-x-4 text-sm px-3 py-2">
        <p class="dark:text-white text-sm text-gray-500 font-semibold">Total grade:</p>

        <Tag
          class="dark:text-white font-semibold text-black bg-gray-100 dark:bg-neutral-700 rounded-md w-fit"
        >
          {total}/{maxPoints}
        </Tag>
      </div>
      <!-- <div class="flex items-center text-sm p-3">
        <p class="dark:text-white font-bold w-1/2">Status</p>
        <div class="flex items-center">
          <p class="dark:text-white rounded-full w-5 h-5 bg-yellow-300 mr-2" />
          <p class="dark:text-white">Grading</p>
        </div>
      </div> -->
      <div class="flex items-center space-x-4 text-sm px-3 py-2">
        <p class="dark:text-white text-sm text-gray-500 font-semibold">Student:</p>
        {#if data.student}
          <div
            class="flex flex-row justify-center items-center bg-gray-100 dark:bg-neutral-700 rounded-md p-[6px]"
          >
            <img
              alt="Student avatar"
              class="flex rounded-full h-5 w-5"
              src={data.student.avatar_url}
            />
            <p class="dark:text-white font-semibold ml-2 text-sm line-clamp-1">
              {data.student.fullname}
            </p>
          </div>
        {/if}
      </div>
      <!-- <div class="flex items-center space-x-4 text-sm px-3 py-2">
        <p class="dark:text-white text-sm text-gray-500 font-semibold">Assesment Type:</p>
        <Tag
          class="dark:text-white font-semibold bg-gray-100 dark:bg-neutral-700 rounded-md text-black w-fit"
          >Paragraph</Tag
        >
      </div> -->

      <div class="flex flex-col items-start text-sm px-3 py-2">
        <p class="dark:text-white text-gray-500 font-semibold">Status:</p>
        <Dropdown
          bind:selectedId
          items={SELECTABLE_STATUS}
          class="w-full"
          on:select={handleStatusChange}
        />
      </div>

      <div class="flex flex-col items-start text-sm px-3 py-2">
        <p class="dark:text-white text-gray-500 font-semibold">Add comment:</p>
        <TextArea
          bgColor="bg-gray-100 dark:bg-neutral-700"
          className="font-semibold"
          placeholder="write your comments"
        />
      </div>

      <div class="flex flex-col w-full space-y-3 px-3 py-2">
        <PrimaryButton
          onClick={gradeWithAI}
          variant={VARIANTS.OUTLINED}
          className="space-x-3 py-3 px-8 w-full "
        >
          <img src="/ai.svg" alt="ai" />
          <p class="font-semibold text-sm">Grade with AI</p>
        </PrimaryButton>
        <PrimaryButton
          onClick={() => {
            handleSave(data);
            onClose();
          }}
          label="Submit Grades"
          variant={VARIANTS.CONTAINED}
          className="py-3 px-8 w-full"
        />
      </div>
      <!-- <div class="flex items-center text-sm p-3">
        <p class="dark:text-white font-bold w-1/2">Teacher</p>
        <p class="dark:text-white">rotimi-best</p>
      </div> -->
    </div>
  </div>
</Modal>

<style>
  .badge {
    width: fit-content;
  }
</style>
