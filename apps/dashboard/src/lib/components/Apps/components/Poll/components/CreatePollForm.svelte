<script lang="ts">
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import DateTime from '$lib/components/Form/DateTime.svelte';
  import type { PollType } from '../types';
  import { course } from '$lib/components/Course/store';
  import { profile } from '$lib/utils/store/user';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { Add, TrashCan } from 'carbon-icons-svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';

  export let title = 'Poll';
  export let isSaving = false;
  export let onSubmit = (p: PollType) => {};
  export let onCancel = () => {};

  let poll: PollType = {
    id: new Date().getTime().toString(),
    courseId: $course.id || '',
    question: '',
    expiration: new Date().toDateString(),
    isPublic: false,
    status: $t('course.navItem.lessons.poll.draft'),
    author: {
      id: $profile.id || '',
      username: $profile.username || '',
      fullname: $profile.fullname || '',
      avatarUrl: $profile.avatar_url || ''
    },
    options: [
      {
        id: '',
        label: '',
        selectedBy: []
      }
    ]
  };
  let isCreateDisabled = false;

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
      poll.options = poll.options.filter((_, i) => i !== index);
    };
  }

  function finishPoll() {
    onSubmit(poll);
  }

  $: isCreateDisabled = poll.question === '' || poll.options.length < 2;
</script>

<div class="border rounded-md">
  <div class="border-b-2 p-4 text-center">
    {title}
  </div>
  <div class="p-3">
    <TextField
      label={$t('course.navItem.lessons.poll.question')}
      className="w-full mb-3"
      bind:value={poll.question}
      placeholder={$t('course.navItem.lessons.poll.poll_question')}
      isRequired={true}
    />
    <DateTime
      label={$t('course.navItem.lessons.poll.expiration')}
      className="w-full mb-3"
      bind:value={poll.expiration}
      isRequired={true}
    />

    <div>
      <p class="dark:text-white p-0 m-0 mb-1 text-md flex items-center gap-2">
        {$t('course.navItem.lessons.poll.options')}

        <IconButton onClick={handleAddOptions} contained={true} size="small">
          <Add size={16} />
        </IconButton>
      </p>
    </div>

    {#each poll.options as option, index}
      <div class="flex items-center gap-2 mb-3">
        <TextField
          label=""
          className="w-full"
          bind:value={option.label}
          placeholder={$t('course.navItem.lessons.poll.option_label')}
          isRequired={true}
        />
        <IconButton onClick={handleRemoveOptions(index)} contained={true} size="small">
          <TrashCan size={16} />
        </IconButton>
      </div>
    {/each}
  </div>

  <div class="w-full flex justify-center gap-2 mb-3">
    <PrimaryButton
      label={$t('course.navItem.lessons.poll.create_poll')}
      onClick={finishPoll}
      isLoading={isSaving}
      isDisabled={isCreateDisabled}
    />
    <PrimaryButton
      label={$t('course.navItem.lessons.poll.cancel')}
      variant={VARIANTS.OUTLINED}
      onClick={onCancel}
    />
  </div>
</div>
