<script>
  import Modal from '../../../../Modal/index.svelte';
  import Preview from './Preview.svelte';
  export let open;
  export let onClose;

  export let submissionId;
  export let data = {};

  let grades = {};
  let total = 0;
  let gradeTotal = 0;

  function setGrades(data) {
    grades = (data.questions || []).reduce(
      (acc, question) => ({ ...acc, [question.name]: question.points }),
      {}
    );

    gradeTotal = calculateTotal(grades);
  }

  function calculateTotal(grades) {
    return Object.values(grades).reduce(
      (acc, grade) => acc + parseInt(grade),
      0
    );
  }

  $: setGrades(data);
  $: total = calculateTotal(grades);
</script>

<Modal
  modalHeading="Lesson 1: How to use props in React.js"
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
      bind:grades
    />
  </div>
  <div class="ml-10 w-1/3">
    <div class="border border-gray-300 rounded-md">
      <div
        class="hover:bg-gray-100 border-b border-t-0 border-l-0 border-r-0 border-gray-300 p-3"
      >
        <p class="font-bold text-lg">Details</p>
      </div>

      <div class="flex items-center text-sm p-3">
        <p class="font-bold w-1/2">Total grade</p>
        <p>{total} / {gradeTotal}</p>
      </div>
      <div class="flex items-center text-sm p-3">
        <p class="font-bold w-1/2">Status</p>
        <div class="flex items-center">
          <p class="rounded-full w-5 h-5 bg-yellow-300 mr-2" />
          <p>Grading</p>
        </div>
      </div>
      <div class="flex items-center text-sm p-3">
        <p class="font-bold w-1/2">Student</p>
        <p>Jeremy Matt</p>
      </div>
      <div class="flex items-center text-sm p-3">
        <p class="font-bold w-1/2">Teacher</p>
        <p>rotimi-best</p>
      </div>
    </div>
  </div>
</Modal>
