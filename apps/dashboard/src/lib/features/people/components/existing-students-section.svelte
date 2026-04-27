<script lang="ts">
  import { onDestroy } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { Button } from '@cio/ui/base/button';
  import { CheckboxField } from '@cio/ui/custom/checkbox-field';
  import { MultiSelectList } from '@cio/ui/custom/multi-select-list';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { OrgStudent } from '../utils/types';

  interface Props {
    students: OrgStudent[];
    isLoading?: boolean;
    onSearchValueChange: (value: string) => void | Promise<void>;
    onAssign: (profileIds: string[], sendEmail: boolean) => void | Promise<void>;
    headingKey?: string;
    emptyMatchingKey?: string;
    emptyDefaultKey?: string;
    searchPlaceholderKey?: string;
    notifyLabelKey?: string;
    submitKey?: string;
    selectAtLeastOneKey?: string;
  }

  let {
    students,
    isLoading = false,
    onSearchValueChange,
    onAssign,
    headingKey = 'course.navItem.people.invite_modal.existing_students_title',
    emptyMatchingKey = 'course.navItem.people.invite_modal.no_matching_existing_students',
    emptyDefaultKey = 'course.navItem.people.invite_modal.no_existing_students',
    searchPlaceholderKey = 'course.navItem.people.invite_modal.existing_students_search',
    notifyLabelKey = 'course.navItem.people.invite_modal.notify_existing_students',
    submitKey = 'course.navItem.people.invite_modal.grant_access',
    selectAtLeastOneKey = 'course.navItem.people.invite_modal.select_at_least_one_student'
  }: Props = $props();

  let searchValue = $state('');
  let sendEmail = $state(true);
  let isSubmitting = $state(false);
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  const SEARCH_DEBOUNCE_MS = 350;

  const selectedProfileIds = new SvelteSet<string>();
  const sortedStudents = $derived.by(() =>
    [...students].sort((a, b) =>
      (a.name || a.email || '').localeCompare(b.name || b.email || '', undefined, { sensitivity: 'base' })
    )
  );
  const selectedCount = $derived(selectedProfileIds.size);
  const emptyMessage = $derived(searchValue.trim() ? $t(emptyMatchingKey) : $t(emptyDefaultKey));
  const multiSelectItems = $derived(
    sortedStudents
      .filter((student): student is OrgStudent & { profileId: string } => Boolean(student.profileId))
      .map((student) => ({
        id: student.profileId,
        label: student.name || student.email,
        description: student.email
      }))
  );

  function toggleStudent(profileId: string) {
    if (selectedProfileIds.has(profileId)) {
      selectedProfileIds.delete(profileId);
      return;
    }

    selectedProfileIds.add(profileId);
  }

  function handleSearch(value: string) {
    searchValue = value;

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!value.trim()) {
      void onSearchValueChange(value);
      return;
    }

    searchTimeout = setTimeout(() => {
      void onSearchValueChange(value);
    }, SEARCH_DEBOUNCE_MS);
  }

  async function assignStudents() {
    if (selectedProfileIds.size === 0) {
      snackbar.error(selectAtLeastOneKey);
      return;
    }

    isSubmitting = true;

    try {
      await onAssign([...selectedProfileIds], sendEmail);
      selectedProfileIds.clear();
      searchValue = '';
    } finally {
      isSubmitting = false;
    }
  }

  onDestroy(() => {
    if (!searchTimeout) {
      return;
    }

    clearTimeout(searchTimeout);
  });
</script>

<div class="space-y-2">
  <div class="max-h-72 overflow-y-auto">
    <MultiSelectList
      class="border-0"
      {emptyMessage}
      items={multiSelectItems}
      {isLoading}
      isSelected={(id) => selectedProfileIds.has(id)}
      onSearchValueChange={handleSearch}
      onToggle={(id) => toggleStudent(id)}
      namePrefix="existing-student"
      listClass="max-h-60"
      searchPlaceholder={$t(searchPlaceholderKey)}
      bind:searchValue
    >
      {#snippet headingSnippet()}
        <p class="ui:text-sm ui:font-medium">
          {$t(headingKey)} ({multiSelectItems.length})
          {#if selectedCount > 0}
            <span class="ui:text-muted-foreground text-xs"
              >{$t('audience.selected_count', { count: selectedCount })}</span
            >
          {/if}
        </p>
      {/snippet}
    </MultiSelectList>
  </div>

  <CheckboxField name="notify-existing-students" label={$t(notifyLabelKey)} bind:checked={sendEmail} />

  <Button variant="secondary" onclick={assignStudents} loading={isSubmitting} disabled={isLoading || isSubmitting}>
    {$t(submitKey)}
  </Button>
</div>
