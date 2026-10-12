<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';

  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
  import { Badge } from '@cio/ui/base/badge';
  import { createCourseModal } from '../utils/store';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { InputField } from '@cio/ui/custom/input-field';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Alert from '@cio/ui/base/alert';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { RadioOptionCardGroup } from '@cio/ui/custom/radio-option-card';
  import { t } from '$lib/utils/functions/translations';
  import { openUpgradeModal } from '$lib/utils/store/upgrade-modal';
  import { licenseApi } from '$features/license/api/license.svelte';
  import type { TCourseType } from '@cio/db/types';
  import { courseApi } from '../api';

  type CoursePath = 'build' | 'scorm';

  let step = $state(0);
  let path = $state<CoursePath>('build');

  const hasScormAccess = $derived(licenseApi.hasAccess('scorm'));
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';

  const pathOptions = $derived([
    {
      id: 'build-course',
      title: $t('new_course_modal.build_course_label'),
      description: $t('new_course_modal.build_course_subtitle'),
      value: 'build' as CoursePath
    },
    {
      id: 'scorm-course',
      title: $t('new_course_modal.scorm_course_label'),
      description: $t('new_course_modal.scorm_course_subtitle'),
      value: 'scorm' as CoursePath
    }
  ]);

  const typeOptions = [
    {
      id: 'self-paced',
      title: $t('new_course_modal.self_paced_label'),
      subtitle: $t('new_course_modal.self_paced_subtitle'),
      type: 'SELF_PACED' as TCourseType,
      isDisabled: false
    },
    {
      id: 'live-class',
      title: $t('new_course_modal.live_class_label'),
      subtitle: $t('new_course_modal.live_class_subtitle'),
      type: 'LIVE_CLASS' as TCourseType,
      isDisabled: false
    },
    {
      id: 'compliance',
      title: $t('new_course_modal.compliance_label'),
      subtitle: $t('new_course_modal.compliance_subtitle'),
      type: 'COMPLIANCE' as TCourseType,
      isDisabled: false
    },
    {
      id: 'public',
      title: $t('new_course_modal.public_label'),
      subtitle: $t('new_course_modal.public_subtitle'),
      type: 'PUBLIC' as TCourseType,
      isDisabled: false
    }
  ];
  const scormTypeOptions = $derived(
    typeOptions.filter((option) => option.type !== 'LIVE_CLASS' && option.type !== 'PUBLIC')
  );
  const visibleTypeOptions = $derived(path === 'scorm' ? scormTypeOptions : typeOptions);
  const courseTypeOptionsForGroup = $derived(
    visibleTypeOptions.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.subtitle,
      value: o.type
    }))
  );

  let type = $state(typeOptions[0].type);

  $effect(() => {
    if (path === 'scorm' && type !== 'SELF_PACED' && type !== 'COMPLIANCE') {
      type = 'SELF_PACED';
    }
  });

  const canCreateScorm = $derived(path !== 'scorm' || hasScormAccess);

  function resetFlow() {
    step = 0;
    path = 'build';
    type = typeOptions[0].type;
  }

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
    resetFlow();
  }

  async function createCourse() {
    if (path === 'scorm' && !hasScormAccess) return;

    await courseApi.create(
      {
        title: $createCourseModal.title,
        description: $createCourseModal.description,
        type,
        ...(path === 'scorm' ? { format: 'scorm' as const } : {})
      },
      (courseId, activityId) => {
        if (path === 'scorm' && activityId) {
          goto(resolve(`/courses/${courseId}/activities/${activityId}`, {}));
          return;
        }

        goto(resolve(`/courses/${courseId}/lessons`, {}));
      }
    );
  }

  let open = $derived(new URLSearchParams(page.url.search).get('create') === 'true');
</script>

{#snippet course_path_selector()}
  <Field.Description>{$t('courses.new_course_modal.type_selector_title')}</Field.Description>

  <RadioOptionCardGroup options={pathOptions} bind:value={path} class="grid-cols-1 md:grid-cols-2">
    {#snippet titleSuffix(option)}
      {#if option.value === 'scorm'}
        <span data-testid="new-course-scorm-option" class="contents">
          {#if !hasScormAccess}
            <Badge variant="secondary">{$t('new_course_modal.scorm_gated')}</Badge>
          {/if}
        </span>
      {/if}
    {/snippet}
  </RadioOptionCardGroup>
{/snippet}

{#snippet course_type_selector()}
  <Field.Description>{$t('courses.new_course_modal.type_selector_title')}</Field.Description>

  <RadioOptionCardGroup options={courseTypeOptionsForGroup} bind:value={type} class="grid-cols-1 md:grid-cols-2" />
{/snippet}

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen) onClose(page.url.pathname);
  }}
>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{$t('courses.new_course_modal.heading')}</Dialog.Title>
    </Dialog.Header>
    {#if step === 0}
      <div class="my-4 space-y-4">
        {@render course_path_selector()}

        <Dialog.Footer>
          <Button onclick={() => (step = 1)} disabled={!path}>{$t('courses.new_course_modal.next')}</Button>
        </Dialog.Footer>
      </div>
    {:else if step === 1}
      <div class="my-4 space-y-4">
        {@render course_type_selector()}

        <Dialog.Footer class="flex justify-between">
          <Button variant="outline" onclick={() => (step = 0)}>{$t('courses.new_course_modal.back')}</Button>
          <Button onclick={() => (step = 2)} disabled={!type}>{$t('courses.new_course_modal.next')}</Button>
        </Dialog.Footer>
      </div>
    {:else}
      <form onsubmit={preventDefault(createCourse)}>
        {#if path === 'scorm' && !hasScormAccess}
          <Alert.Root variant="warning" class="mb-4">
            <Alert.Title>{$t('new_course_modal.scorm_gated')}</Alert.Title>
            <Alert.Description>
              {#if isSelfHosted}
                {$t('new_course_modal.scorm_license_notice')}
              {:else}
                {$t('new_course_modal.scorm_upgrade_notice')}
              {/if}
            </Alert.Description>
            {#if !isSelfHosted}
              <div class="mt-3">
                <Button size="sm" variant="outline" onclick={openUpgradeModal}>
                  {$t('new_course_modal.scorm_upgrade_cta')}
                </Button>
              </div>
            {/if}
          </Alert.Root>
        {/if}

        <div class="mb-4 flex items-end space-x-2">
          <InputField
            label={$t('courses.new_course_modal.course_name')}
            bind:value={$createCourseModal.title}
            placeholder={$t('courses.new_course_modal.course_name_placeholder')}
            className="w-full"
            isRequired={true}
            errorMessage={courseApi.errors.title}
            onInput={() => courseApi.clearError('title')}
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
          oninput={() => courseApi.clearError('description')}
          isAIEnabled={true}
          initAIPrompt="Write a 30 word description for a course titled: {$createCourseModal.title}"
        />

        <Dialog.Footer>
          <Button variant="outline" onclick={() => (step = 1)}>
            {$t('courses.new_course_modal.back')}
          </Button>
          <Button type="submit" disabled={courseApi.isLoading || !canCreateScorm} loading={courseApi.isLoading}>
            {$t('courses.new_course_modal.button')}
          </Button>
        </Dialog.Footer>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>
