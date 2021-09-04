<script>
  import { onMount } from 'svelte';
  import Modal from '../../../../Modal/index.svelte';
  import Select from '../../../../Form/Select.svelte';
  import PrimaryButton from '../../../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../../../PrimaryButton/constants';
  import Preview from './Preview.svelte';
  import { SELECTABLE_STATUS } from './constants';
  import { snackbarStore } from '../../../../Snackbar/store';

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
    return (questions || []).reduce(
      (acc, question) => acc + question.points,
      0
    );
  }

  function calculateTotal(grades) {
    if (!grades) return 0;
    return Object.values(grades).reduce(
      (acc, grade) => acc + parseInt(grade),
      0
    );
  }

  function handleStatusChange() {
    updateStatus({
      submissionId: data.id,
      prevStatusId: data.status_id,
      nextStatusId: status.value,
      total,
    });

    $snackbarStore.open = true;
    $snackbarStore.message = `Submission updated to '${status.label}'`;
  }

  function setStatus(data) {
    status = SELECTABLE_STATUS.find(
      (status) => status.value === data.status_id
    );
  }

  function getStatusColor(status) {
    // if (!status)
    return '';

    // switch (status.value) {
    //   case STATUS.SUBMITTED:
    //     return '';
    //   case STATUS.IN_PROGRESS:
    //     return 'text-white bg-blue-700';
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
  width="w-4/5"
  containerClass="flex items-start"
>
  <div class="w-full">
    <Preview
      questions={data.questions || []}
      questionnaireMetaData={{
        answers: data.answers || {},
        isFinished: true,
      }}
      bind:grades={data.questionAnswerByPoint}
    />
  </div>
  <div class="ml-4 w-2/5 sticky top-0">
    <div class="flex items-center justify-between">
      <Select
        bind:value={status}
        options={SELECTABLE_STATUS}
        selectClassName={getStatusColor(status)}
        onChange={handleStatusChange}
      />

      <PrimaryButton
        onClick={() => {
          handleSave(data);
        }}
        label="Save"
        variant={VARIANTS.CONTAINED_SUCCESS}
        className="py-2 px-8"
      />
    </div>
    <div class="border border-gray-300 rounded-md mt-2">
      <div
        class="hover:bg-gray-100 border-b border-t-0 border-l-0 border-r-0 border-gray-300 p-3"
      >
        <p class="font-bold text-lg">Details</p>
      </div>

      <div class="flex items-center text-sm p-3">
        <p class="font-bold w-2/5">Total grade</p>
        <p>{total} / {maxPoints}</p>
      </div>
      <!-- <div class="flex items-center text-sm p-3">
        <p class="font-bold w-1/2">Status</p>
        <div class="flex items-center">
          <p class="rounded-full w-5 h-5 bg-yellow-300 mr-2" />
          <p>Grading</p>
        </div>
      </div> -->
      <div class="flex items-center text-sm p-3">
        <p class="font-bold w-2/5">Student</p>
        {#if data.student}
          <img
            alt="Student avatar"
            class="block rounded-full h-6 w-6"
            src={data.student.avatar_url}
          />
          <p class="ml-2 text-sm">{data.student.fullname}</p>
        {/if}
      </div>
      <!-- <div class="flex items-center text-sm p-3">
        <p class="font-bold w-1/2">Teacher</p>
        <p>rotimi-best</p>
      </div> -->
    </div>
  </div>
</Modal>
