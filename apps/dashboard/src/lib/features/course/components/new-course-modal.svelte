<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { courses, createCourseModal } from '../utils/store';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { InputField } from '@cio/ui/custom/input-field';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { ROLE } from '@cio/utils/constants';
  import * as Field from '@cio/ui/base/field';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { supabase } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';
  import { addDefaultNewsFeed, addGroupMember } from '$lib/utils/services/courses';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { COURSE_TYPE, COURSE_VERSION } from '$lib/utils/types';

  let isLoading = $state(false);
  let errors = $state({
    title: '',
    description: ''
  });
  let step = $state(0);

  const options = [
    {
      id: 'live-class',
      title: $t('new_course_modal.live_class_label'),
      subtitle: $t('new_course_modal.live_class_subtitle'),
      type: COURSE_TYPE.LIVE_CLASS,
      isDisabled: false
    },
    {
      id: 'self-paced',
      title: $t('new_course_modal.self_paced_label'),
      subtitle: $t('new_course_modal.self_paced_subtitle'),
      type: COURSE_TYPE.SELF_PACED,
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

  function validateForm() {
    if (!$createCourseModal.title) {
      errors.title = $t('courses.new_course_modal.course_name_required');
      return false;
    }

    if (!$createCourseModal.description) {
      errors.description = $t('courses.new_course_modal.short_description_required');
      return false;
    }

    return true;
  }

  async function createCourse() {
    isLoading = true;

    const isValid = validateForm();
    if (!isValid) return;

    const { title, description } = $createCourseModal;
    // 1. Create group
    const { data: newGroup } = await supabase
      .from('group')
      .insert({ name: title, description, organization_id: $currentOrg.id })
      .select();

    console.log(`newGroup`, newGroup);

    if (!newGroup) return;

    const { id: group_id } = newGroup[0];

    // 2. Create course with group_id
    const { data: newCourseData } = await supabase
      .from('course')
      .insert({
        title,
        description,
        type: type,
        version: COURSE_VERSION.V2,
        group_id
      })
      .select();
    console.log(`newCourse data`, newCourseData);

    if (!newCourseData) return;

    const newCourse = newCourseData[0];
    courses.update((_courses) => [..._courses, newCourse]);

    capturePosthogEvent('course_created', {
      course_id: newCourse.id,
      course_title: newCourse.title,
      course_description: newCourse.description,
      organization_id: $currentOrg.id,
      organization_name: $currentOrg.name,
      user_id: $profile.id,
      user_email: $profile.email
    });

    // 3. Add group members
    const { data } = await addGroupMember({
      profile_id: $profile.id,
      email: $profile.email,
      group_id,
      role_id: ROLE.TUTOR
    });

    // 4. Add default news feed.
    if (Array.isArray(data) && data.length) {
      const { id: authorId } = data[0];
      console.log('Add news feed into course');

      await addDefaultNewsFeed({
        content: `<h2>Welcome to this course 🎉&nbsp;</h2>
<p>Thank you for joining this course and I hope you get the best out of it.</p>`,
        course_id: newCourse.id,
        is_pinned: true,
        author_id: authorId
      });
    }

    onClose(`/courses/${newCourse.id}`);
    isLoading = false;
  }

  $inspect(type);

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
            errorMessage={errors.title}
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
          errorMessage={errors.description}
          isAIEnabled={true}
          initAIPrompt="Write a 30 word description for a course titled: {$createCourseModal.title}"
        />

        <Dialog.Footer>
          <Button variant="outline" onclick={() => (step = 0)}>
            {$t('courses.new_course_modal.back')}
          </Button>
          <Button type="submit" disabled={isLoading} loading={isLoading}>
            {$t('courses.new_course_modal.button')}
          </Button>
        </Dialog.Footer>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>
