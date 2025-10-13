<script lang="ts">
  import CircleCheckIcon from '$lib/components/Icons/CircleCheckIcon.svelte';
  import { optionImage } from '$lib/utils/constants/quiz';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { IconButton } from '$lib/components/IconButton';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    currentQuestion?: any;
    currentError?: any;
    optionHasError?: any;
    isPreview?: boolean;
  }

  let {
    currentQuestion = $bindable({
      label: ''
    }),
    currentError = {},
    optionHasError = () => false,
    isPreview = false
  }: Props = $props();
</script>

{#if isPreview}
  <h1 class="mb-5 font-bold text-white">{currentQuestion.label}</h1>
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
<div class="flex w-full flex-wrap justify-between">
  {#each currentQuestion.options || [] as option}
    <div class="relative mb-5 w-2/5 rounded bg-white p-5 dark:bg-neutral-800">
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
          errorMessage={optionHasError(option.id, currentError.options) && $t('components.quiz.label')}
        />
        <div class="absolute right-2 top-2 flex justify-end">
          <IconButton
            value={option.id}
            onClick={() => (option.isCorrect = !option.isCorrect)}
            buttonClassName={option.isCorrect && 'success'}
          >
            <CircleCheckIcon filled={option.isCorrect} />
          </IconButton>
        </div>
      {/if}
    </div>
  {/each}
</div>
