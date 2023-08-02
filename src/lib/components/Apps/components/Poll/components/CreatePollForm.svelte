<script>
  import FormSection from './FormSection.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';

  export let title = 'Poll';
  export let onSubmit;
  export let onCancel;

  let values = {
    question: '',
    author: '',
    isPublic: false,
    expiration: '',
    options: [
      {
        label: '',
        selectedBy: [],
      },
    ],
  };

  function handleAddOptions() {
    values = {
      ...values,
      options: [
        ...values.options,
        {
          label: '',
          selectedBy: [],
        },
      ],
    };
  }

  function handleRemoveOptions(index) {
    return () => {
      values.options = values.options.filter((o, i) => i !== index);
    };
  }

  function finishPoll() {
    onSubmit(values);
  }
</script>

<div class="border rounded-md">
  <div class="border-b-2 p-4 text-center">
    {title}
  </div>
  <div class="p-3">
    <FormSection label="Question" bind:value={values.question} />
    <FormSection
      label="Expiration"
      bind:value={values.expiration}
      type="date"
    />

    {#each values.options as option, index}
      <FormSection
        label={index === 0 && 'Options'}
        bind:value={option.label}
        handleLabelButton={handleAddOptions}
        handleInputButton={handleRemoveOptions(index)}
      />
    {/each}
  </div>

  <div class="w-full flex justify-center mb-3">
    <PrimaryButton label="Create poll" onClick={finishPoll} />
    <PrimaryButton
      label="Cancel"
      variant={VARIANTS.OUTLINED}
      onClick={onCancel}
    />
  </div>
</div>
