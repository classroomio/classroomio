<script>
  import { onMount } from 'svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import Select from '$lib/components/Form/Select.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Preview from './Preview.svelte';
  import { SELECTABLE_STATUS } from './constants';
  import { snackbar } from '$lib/components/Snackbar/store';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import { Tag } from 'carbon-components-svelte';

  export let open = false;
  export let onClose = () => {};
  export let handleSave = () => {};

  // export let submissionId;
  export let data = {};
  export let updateStatus = () => {};

  let status = SELECTABLE_STATUS[0];

  let total = 0;
  let maxPoints = 0;

  function getMaxPoints(questions) {
    return (questions || []).reduce((acc, question) => acc + question.points, 0);
  }

  function calculateTotal(grades) {
    if (!grades) return 0;
    return Object.values(grades).reduce((acc, grade) => acc + parseInt(grade || 0), 0);
  }

  function handleStatusChange() {
    updateStatus({
      submissionId: data.id,
      prevStatusId: data.status_id,
      nextStatusId: status.value,
      total
    });

    snackbar.success(`snackbar.exercise.submission_updated '${status.label}'`);
  }

  function setStatus(data) {
    status = SELECTABLE_STATUS.find((status) => status.value === data.status_id);
  }

  function getStatusColor(status) {
    // if (!status)
    return '';

    // switch (status.value) {
    //   case STATUS.SUBMITTED:
    //     return '';
    //   case STATUS.IN_PROGRESS:
    //     return 'text-white bg-primary-700';
    //   case STATUS.GRADED:
    //     return 'text-white bg-green-700';
    // }
  }

  onMount(() => {
    console.log('mounting');
  });

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

        <Tag class="dark:text-white font-semibold text-black bg-gray-300 rounded-md w-fit">
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
          <div class="flex flex-row justify-center items-center bg-gray-300 rounded-md p-[6px]">
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
      <div class="flex items-center space-x-4 text-sm px-3 py-2">
        <p class="dark:text-white text-sm text-gray-500 font-semibold">Assesment Type:</p>
        <Tag class="dark:text-white font-semibold bg-gray-300 rounded-md text-black w-fit"
          >Paragraph</Tag
        >
      </div>

      <div class="flex flex-col items-start text-sm px-3 py-2">
        <p class="dark:text-white text-gray-500 font-semibold">Status:</p>
        <Select
          bind:value={status}
          options={SELECTABLE_STATUS}
          selectClassName="bg-gray-300 w-full border-none text-sm"
          onChange={handleStatusChange}
          className="w-full "
        />
      </div>

      <div class="flex flex-col items-start text-sm px-3 py-2">
        <p class="dark:text-white text-gray-500 font-semibold">Add comment:</p>
        <TextArea
          bgColor="bg-gray-300"
          className="font-semibold"
          placeholder="write your comments"
        />
      </div>

      <div class="flex flex-col w-full space-y-3 px-3 py-2">
        <PrimaryButton
          onClick={() => {
            handleSave(data);
            onClose();
          }}
          variant={VARIANTS.OUTLINED}
          className="space-x-3 py-3 px-8 w-full "
        >
          <img src="/ai.svg" alt="ai" />
          <p class="font-semibold text-primary-700 text-sm">Grade with AI</p>
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
