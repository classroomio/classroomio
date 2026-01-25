<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Select from '@cio/ui/base/select';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Label } from '@cio/ui/base/label';
  import * as Field from '@cio/ui/base/field';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { contentCreateStore } from './store';
  import { ContentType } from '@cio/utils/constants/content';
  import { courseApi, lessonApi } from '$features/course/api';
  import { goto } from '$app/navigation';
  import ExerciseCreateStepper from './exercise-create-stepper.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { untrack } from 'svelte';

  const contentOptions = [
    {
      id: 'section',
      type: ContentType.Section,
      title: 'Section',
      description: 'Group lessons and exercises together.'
    },
    {
      id: 'lesson',
      type: ContentType.Lesson,
      title: 'Lesson',
      description: 'Teach with notes, slides, and videos.'
    },
    {
      id: 'exercise',
      type: ContentType.Exercise,
      title: 'Exercise',
      description: 'Assess students with quizzes and tasks.'
    }
  ];

  let step = $state(0);
  let selectedType = $state<ContentType>(ContentType.Lesson);
  let title = $state('');
  let isSaving = $state(false);
  let sectionId = $state('');

  const profileId = $derived($profile?.id || '');
  const contentGroupingEnabled = $derived(courseApi.course?.metadata?.isContentGroupingEnabled ?? true);
  const sections = $derived(
    (courseApi.course?.content?.sections || []).filter((section) => section.id !== 'ungrouped')
  );
  const visibleContentOptions = $derived(
    contentGroupingEnabled ? contentOptions : contentOptions.filter((option) => option.type !== ContentType.Section)
  );
  const requiresSection = $derived(contentGroupingEnabled && selectedType !== ContentType.Section);
  const hasSections = $derived(sections.length > 0);
  const canCreateLessonOrExercise = $derived(!requiresSection || (requiresSection && !!sectionId));

  function getNextSectionOrder() {
    const orders = sections.map((section, index) => section.order ?? index + 1);
    const maxOrder = orders.length ? Math.max(...orders) : 0;
    return maxOrder + 1;
  }

  function getNextContentOrder(targetSectionId?: string) {
    const content = courseApi.course?.content;
    if (!content) return 1;

    let items = content.items;

    if (content.grouped) {
      const section = targetSectionId
        ? content.sections.find((entry) => entry.id === targetSectionId)
        : content.sections.find((entry) => entry.id === 'ungrouped');
      items = section?.items ?? [];
    }

    const orders = items.map((item, index) => item.order ?? index + 1);
    const maxOrder = orders.length ? Math.max(...orders) : 0;

    return maxOrder + 1;
  }

  async function refreshCourseContent() {
    const courseId = courseApi.course?.id;
    if (!courseId || !profileId) return;

    await courseApi.refreshCourse(courseId, profileId);
  }

  $effect(() => {
    if ($contentCreateStore.open) {
      untrack(() => {
        step = 0;
        const initialType = $contentCreateStore.initialType ?? ContentType.Lesson;
        selectedType = contentGroupingEnabled || initialType !== ContentType.Section ? initialType : ContentType.Lesson;
        sectionId = contentGroupingEnabled ? $contentCreateStore.sectionId || sections[0]?.id || '' : '';
        title = '';
      });
    }
  });

  function closeModal() {
    contentCreateStore.update((state) => ({ ...state, open: false, sectionId: '', initialType: ContentType.Lesson }));
  }

  function goToDetails() {
    step = 1;
  }

  function goBack() {
    step = 0;
  }

  async function handleCreateSection() {
    if (!courseApi.course?.id || !title.trim()) return;
    isSaving = true;
    await lessonApi.createSection(courseApi.course.id, {
      title,
      courseId: courseApi.course.id,
      order: getNextSectionOrder()
    });

    if (lessonApi.success) {
      await refreshCourseContent();
      closeModal();
    }
    isSaving = false;
  }

  async function handleCreateLesson() {
    if (!courseApi.course?.id || !title.trim()) return;
    if (requiresSection && !sectionId) return;

    isSaving = true;
    const order = getNextContentOrder(requiresSection ? sectionId : undefined);

    await lessonApi.create(courseApi.course.id, {
      title,
      courseId: courseApi.course.id,
      lessonAt: new Date().toDateString(),
      isUnlocked: true,
      order,
      sectionId: requiresSection ? sectionId : undefined
    });

    if (lessonApi.success && lessonApi.lesson) {
      await refreshCourseContent();
      closeModal();
      goto(`/courses/${courseApi.course.id}/lessons/${lessonApi.lesson.id}`);
    }
    isSaving = false;
  }
</script>

<Dialog.Root bind:open={$contentCreateStore.open} onOpenChange={(isOpen) => !isOpen && closeModal()}>
  <Dialog.Content class="max-w-2xl!">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.add_content')}</Dialog.Title>
    </Dialog.Header>

    {#if step === 0}
      <div>
        <Field.Description>{$t('course.navItem.lessons.add_content_description')}</Field.Description>
        <RadioGroup.Root bind:value={selectedType} class="mt-5 grid gap-3 md:grid-cols-3">
          {#each visibleContentOptions as option (option.id)}
            <Field.Label for={option.id}>
              <Field.Field orientation="horizontal">
                <Field.Content>
                  <Field.Title>{option.title}</Field.Title>
                  <Field.Description>{option.description}</Field.Description>
                </Field.Content>
                <RadioGroup.Item value={option.type} id={option.id} aria-label={option.title} />
              </Field.Field>
            </Field.Label>
          {/each}
        </RadioGroup.Root>
        <Dialog.Footer>
          <Button onclick={goToDetails}>Continue</Button>
        </Dialog.Footer>
      </div>
    {:else}
      <div>
        <div class="mb-4">
          <p class="text-sm font-semibold">{contentOptions.find((o) => o.type === selectedType)?.title}</p>
          <p class="text-xs text-gray-500">{$t('course.navItem.lessons.add_content_details')}</p>
        </div>

        {#if requiresSection}
          <div class="mb-4">
            <Label class="mb-1 block text-xs font-medium">Section</Label>
            {#if hasSections}
              <Select.Root
                type="single"
                value={sectionId}
                onValueChange={(value) => {
                  if (value) sectionId = value;
                }}
              >
                <Select.Trigger class="h-10 w-full"
                  >{sections.find((s) => s.id === sectionId)?.title || 'Select section'}</Select.Trigger
                >
                <Select.Content>
                  <Select.Group>
                    {#each sections as section}
                      <Select.Item value={section.id}>{section.title}</Select.Item>
                    {/each}
                  </Select.Group>
                </Select.Content>
              </Select.Root>
            {:else}
              <p class="text-xs text-gray-500">Create a section first to add lessons or exercises.</p>
            {/if}
          </div>
        {/if}

        {#if selectedType === ContentType.Section}
          <InputField label="Section title" bind:value={title} autoFocus={true} className="w-full" isRequired={true} />
          <Dialog.Footer class="mt-6 flex items-center justify-between">
            <Button variant="outline" onclick={goBack}>Back</Button>
            <Button onclick={handleCreateSection} loading={isSaving} disabled={!title.trim()}>Create section</Button>
          </Dialog.Footer>
        {:else if selectedType === ContentType.Lesson}
          <InputField label="Lesson title" bind:value={title} autoFocus={true} className="w-full" isRequired={true} />
          <Dialog.Footer class="mt-6 flex items-center justify-between">
            <Button variant="outline" onclick={goBack}>Back</Button>
            <Button
              onclick={handleCreateLesson}
              loading={isSaving}
              disabled={!title.trim() || !canCreateLessonOrExercise}
            >
              Create lesson
            </Button>
          </Dialog.Footer>
        {:else if selectedType === ContentType.Exercise}
          <ExerciseCreateStepper
            courseId={courseApi.course?.id || ''}
            sectionId={requiresSection ? sectionId : undefined}
            order={getNextContentOrder(requiresSection ? sectionId : undefined)}
            canCreate={canCreateLessonOrExercise}
            onCancel={closeModal}
            onCreated={(exerciseId) => {
              closeModal();
              goto(`/courses/${courseApi.course?.id}/exercises/${exerciseId}`);
            }}
          />
          <Dialog.Footer class="mt-6 flex items-center justify-between">
            <Button variant="outline" onclick={goBack}>Back</Button>
          </Dialog.Footer>
        {/if}
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
