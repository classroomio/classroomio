<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { Button } from '@cio/ui/base/button';
  import { CheckboxField } from '@cio/ui/custom/checkbox-field';
  import { Search } from '@cio/ui/custom/search';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { orgApi } from '$features/org/api/org.svelte';
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
  const selectedProfileIds = new SvelteSet<string>();
  let sendEmail = $state(true);
  let isSubmitting = $state(false);

  const filteredStudents = $derived.by(() => {
    const query = searchValue.trim().toLowerCase();
    const sortedStudents = [...students].sort((a, b) =>
      (a.name || a.email || '').localeCompare(b.name || b.email || '', undefined, { sensitivity: 'base' })
    );

    if (!query) {
      return sortedStudents;
    }

    return sortedStudents.filter((student) => {
      const name = student.name?.toLowerCase() || '';
      const email = student.email?.toLowerCase() || '';
      return name.includes(query) || email.includes(query);
    });
  });

  const selectedCount = $derived(selectedProfileIds.size);

  function toggleStudent(profileId: string) {
    if (selectedProfileIds.has(profileId)) {
      selectedProfileIds.delete(profileId);
    } else {
      selectedProfileIds.add(profileId);
    }
  }

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

<div class="rounded-md border p-4">
  <div class="space-y-1">
    <p class="text-base font-semibold">{$t('course.navItem.people.invite_modal.existing_students_title')}</p>
    <p class="ui:text-muted-foreground text-sm">
      {$t('course.navItem.people.invite_modal.existing_students_description')}
    </p>
  </div>

  <div class="mt-4 space-y-4">
    <Search placeholder={$t('course.navItem.people.invite_modal.existing_students_search')} bind:value={searchValue} />

    {#if selectedCount > 0}
      <p class="ui:text-muted-foreground text-sm">{$t('audience.selected_count', { count: selectedCount })}</p>
    {/if}

    <div class="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3">
      {#if isLoading}
        <p class="ui:text-muted-foreground text-sm">
          {$t('course.navItem.people.invite_modal.loading_existing_students')}
        </p>
      {:else if students.length === 0}
        <p class="ui:text-muted-foreground text-sm">{$t('course.navItem.people.invite_modal.no_existing_students')}</p>
      {:else if filteredStudents.length === 0}
        <p class="ui:text-muted-foreground text-sm">
          {$t('course.navItem.people.invite_modal.no_matching_existing_students')}
        </p>
      {:else}
        {#each filteredStudents as student (student.profileId)}
          <div
            class="ui:hover:bg-muted/40 rounded-md px-2 py-1"
            role="button"
            tabindex="0"
            onclick={() => student.profileId && toggleStudent(student.profileId)}
            onkeydown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (student.profileId) toggleStudent(student.profileId);
              }
            }}
          >
            <CheckboxField
              name={`existing-student-${student.profileId}`}
              label={student.name || student.email}
              checked={student.profileId ? selectedProfileIds.has(student.profileId) : false}
            >
              <span class="ui:text-muted-foreground text-sm">{student.email}</span>
            </CheckboxField>
          </div>
        {/each}
      {/if}
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
