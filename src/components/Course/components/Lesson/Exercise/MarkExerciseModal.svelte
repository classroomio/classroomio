<script>
  import Modal from "../../../../Modal/index.svelte";
  import Preview from "./Preview.svelte";
  import { questionnaire } from "./store";
  import { questionnaireMetaData } from "./store/answers";
  export let open;
  export let onClose;
  // export let submissionId;

  // get submission data by submissionId;

  $: console.log("questionnaireMetaData", $questionnaireMetaData);
</script>

<Modal
  modalHeading="Lesson 1: How to use props in React.js"
  bind:open
  {onClose}
  width="w-3/5"
>
  <Preview
    questions={$questionnaire.questions}
    questionnaireMetaData={$questionnaireMetaData}
  />
</Modal>
