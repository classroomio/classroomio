<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { createCourseModal } from '../utils/store';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { InputField } from '@cio/ui/custom/input-field';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { t } from '$lib/utils/functions/translations';
  import type { TCourseType } from '@cio/db/types';
  import { courseApi } from '../api';

  let step = $state(0);

  const options = [
    {
      id: 'live-class',
      title: $t('new_course_modal.live_class_label'),
      subtitle: $t('new_course_modal.live_class_subtitle'),
      type: 'LIVE_CLASS' as TCourseType,
      isDisabled: false
    },
    {
      id: 'self-paced',
      title: $t('new_course_modal.self_paced_label'),
      subtitle: $t('new_course_modal.self_paced_subtitle'),
      type: 'SELF_PACED' as TCourseType,
      isDisabled: false
    }
  ];
  let type = $state(options[0].type);

  function onClose(redirectTo) {
    goto(redirectTo);

    createCourseModal.update(() => ({
      title: '',
      description: '',
      type: '',
      emails: '',
      tutors: '',
      students: ''
    }));
  }

  async function createCourse() {
    await courseApi.create({
      title: $createCourseModal.title,
      description: $createCourseModal.description,
      type: type
    });
  }

  let open = $derived(new URLSearchParams(page.url.search).get('create') === 'true');
</script>

<svelte:head>
  <title>Create a new course</title>
</svelte:head>

{#snippet course_type_selector()}
  <Field.Description>{$t('courses.new_course_modal.type_selector_title')}</Field.Description>

  <RadioGroup.Root bind:value={type} class="grid-cols-2">
    {#each options as option (option.id)}
      <Field.Label for={option.id}>
        <Field.Field orientation="horizontal">
          <Field.Content>
            <Field.Title>{option.title}</Field.Title>
            <Field.Description>{option.subtitle}</Field.Description>
          </Field.Content>

          <RadioGroup.Item value={option.type} id={option.id} aria-label={option.title} />
        </Field.Field>
      </Field.Label>
    {/each}
  </RadioGroup.Root>
{/snippet}

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen) onClose(page.url.pathname);
  }}
>
  <Dialog.Content class="mx-auto w-4/5 max-w-2xl md:w-2/5 md:min-w-[600px]">
    <Dialog.Header>
      <Dialog.Title>{$t('courses.new_course_modal.heading')}</Dialog.Title>
    </Dialog.Header>
    {#if step === 0}
      <div class="my-4 space-y-4">
        {@render course_type_selector()}

        <Dialog.Footer>
          <Button onclick={() => (step = 1)} disabled={!type}>
            {$t('courses.new_course_modal.next')}
          </Button>
        </Dialog.Footer>
      </div>
    {:else}
      <form onsubmit={preventDefault(createCourse)}>
        <div class="mb-4 flex items-end space-x-2">
          <InputField
            label={$t('courses.new_course_modal.course_name')}
            bind:value={$createCourseModal.title}
            placeholder={$t('courses.new_course_modal.course_name_placeholder')}
            className="w-full"
            isRequired={true}
            errorMessage={courseApi.errors.title}
            autoComplete={false}
          />
        </div>

        <TextareaField
          label={$t('courses.new_course_modal.short_description')}
          bind:value={$createCourseModal.description}
          rows={4}
          placeholder={$t('courses.new_course_modal.short_description_placeholder')}
          className="mb-4"
          isRequired={true}
          errorMessage={courseApi.errors.description}
          isAIEnabled={true}
          initAIPrompt="Write a 30 word description for a course titled: {$createCourseModal.title}"
        />

        <Dialog.Footer>
          <Button variant="outline" onclick={() => (step = 0)}>
            {$t('courses.new_course_modal.back')}
          </Button>
          <Button type="submit" disabled={courseApi.isLoading} loading={courseApi.isLoading}>
            {$t('courses.new_course_modal.button')}
          </Button>
        </Dialog.Footer>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>
