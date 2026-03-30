<script lang="ts">
  import { onDestroy } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { Button } from '@cio/ui/base/button';
  import { CheckboxField } from '@cio/ui/custom/checkbox-field';
  import { MultiSelectList } from '@cio/ui/custom/multi-select-list';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { orgApi } from '$features/org/api/org.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { DEFAULT_ORG_AUDIENCE_QUERY } from '$features/org/utils/audience-query-utils';
  import { courseApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import type { OrgStudent } from './types';

  interface Props {
    courseId: string;
    students: OrgStudent[];
    isLoading?: boolean;
    onAssigned?: () => void | Promise<void>;
  }

  let { courseId, students, isLoading = false, onAssigned }: Props = $props();

  let searchValue = $state('');
  let isSearching = $state(false);
  let lastSearchValue = $state('');
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  let activeSearchRequestId = $state(0);
  const selectedProfileIds = new SvelteSet<string>();
  let sendEmail = $state(true);
  let isSubmitting = $state(false);
  const SEARCH_DEBOUNCE_MS = 350;

  const sortedStudents = $derived.by(() =>
    [...students].sort((a, b) =>
      (a.name || a.email || '').localeCompare(b.name || b.email || '', undefined, { sensitivity: 'base' })
    )
  );
  const showLoadingState = $derived(isLoading || isSearching);
  const emptyMessage = $derived(
    searchValue.trim()
      ? $t('course.navItem.people.invite_modal.no_matching_existing_students')
      : $t('course.navItem.people.invite_modal.no_existing_students')
  );

  const selectedCount = $derived(selectedProfileIds.size);

  const multiSelectItems = $derived(
    sortedStudents
      .filter((s): s is OrgStudent & { profileId: string } => Boolean(s.profileId))
      .map((s) => ({
        id: s.profileId,
        label: s.name || s.email,
        description: s.email
      }))
  );

  function toggleStudent(profileId: string) {
    if (selectedProfileIds.has(profileId)) {
      selectedProfileIds.delete(profileId);
    } else {
      selectedProfileIds.add(profileId);
    }
  }

  async function searchStudents(value: string) {
    const normalizedValue = value.trim();
    if (normalizedValue === lastSearchValue) {
      return;
    }

    lastSearchValue = normalizedValue;
    const orgId = $currentOrg.id;
    if (!orgId) {
      return;
    }

    const requestId = activeSearchRequestId + 1;
    activeSearchRequestId = requestId;
    isSearching = true;

    try {
      await orgApi.getOrgAudience(
        orgId,
        {
          ...DEFAULT_ORG_AUDIENCE_QUERY,
          search: normalizedValue || undefined
        },
        {
          abortPrevious: true
        }
      );
    } finally {
      if (requestId === activeSearchRequestId) {
        isSearching = false;
      }
    }
  }

  function handleSearchValueChange(value: string) {
    searchValue = value;

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!value.trim()) {
      void searchStudents(value);
      return;
    }

    searchTimeout = setTimeout(() => {
      void searchStudents(value);
    }, SEARCH_DEBOUNCE_MS);
  }

  onDestroy(() => {
    orgApi.cancelAudienceRequest();

    if (!searchTimeout) {
      return;
    }

    clearTimeout(searchTimeout);
  });

  async function assignStudents() {
    if (!courseId) return;

    if (selectedProfileIds.size === 0) {
      snackbar.error('course.navItem.people.invite_modal.select_at_least_one_student');
      return;
    }

    isSubmitting = true;

    try {
      const result = await orgApi.assignAudienceToCourses({
        profileIds: [...selectedProfileIds],
        courseIds: [courseId],
        sendEmail
      });

      if (result) {
        await courseApi.refreshCourse(courseId, $profile.id);
        selectedProfileIds.clear();
        searchValue = '';
        await onAssigned?.();
      }
    } catch (error) {
      console.error('Failed to assign existing students to course', error);
      snackbar.error('audience.assign.snackbar_failed');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="">
  <div class="space-y-2">
    <div class="max-h-72 overflow-y-auto">
      <MultiSelectList
        class="border-0"
        {emptyMessage}
        items={multiSelectItems}
        isLoading={showLoadingState}
        isSelected={(id) => selectedProfileIds.has(id)}
        onSearchValueChange={handleSearchValueChange}
        onToggle={(id) => toggleStudent(id)}
        namePrefix="existing-student"
        listClass="max-h-60"
        searchPlaceholder={$t('course.navItem.people.invite_modal.existing_students_search')}
        bind:searchValue
      >
        {#snippet headingSnippet()}
          <p class="ui:text-sm ui:font-medium">
            {$t('course.navItem.people.invite_modal.existing_students_title')} ({multiSelectItems.length})
            {#if selectedCount > 0}
              <span class="ui:text-muted-foreground text-xs"
                >{$t('audience.selected_count', { count: selectedCount })}</span
              >
            {/if}
          </p>
        {/snippet}
      </MultiSelectList>
    </div>

    <CheckboxField
      name="notify-existing-students"
      label={$t('course.navItem.people.invite_modal.notify_existing_students')}
      bind:checked={sendEmail}
    />

    <div class="flex justify-end">
      <Button variant="secondary" onclick={assignStudents} loading={isSubmitting} disabled={isLoading || isSubmitting}>
        {$t('course.navItem.people.invite_modal.grant_access')}
      </Button>
    </div>
  </div>
</div>
