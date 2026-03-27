<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { CheckboxField, MultiSelectList } from '@cio/ui';
  import { t } from '$lib/utils/functions/translations';
  import { orgApi } from '$features/org/api/org.svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import { SvelteSet } from 'svelte/reactivity';

  interface Course {
    id: string;
    title: string;
  }

  interface Props {
    open: boolean;
    selectedProfileIds: string[];
    courses: Course[];
    onclose: () => void;
    onassigned: () => void;
  }

  let { open = $bindable(), selectedProfileIds, courses, onclose, onassigned }: Props = $props();

  let fields = $state({
    selectedCourseIds: new SvelteSet<string>(),
    sendEmail: true
  });
  let isSubmitting = $state(false);

  function toggleCourse(courseId: string) {
    if (fields.selectedCourseIds.has(courseId)) {
      fields.selectedCourseIds.delete(courseId);
    } else {
      fields.selectedCourseIds.add(courseId);
    }
  }

  function handleClose() {
    fields.selectedCourseIds.clear();
    fields.sendEmail = true;
    onclose();
  }

  async function handleSubmit() {
    if (fields.selectedCourseIds.size === 0) {
      snackbar.error('audience.assign.snackbar_no_courses');
      return;
    }

    isSubmitting = true;

    try {
      await orgApi.assignAudienceToCourses({
        profileIds: selectedProfileIds,
        courseIds: [...fields.selectedCourseIds],
        sendEmail: fields.sendEmail
      });

      fields.selectedCourseIds.clear();
      fields.sendEmail = true;
      onassigned();
    } catch {
      snackbar.error('audience.assign.snackbar_failed');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Dialog.Root bind:open onOpenChange={(v) => !v && handleClose()}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('audience.assign.title')}</Dialog.Title>
      <Dialog.Description>{$t('audience.assign.description')}</Dialog.Description>
    </Dialog.Header>

    <MultiSelectList
      heading={$t('audience.assign.select_courses')}
      emptyMessage={$t('audience.assign.select_courses_placeholder')}
      items={courses.map((c) => ({ id: c.id, label: c.title || c.id }))}
      isSelected={(id) => fields.selectedCourseIds.has(id)}
      onToggle={toggleCourse}
      namePrefix="assign-course"
    />

    <CheckboxField name="assign-send-email" label={$t('audience.assign.send_email')} bind:checked={fields.sendEmail} />

    <Dialog.Footer class="mt-4">
      <Button variant="outline" onclick={handleClose}>
        {$t('audience.assign.cancel')}
      </Button>
      <Button
        onclick={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting || fields.selectedCourseIds.size === 0}
      >
        {$t('audience.assign.submit')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
