<script lang="ts">
  import { MultiSelectList } from '@cio/ui';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import * as FileDropZone from '@cio/ui/custom/file-drop-zone';
  import type { FileRejectedReason } from '@cio/ui/custom/file-drop-zone';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import * as Field from '@cio/ui/base/field';
  import * as Table from '@cio/ui/base/table';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Label } from '@cio/ui/base/label';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import {
    AUDIENCE_IMPORT_ACCEPT,
    AUDIENCE_IMPORT_MAX_FILE_BYTES,
    AUDIENCE_IMPORT_MAX_ROWS,
    AUDIENCE_IMPORT_TEMPLATE,
    type ParsedImportRow,
    parseAudienceImportCsv
  } from '@cio/utils/validation/organization';
  import { t } from '$lib/utils/functions/translations';
  import type { ImportControls } from '$features/audience/utils/types';
  import { orgApi } from '$features/org/api/org.svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { SvelteSet } from 'svelte/reactivity';
  import {
    IMPORT_ROW_STATUS_LABEL,
    downloadImportErrorRows,
    downloadImportTemplate,
    summariseImportRows
  } from '$features/audience/utils/audience-import-utils';
  import type { AudienceImportResultRows } from '$features/org/utils/types';

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
    /**
     * Reported upward so the route can put the step's actions in the page
     * header, where every other page keeps them. The route owns `Page.Header`,
     * and this component is rendered through `Page.Body`, so the state has to
     * travel rather than the buttons.
     */
    controls?: ImportControls | null;
  }

  let { courses, cohorts, controls = $bindable(null) }: Props = $props();

  type Step = 'upload' | 'preview' | 'result';

  let step = $state<Step>('upload');
  let recipientCsv = $state('');
  let sourceName = $state<string | null>(null);
  let parsedRows = $state<ParsedImportRow[]>([]);
  let truncated = $state(0);
  let unknownColumns = $state<string[]>([]);
  let resultRows = $state<AudienceImportResultRows>([]);
  let importedCount = $state(0);

  let courseAccessMode = $state('none');
  let cohortAccessMode = $state('none');
  let selectedCourseIds = new SvelteSet<string>();
  let selectedCohortIds = new SvelteSet<string>();
  let sendEmail = $state(true);
  let isSubmitting = $state(false);

  const summary = $derived(summariseImportRows(parsedRows));
  const audiencePath = $derived(page.url.pathname.replace(/\/import$/, ''));

  function toggleCourse(courseId: string) {
    if (selectedCourseIds.has(courseId)) selectedCourseIds.delete(courseId);
    else selectedCourseIds.add(courseId);
  }

  function toggleCohort(cohortId: string) {
    if (selectedCohortIds.has(cohortId)) selectedCohortIds.delete(cohortId);
    else selectedCohortIds.add(cohortId);
  }

  function parseInto(text: string, name: string | null) {
    const parsed = parseAudienceImportCsv(text);

    if (parsed.rows.length === 0) {
      snackbar.error('audience.import.snackbar_no_emails');
      return;
    }

    recipientCsv = text;
    sourceName = name;
    parsedRows = parsed.rows;
    truncated = parsed.truncated;
    unknownColumns = parsed.unknownColumns;
    step = 'preview';
  }

  async function handleFileUpload(files: File[]) {
    const file = files[0];
    if (!file) return;

    parseInto(await file.text(), file.name);
  }

  function handleFileRejected({ reason }: { reason: FileRejectedReason; file: File }) {
    snackbar.error(reason);
  }

  function handlePasteContinue() {
    if (!recipientCsv.trim()) {
      snackbar.error('audience.import.snackbar_no_emails');
      return;
    }

    parseInto(recipientCsv, null);
  }

  async function handleSubmit() {
    isSubmitting = true;

    try {
      // Only the rows the preview marked importable are sent; the server
      // re-checks and can still reject individually.
      const recipients = parsedRows
        .filter((row) => row.status === 'ready')
        .map((row) => ({ email: row.email, name: row.name, courses: row.courses }));

      const result = await orgApi.importAudienceMembers({
        recipients,
        allCourses: courseAccessMode === 'all',
        allCohorts: cohortAccessMode === 'all',
        courseIds: courseAccessMode === 'select' ? [...selectedCourseIds] : undefined,
        cohortIds: cohortAccessMode === 'select' ? [...selectedCohortIds] : undefined,
        sendEmail
      });

      if (!result) return;

      resultRows = result.data.rows ?? [];
      importedCount = result.data.imported ?? 0;
      step = 'result';
    } finally {
      isSubmitting = false;
    }
  }

  function startOver() {
    step = 'upload';
    recipientCsv = '';
    sourceName = null;
    parsedRows = [];
    truncated = 0;
    unknownColumns = [];
    resultRows = [];
    importedCount = 0;
  }

  // Writes only; nothing here reads `controls`, so this cannot loop.
  $effect(() => {
    controls = {
      step,
      readyCount: summary.ready,
      isSubmitting,
      submit: handleSubmit,
      startOver
    };
  });
</script>

{#if step === 'upload'}
  <div class="space-y-6 pb-10">
    <p class="ui:text-muted-foreground text-sm">{$t('audience.import.description')}</p>

    <FileDropZone.Root
      accept={AUDIENCE_IMPORT_ACCEPT}
      maxFiles={1}
      fileCount={0}
      maxFileSize={AUDIENCE_IMPORT_MAX_FILE_BYTES}
      onUpload={handleFileUpload}
      onFileRejected={handleFileRejected}
    >
      <FileDropZone.Trigger
        class="ui:hover:bg-muted/40 flex w-full cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed px-6 py-10 text-center transition-colors"
      >
        <UploadIcon class="ui:text-muted-foreground size-6" />
        <span class="text-sm font-medium">{$t('audience.import.drop_csv')}</span>
        <span class="ui:text-muted-foreground text-xs">
          {$t('audience.import.csv_hint', { rows: AUDIENCE_IMPORT_MAX_ROWS })}
        </span>
      </FileDropZone.Trigger>
    </FileDropZone.Root>

    <Button variant="link" class="h-auto p-0" onclick={() => downloadImportTemplate(AUDIENCE_IMPORT_TEMPLATE)}>
      {$t('audience.import.download_template')}
    </Button>

    <Field.Separator />

    <Field.Field>
      <Field.Label for="import-paste">{$t('audience.import.emails_label')}</Field.Label>
      <TextareaField
        label=""
        bind:value={recipientCsv}
        rows={6}
        className="w-full"
        placeholder={$t('audience.import.emails_placeholder')}
      />
      <Field.Description>{$t('audience.import.paste_hint')}</Field.Description>
    </Field.Field>

    <Button onclick={handlePasteContinue} disabled={!recipientCsv.trim()}>
      {$t('audience.import.review')}
    </Button>
  </div>
{:else if step === 'preview'}
  <div class="space-y-6 pb-10">
    <div class="flex flex-wrap items-center gap-2">
      {#if sourceName}
        <span class="text-sm font-medium">{sourceName}</span>
      {/if}
      <Badge variant="secondary">{$t('audience.import.count_ready', { count: summary.ready })}</Badge>
      {#if summary.alreadyListed > 0}
        <Badge variant="outline">{$t('audience.import.count_duplicate', { count: summary.alreadyListed })}</Badge>
      {/if}
      {#if summary.invalid > 0}
        <!-- Outlined amber, not destructive: these rows are skipped, not
             errors, and the file still imports without them. -->
        <Badge variant="outline" class="ui:border-amber-600 ui:text-amber-600">
          {$t('audience.import.count_invalid', { count: summary.invalid })}
        </Badge>
      {/if}
    </div>

    {#if truncated > 0}
      <p class="ui:text-destructive text-sm">
        {$t('audience.import.truncated', { count: truncated, rows: AUDIENCE_IMPORT_MAX_ROWS })}
      </p>
    {/if}

    {#if unknownColumns.length > 0}
      <p class="ui:text-muted-foreground text-sm">
        {$t('audience.import.unknown_columns', { columns: unknownColumns.join(', ') })}
      </p>
    {/if}

    <div class="max-h-80 overflow-auto rounded-md border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{$t('audience.email')}</Table.Head>
            <Table.Head>{$t('audience.name')}</Table.Head>
            <Table.Head>{$t('audience.status')}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each parsedRows as row (`${row.line}-${row.email}`)}
            <Table.Row class={row.status === 'ready' ? undefined : 'ui:text-muted-foreground'}>
              <Table.Cell>{row.email || '—'}</Table.Cell>
              <Table.Cell>{row.name ?? '—'}</Table.Cell>
              <Table.Cell>
                <Badge variant={row.status === 'ready' ? 'secondary' : 'outline'}>
                  {$t(IMPORT_ROW_STATUS_LABEL[row.status])}
                </Badge>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>

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
  </div>
{:else}
  <div class="space-y-6 pb-10">
    <p class="text-sm font-medium">{$t('audience.import.result_heading', { count: importedCount })}</p>

    <div class="max-h-80 overflow-auto rounded-md border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{$t('audience.email')}</Table.Head>
            <Table.Head>{$t('audience.status')}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each resultRows as row (row.email)}
            <Table.Row class={row.status === 'ready' ? undefined : 'ui:text-muted-foreground'}>
              <Table.Cell>{row.email}</Table.Cell>
              <Table.Cell>
                <Badge variant={row.status === 'ready' ? 'secondary' : 'outline'}>
                  {$t(IMPORT_ROW_STATUS_LABEL[row.status])}
                </Badge>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>

    <div class="flex items-center gap-2">
      {#if resultRows.some((row) => row.status !== 'ready')}
        <Button variant="outline" onclick={() => downloadImportErrorRows(resultRows)}>
          {$t('audience.import.download_errors')}
        </Button>
      {/if}
      <Button onclick={() => goto(resolve(audiencePath, {}))}>
        {$t('audience.import.done')}
      </Button>
    </div>
  </div>
{/if}
