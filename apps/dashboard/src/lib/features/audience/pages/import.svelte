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

  interface Program {
    id: string;
    name: string;
  }

  interface Props {
    courses: Course[];
    programs: Program[];
  }

  let { courses, programs }: Props = $props();

  let recipientCsv = $state('');
  let courseAccessMode = $state('none');
  let programAccessMode = $state('none');
  let selectedCourseIds = new SvelteSet<string>();
  let selectedProgramIds = new SvelteSet<string>();
  let sendEmail = $state(true);
  let isSubmitting = $state(false);

  function toggleCourse(courseId: string) {
    if (selectedCourseIds.has(courseId)) {
      selectedCourseIds.delete(courseId);
    } else {
      selectedCourseIds.add(courseId);
    }
  }

  function toggleProgram(programId: string) {
    if (selectedProgramIds.has(programId)) {
      selectedProgramIds.delete(programId);
    } else {
      selectedProgramIds.add(programId);
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
        allPrograms: programAccessMode === 'all',
        courseIds: courseAccessMode === 'select' ? [...selectedCourseIds] : undefined,
        programIds: programAccessMode === 'select' ? [...selectedProgramIds] : undefined,
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

  {#if programs.length > 0}
    <div class="space-y-3">
      <Label class="text-sm font-medium">{$t('audience.import.program_access')}</Label>
      <RadioGroup.Root bind:value={programAccessMode} class="space-y-2">
        <div class="flex items-center gap-2">
          <RadioGroup.Item value="none" id="program-none" />
          <Label for="program-none" class="font-normal">{$t('audience.import.no_programs')}</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroup.Item value="all" id="program-all" />
          <Label for="program-all" class="font-normal">{$t('audience.import.all_programs')}</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroup.Item value="select" id="program-select" />
          <Label for="program-select" class="font-normal">{$t('audience.import.select_programs')}</Label>
        </div>
      </RadioGroup.Root>

      {#if programAccessMode === 'select'}
        <MultiSelectList
          class="ml-6"
          listClass="max-h-40"
          heading={$t('audience.import.select_programs')}
          emptyMessage={$t('audience.import.select_programs_placeholder')}
          items={programs.map((p) => ({ id: p.id, label: p.name || p.id }))}
          isSelected={(id) => selectedProgramIds.has(id)}
          onToggle={toggleProgram}
          namePrefix="import-program"
        />
      {/if}
    </div>
  {/if}

  <!-- <CheckboxField name="send-email" label={$t('audience.import.send_email')} bind:checked={sendEmail} /> -->
</form>
