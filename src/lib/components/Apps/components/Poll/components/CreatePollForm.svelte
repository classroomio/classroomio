<script lang="ts">
  import FormSection from './FormSection.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import type { IPoll } from '../types';

  export let title = 'Poll';
  export let onSubmit = (p: IPoll) => {};
  export let onCancel = () => {};

  let poll: IPoll = {
    id: '',
    question: '',
    author: {
      id: '',
      label: '',
      fullname: '',
      avatarUrl: ''
    },
    isPublic: false,
    status: '',
    expiration: '',
    options: [
      {
        id: '',
        label: '',
        selectedBy: []
      }
    ]
  };

  function handleAddOptions() {
    poll = {
      ...poll,
      options: [
        ...poll.options,
        {
          id: '',
          label: '',
          selectedBy: []
        }
      ]
    };
  }

  function handleRemoveOptions(index: string | number) {
    return () => {
      poll.options = poll.options.filter((o, i) => i !== index);
    };
  }

  function finishPoll() {
    onSubmit(poll);
  }
</script>

<div class="border rounded-md">
  <div class="border-b-2 p-4 text-center">
    {title}
  </div>
  <div class="p-3">
    <FormSection
      label="Question"
      bind:value={poll.question}
      handleLabelButton={undefined}
      handleInputButton={undefined}
    />
    <FormSection
      label="Expiration"
      bind:value={poll.expiration}
      type="date"
      handleLabelButton={undefined}
      handleInputButton={undefined}
    />

    {#each poll.options as option, index}
      <FormSection
        label={index === 0 ? 'Options' : ''}
        bind:value={option.label}
        handleLabelButton={handleAddOptions}
        handleInputButton={handleRemoveOptions(index)}
      />
    {/each}
  </div>

  <div class="w-full flex justify-center mb-3">
    <PrimaryButton label="Create poll" onClick={finishPoll} />
    <PrimaryButton label="Cancel" variant={VARIANTS.OUTLINED} onClick={onCancel} />
  </div>
</div>
