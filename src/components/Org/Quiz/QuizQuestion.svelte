<script>
  import CheckmarkFilled24 from 'carbon-icons-svelte/lib/CheckmarkFilled24';
  import CheckmarkOutline24 from 'carbon-icons-svelte/lib/CheckmarkOutline24';
  import { optionImage } from '../../../utils/constants/quiz';
  import TextField from '../../Form/TextField.svelte';
  import IconButton from '../../IconButton/index.svelte';

  export let currentQuestion = {
    label: '',
  };
  export let currentError = {};
  export let optionHasError = () => false;
  export let isPreview = false;
</script>

{#if isPreview}
  <h1 class="text-white mb-5 font-bold">{currentQuestion.label}</h1>
{:else}
  <TextField
    placeholder="Start typing your question"
    bind:value={currentQuestion.label}
    className="w-full my-4"
    errorMessage={currentError.isLabelEmpty && 'This field is required'}
    isRequired={true}
    bgColor="bg-white"
  />
{/if}

<!-- Options -->
<div class="flex justify-between w-full flex-wrap">
  {#each currentQuestion.options || [] as option}
    <div class="w-2/5 bg-white dark:bg-gray-700 rounded p-5 mb-5 relative">
      <img src={optionImage[option.id]} alt={option.id} />

      {#if isPreview}
        <p class="mt-5">{option.label}</p>
      {:else}
        <TextField
          bind:value={option.label}
          placeholder="Type answer"
          bgColor="bg-white"
          className="mt-3"
          isDisabled={currentQuestion.type === 'boolean'}
          errorMessage={optionHasError(option.id, currentError.options) &&
            'Please enter a label'}
        />
        <div class="flex justify-end absolute top-2 right-2">
          <IconButton
            value={option.id}
            onClick={() => (option.isCorrect = !option.isCorrect)}
            buttonClassName={option.isCorrect && 'success'}
          >
            {#if option.isCorrect}
              <CheckmarkFilled24 class="carbon-icon" />
            {:else}
              <CheckmarkOutline24 class="carbon-icon" />
            {/if}
          </IconButton>
        </div>
      {/if}
    </div>
  {/each}
</div>
