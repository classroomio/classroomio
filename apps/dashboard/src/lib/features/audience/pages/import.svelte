<script lang="ts">
  import { MultiSelectList } from '@cio/ui';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { Label } from '@cio/ui/base/label';
  import { t } from '$lib/utils/functions/translations';
  import { orgApi } from '$features/org/api/org.svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { SvelteSet } from 'svelte/reactivity';

  interface Course {
    id: string;
    title: string;
  }

  interface Cohort {
    id: string;
    name: string;
  }

  interface Props {
    courses: Course[];
    cohorts: Cohort[];
  }

  let { courses, cohorts }: Props = $props();

  let recipientCsv = $state('');
  let courseAccessMode = $state('none');
  let cohortAccessMode = $state('none');
  let selectedCourseIds = new SvelteSet<string>();
  let selectedCohortIds = new SvelteSet<string>();
  let sendEmail = $state(true);
  let isSubmitting = $state(false);

  function toggleCourse(courseId: string) {
    if (selectedCourseIds.has(courseId)) {
      selectedCourseIds.delete(courseId);
    } else {
      selectedCourseIds.add(courseId);
    }
  }

  function toggleCohort(cohortId: string) {
    if (selectedCohortIds.has(cohortId)) {
      selectedCohortIds.delete(cohortId);
    } else {
      selectedCohortIds.add(cohortId);
    }
  }

  const audiencePath = $derived(page.url.pathname.replace(/\/import$/, ''));

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (!recipientCsv.trim()) {
      snackbar.error('audience.import.snackbar_no_emails');
      return;
    }

    isSubmitting = true;

    try {
      const result = await orgApi.importAudienceMembers({
        recipientCsv,
        allCourses: courseAccessMode === 'all',
        allCohorts: cohortAccessMode === 'all',
        courseIds: courseAccessMode === 'select' ? [...selectedCourseIds] : undefined,
        cohortIds: cohortAccessMode === 'select' ? [...selectedCohortIds] : undefined,
        sendEmail
      });

      if (result) {
        await goto(resolve(audiencePath, {}));
      }
    } catch {
      snackbar.error('audience.import.snackbar_failed');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<form id="import-audience-form" class="space-y-6" onsubmit={handleSubmit}>
  <p class="ui:text-muted-foreground text-sm">{$t('audience.import.description')}</p>

  <TextareaField
    label={$t('audience.import.emails_label')}
    bind:value={recipientCsv}
    rows={6}
    className="w-full"
    placeholder={$t('audience.import.emails_placeholder')}
  />

  <div class="space-y-3">
    <Label class="text-sm font-medium">{$t('audience.import.course_access')}</Label>
    <RadioGroup.Root bind:value={courseAccessMode} class="space-y-2">
      <div class="flex items-center gap-2">
        <RadioGroup.Item value="none" id="course-none" />
        <Label for="course-none" class="font-normal">{$t('audience.import.no_courses')}</Label>
      </div>
      <div class="flex items-center gap-2">
        <RadioGroup.Item value="all" id="course-all" />
        <Label for="course-all" class="font-normal">{$t('audience.import.all_courses')}</Label>
      </div>
      <div class="flex items-center gap-2">
        <RadioGroup.Item value="select" id="course-select" />
        <Label for="course-select" class="font-normal">{$t('audience.import.select_courses')}</Label>
      </div>
    </RadioGroup.Root>

    {#if courseAccessMode === 'select'}
      <MultiSelectList
        class="ml-6"
        listClass="max-h-40"
        heading={$t('audience.assign.select_courses')}
        emptyMessage={$t('audience.import.select_courses_placeholder')}
        items={courses.map((c) => ({ id: c.id, label: c.title || c.id }))}
        isSelected={(id) => selectedCourseIds.has(id)}
        onToggle={toggleCourse}
        namePrefix="import-course"
      />
    {/if}
  </div>

  <div class="space-y-3">
    <Label class="text-sm font-medium">{$t('audience.import.cohort_access')}</Label>
    <RadioGroup.Root bind:value={cohortAccessMode} class="space-y-2">
      <div class="flex items-center gap-2">
        <RadioGroup.Item value="none" id="cohort-none" />
        <Label for="cohort-none" class="font-normal">{$t('audience.import.no_cohorts')}</Label>
      </div>
      <div class="flex items-center gap-2">
        <RadioGroup.Item value="all" id="cohort-all" />
        <Label for="cohort-all" class="font-normal">{$t('audience.import.all_cohorts')}</Label>
      </div>
      <div class="flex items-center gap-2">
        <RadioGroup.Item value="select" id="cohort-select" />
        <Label for="cohort-select" class="font-normal">{$t('audience.import.select_cohorts')}</Label>
      </div>
    </RadioGroup.Root>

    {#if cohortAccessMode === 'select'}
      <MultiSelectList
        class="ml-6"
        listClass="max-h-40"
        heading={$t('audience.import.select_cohorts')}
        emptyMessage={$t('audience.import.select_cohorts_placeholder')}
        items={cohorts.map((p) => ({ id: p.id, label: p.name || p.id }))}
        isSelected={(id) => selectedCohortIds.has(id)}
        onToggle={toggleCohort}
        namePrefix="import-cohort"
      />
    {/if}
  </div>

  <!-- <CheckboxField name="send-email" label={$t('audience.import.send_email')} bind:checked={sendEmail} /> -->
</form>
