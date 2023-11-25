<script lang="ts">
  import type { WaitlistQuestion } from '$lib/utils/types';
  import AutoGrowTextField from '$lib/components/Form/AutoGrowTextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  export let question: WaitlistQuestion;
  export let handleStart: () => void;
</script>

<AutoGrowTextField
  placeholder="Enter question"
  value={question.title}
  bgColor="bg-white dark:bg-black dark:text-white"
  inputClassName="text-md my-2"
  isPreview={true}
  onInput={(e) => {
    question.title = e.currentTarget.innerText || '';
  }}
/>
<AutoGrowTextField
  placeholder="Enter description"
  value={question.description}
  bgColor="bg-white dark:bg-black dark:text-white"
  inputClassName="text-sm italic mb-2"
  isPreview={true}
  onInput={(e) => {
    question.description = e.currentTarget.innerText || '';
  }}
/>

{#if question.options}
  {#each question.options as option, index}
    <div class="flex items-center gap-2">
      <input type="radio" name="option" id={option.id} value={option.label} />
      <label for={option.label}>{option.label}</label>
    </div>
  {/each}
{/if}

<PrimaryButton label="Start" onClick={handleStart} className="mt-5" />
