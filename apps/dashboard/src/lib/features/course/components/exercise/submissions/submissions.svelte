<script lang="ts">
  import * as Tabs from '@cio/ui/base/tabs';
  import { Empty } from '@cio/ui/custom/empty';
  import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
  import Summary from './summary.svelte';
  import Individual from './individual.svelte';
  import { submissions } from './store';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { onMount, untrack } from 'svelte';
  import { t } from '$lib/utils/functions/translations';
  import type { ExerciseSubmissions } from './types';
  import type { SubmissionListItem } from '$features/course/utils/types';
  import { groupSubmissionsByStudentAndAttempt } from '$features/course/utils/exercise-progression-utils';

  interface Props {
    exerciseId: string;
    submissions: SubmissionListItem[];
    enrolledStudentKeys?: string[];
  }

  let { exerciseId = $bindable(''), submissions: submissionsData, enrolledStudentKeys = [] }: Props = $props();

  type SubmissionTab = 'summary' | 'individual';

  function normalizeSubmissionTab(tabParam: string | null): SubmissionTab {
    if (tabParam === 'individual') {
      return 'individual';
    }

    return 'summary';
  }

  let currentTab = $state<SubmissionTab>('summary');
  const submissionGroups = $derived(groupSubmissionsByStudentAndAttempt(submissionsData));

  onMount(() => {
    currentTab = normalizeSubmissionTab(page.url.searchParams.get('submission'));
  });

  // URL -> state: hydrate when the submission param changes externally.
  $effect(() => {
    const nextTab = normalizeSubmissionTab(page.url.searchParams.get('submission'));
    if (nextTab === untrack(() => currentTab)) return;
    currentTab = nextTab;
  });

  // state -> URL: keep ?submission= in sync without self-navigating.
  $effect(() => {
    const currentSubmission = page.url.searchParams.get('submission') ?? '';
    if (currentSubmission === currentTab) return;

    untrack(() => {
      const url = new URL(page.url);
      url.searchParams.set('submission', currentTab);

      if (currentTab !== 'individual') {
        url.searchParams.delete('student');
      }

      goto(resolve(`${url.pathname}${url.search}`, {}), {
        replaceState: true,
        keepFocus: true,
        noScroll: true
      });
    });
  });

  function normalizeSubmissions(items: SubmissionListItem[]): ExerciseSubmissions[] {
    return items.map(
      (submission): ExerciseSubmissions => ({
        id: submission.id,
        statusId: submission.statusId ?? 1,
        groupmember: submission.groupmember?.profile
          ? {
              profile: {
                id: submission.groupmember.profile.id ?? '',
                fullname: submission.groupmember.profile.fullname ?? '',
                avatarUrl: submission.groupmember.profile.avatarUrl ?? ''
              }
            }
          : null,
        answers: (submission.answers || []).map((answer) => ({
          id: answer.id,
          questionId: answer.questionId,
          answerData: answer.answerData,
          point: answer.point ?? 0,
          submissionId: answer.submissionId ?? submission.id,
          groupMemberId: answer.groupMemberId ?? ''
        }))
      })
    );
  }

  $effect(() => {
    submissions.set(normalizeSubmissions(submissionsData));
  });
</script>

{#if $submissions.length > 0}
  <Tabs.Root bind:value={currentTab} class="w-full">
    <Tabs.List class="grid w-full max-w-sm grid-cols-2">
      <Tabs.Trigger value="summary">
        {$t('course.navItem.lessons.exercises.all_exercises.analytics.summary.heading')}
      </Tabs.Trigger>
      <Tabs.Trigger value="individual">
        {$t('course.navItem.lessons.exercises.all_exercises.analytics.individual.heading')}
      </Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="summary" class="pt-2">
      <Summary isLoading={false} />
    </Tabs.Content>

    <Tabs.Content value="individual" class="pt-2">
      <Individual isLoading={false} {submissionGroups} {enrolledStudentKeys} />
    </Tabs.Content>
  </Tabs.Root>
{:else}
  <Empty
    title={$t('course.navItem.lessons.exercises.all_exercises.analytics.empty_title')}
    description={$t('course.navItem.lessons.exercises.all_exercises.analytics.empty_description')}
    icon={ClipboardListIcon}
    variant="page"
  />
{/if}
