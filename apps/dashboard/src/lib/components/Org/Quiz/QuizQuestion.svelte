<script>
  import CheckmarkFilledIcon from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import CheckmarkOutlineIcon from 'carbon-icons-svelte/lib/CheckmarkOutline.svelte';
  import { optionImage } from '$lib/utils/constants/quiz';
  import TextField from '$lib/components/Form/TextField.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';

  export let currentQuestion = {
    label: ''
  };
  export let currentError = {};
  export let optionHasError = () => false;
  export let isPreview = false;
</script>

{#if isPreview}
  <h1 class="text-white mb-5 font-bold">{currentQuestion.label}</h1>
{:else}
  <TextField
    placeholder={$t('components.quiz.start_typing')}
    bind:value={currentQuestion.label}
    className="w-full my-4"
    errorMessage={currentError.isLabelEmpty && $t('components.quiz.required_field')}
    isRequired={true}
    bgColor="bg-white"
  />
{/if}

<!-- Options -->
<div class="flex justify-between w-full flex-wrap">
  {#each currentQuestion.options || [] as option}
    <div class="w-2/5 bg-white dark:bg-neutral-800 rounded p-5 mb-5 relative">
      <img src={optionImage[option.id]} alt={option.id} />

      {#if isPreview}
        <p class="mt-5">{option.label}</p>
      {:else}
        <TextField
          bind:value={option.label}
          placeholder={$t('components.quiz.type_answer')}
          bgColor="bg-white"
          className="mt-3"
          isDisabled={currentQuestion.type === 'boolean'}
          errorMessage={optionHasError(option.id, currentError.options) &&
            $t('components.quiz.label')}
        />
        <div class="flex justify-end absolute top-2 right-2">
          <IconButton
            value={option.id}
            onClick={() => (option.isCorrect = !option.isCorrect)}
            buttonClassName={option.isCorrect && 'success'}
          >
            {#if option.isCorrect}
              <CheckmarkFilledIcon size={24} class="carbon-icon dark:text-white" />
            {:else}
              <CheckmarkOutlineIcon size={24} class="carbon-icon dark:text-white" />
            {/if}
          </IconButton>
        </div>
      {/if}
    </div>
  {/each}
</div>
