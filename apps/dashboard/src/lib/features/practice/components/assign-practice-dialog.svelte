<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { CheckboxField } from '@cio/ui/custom/checkbox-field';
  import { InputField } from '@cio/ui/custom/input-field';
  import { NumberField } from '@cio/ui/custom/number-field';
  import { PRACTICE_MAX_QUESTIONS } from '@cio/utils/validation/practice';

  import { practiceApi } from '$features/practice/api';
  import type { CreatedPractice, PracticeSource, PracticeStudent } from '$features/practice/utils';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    open?: boolean;
    courseId: string;
    students: PracticeStudent[];
    source: PracticeSource;
    defaultTitle: string;
    onCreated?: (practice: CreatedPractice) => void;
  }

  let { open = $bindable(false), courseId, students, source, defaultTitle, onCreated }: Props = $props();

  const selectedIds = new SvelteSet<string>();
  let title = $state('');
  let count = $state<number | null>(5);

  $effect(() => {
    if (!open) return;

    selectedIds.clear();
    for (const student of students) selectedIds.add(student.profileId);
    title = defaultTitle;
    count = 5;
  });

  function toggle(profileId: string) {
    if (selectedIds.has(profileId)) selectedIds.delete(profileId);
    else selectedIds.add(profileId);
  }

  async function handleSubmit() {
    const created = await practiceApi.create(courseId, {
      ...source,
      profileIds: [...selectedIds],
      count: count ?? 5,
      title: title.trim() || undefined
    });
    if (!created) return;

    snackbar.success(t.get('practice.snackbar.assigned', { count: created.assignedCount }));
    open = false;
    onCreated?.(created);
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-lg" data-testid="assign-practice-dialog">
    <Dialog.Header>
      <Dialog.Title>{$t('practice.dialog.title')}</Dialog.Title>
      <Dialog.Description>{$t('practice.dialog.description')}</Dialog.Description>
    </Dialog.Header>

    <Field.Group>
      <Field.Field>
        <InputField label={$t('practice.dialog.name')} bind:value={title} testId="practice-title" />
      </Field.Field>

      <Field.Field>
        <NumberField
          bind:value={count}
          min={1}
          max={PRACTICE_MAX_QUESTIONS}
          step={1}
          label={$t('practice.dialog.count')}
          testId="practice-count"
        />
      </Field.Field>

      <Field.Set>
        <Field.Legend>{$t('practice.dialog.students', { count: selectedIds.size })}</Field.Legend>
        <div class="max-h-56 overflow-y-auto">
          {#each students as student (student.profileId)}
            <CheckboxField
              label={student.name}
              checked={selectedIds.has(student.profileId)}
              onclick={() => toggle(student.profileId)}
              testId="practice-student"
            />
          {/each}
        </div>
      </Field.Set>
    </Field.Group>

    <Dialog.Footer>
      <Button size="sm" variant="outline" onclick={() => (open = false)}>{$t('practice.dialog.cancel')}</Button>
      <Button
        size="sm"
        onclick={handleSubmit}
        loading={practiceApi.isLoading}
        disabled={selectedIds.size === 0}
        testId="practice-submit"
      >
        {$t('practice.dialog.submit')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
