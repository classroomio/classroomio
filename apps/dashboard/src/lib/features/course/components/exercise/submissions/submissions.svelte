<script lang="ts">
  import * as Tabs from '@cio/ui/base/tabs';
  import { Empty } from '@cio/ui/custom/empty';
  import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
  import Summary from './summary.svelte';
  import Individual from './individual.svelte';
  import { submissions } from './store';
  import { t } from '$lib/utils/functions/translations';
  import type { ExerciseSubmissions } from './types';
  import type { SubmissionListItem } from '$features/course/utils/types';

  interface Props {
    exerciseId: string;
    submissions: SubmissionListItem[];
  }

  let { exerciseId = $bindable(''), submissions: submissionsData }: Props = $props();

  type SubmissionTab = 'summary' | 'individual';
  let currentTab = $state<SubmissionTab>('summary');

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
      <Individual isLoading={false} />
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
