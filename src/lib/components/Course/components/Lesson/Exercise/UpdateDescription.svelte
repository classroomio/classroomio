<script>
  import QuestionContainer from '$lib/components/QuestionContainer/index.svelte';
  import EditContent from '$lib/components/EditContent/index.svelte';
  import DateTime from '$lib/components/Form/DateTime.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { questionnaire } from '../store/exercise';
  import { marked } from 'marked';
  export let preview;

  function getTotalPossibleGrade(questions) {
    return questions.reduce((acc, question) => {
      acc += parseFloat(question.points, 10);
      return acc;
    }, 0);
  }
</script>

<div class="mb-5 px-6">
  <QuestionContainer isTitle={true}>
    {#if !preview}
      <TextField
        placeholder="Title"
        bind:value={$questionnaire.title}
        className="mb-2"
        onChange={() => ($questionnaire.is_title_dirty = true)}
      />
      <DateTime
        label="Due by"
        className="w-50"
        value={$questionnaire.due_by}
        onInput={(e) => {
          $questionnaire.due_by = e.target.value;
          $questionnaire.is_due_by_dirty = true;
        }}
      />
      <EditContent
        writeLabel="Description"
        bind:value={$questionnaire.description}
        placeholder="Start typing your lesson"
        textAreaHeight="100px"
        onInputChange={() => ($questionnaire.is_description_dirty = true)}
      />
    {:else if preview}
      <h2 class="my-1">{$questionnaire.title}</h2>
      <div class="flex items-center">
        <p class="dark:text-white mx-2">
          <strong>{$questionnaire.questions.length}</strong> questions
        </p>
        |
        <p class="dark:text-white mx-2">
          <strong>{getTotalPossibleGrade($questionnaire.questions)}</strong> points.
        </p>
        |
        <p class="dark:text-white mx-2">All required</p>
        {#if $questionnaire.due_by}
          |
          <p class="dark:text-white mx-2">
            <strong>Due by:</strong>
            {new Date($questionnaire.due_by).toLocaleString()}
          </p>
        {/if}
      </div>

      <article class="preview prose prose-sm sm:prose p-2">
        {@html marked($questionnaire.description || 'No description')}
      </article>
    {/if}
  </QuestionContainer>
</div>
