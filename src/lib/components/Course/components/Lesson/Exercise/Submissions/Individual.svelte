<script lang="ts">
  import { questionnaire } from '../../store/exercise';
  import { submissions } from './store';

  export let isLoading = false;

  const defaultImg =
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=60&w=800&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXZhdGFyc3xlbnwwfHwwfHx8Mg%3D%3D';

  let studentSelected = 0;

  const isSelected = (option: { value: string[] }): boolean => {
    if ($submissions) {
      let submittedAnswer = $submissions[studentSelected]?.answers.map((answer) => answer.answers);
      return !!submittedAnswer.find((opt) => opt == option.value);
    }

    return false;
  };
</script>

{#if isLoading}
  Loading data
{:else if $submissions?.length}
  <div class="flex gap-1 w-full overflow-auto mt-2 mb-5">
    {#each $submissions as student, i}
      <button on:click={() => (studentSelected = i)} class="flex flex-col items-center w-20">
        <div
          class={`flex items-center justify-center w-12 h-12 rounded-full ${
            studentSelected == i ? 'border-[3px] border-primary-700' : ''
          }`}
        >
          <img
            src={student.submitted_by.profile.avatar_url
              ? student.submitted_by.profile.avatar_url
              : defaultImg}
            alt="student"
            class={`w-10 h-10 rounded-full bg-white m-1`}
          />
        </div>
        <p class="line-clamp-2 w-20 whitespace-pre-wrap leading-4">
          {student.submitted_by.profile.fullname}
        </p>
      </button>
    {/each}
  </div>

  <p class="font-medium mb-2">
    {$submissions[studentSelected].submitted_by.profile.fullname}'s Individual Answers
  </p>
  {#if $submissions[studentSelected]}
    {#if $questionnaire.questions}
      {#each $questionnaire.questions as q, i}
        <div class="pb-4">
          <p>{i + 1}. {q.title}</p>
          {#if q.question_type_id !== 3}
            {#each q.options as option, i}
              <div
                class="flex gap-2 max-w-[80%] items-center my-1 border border-gray-600 dark:border-gray-100 rounded-md p-3"
              >
                <input type="checkbox" name="" id="" checked={isSelected(option)} />
                <p>{option.label}</p>
              </div>
            {/each}
          {/if}
          {#if q.question_type_id === 3}
            <div
              class="border border-gray-300 rounded-md max-w-[80%] bg-slate-200 dark:bg-slate-500 p-2 my-1"
            >
              {#if $submissions[studentSelected].answers.map((ans) => ans.open_answer)}
                <p>
                  {$submissions[studentSelected].answers.map((ans) => ans.open_answer)}
                </p>
              {:else}
                <p>No answer</p>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  {/if}
{/if}
