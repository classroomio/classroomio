<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Badge } from '@cio/ui/base/badge';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { peopleApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import { ROLE } from '@cio/utils/constants';
  import type { CourseMember } from '$features/course/utils/types';
  import { getMemberAvatarUrl } from '$features/course/utils/people-utils';
  import { lessonVideoCheckpointStore } from './checkpoint-store.svelte';
  import type { LessonVideoCheckpoint, LessonVideoCheckpointAnswer } from './checkpoint-types';
  import { formatCheckpointAnswerSummary, formatCheckpointTimestamp } from './checkpoint-utils';

  interface Props {
    open: boolean;
    courseId: string;
    checkpoint: LessonVideoCheckpoint;
    onOpenChange: (open: boolean) => void;
  }

  type ResponseRow = {
    profileId: string;
    displayName: string;
    avatarUrl: string;
    answer: LessonVideoCheckpointAnswer | null;
  };

  let { open, courseId, checkpoint, onOpenChange }: Props = $props();

  let students = $state<CourseMember[]>([]);
  let isLoadingStudents = $state(false);

  const answers = $derived(lessonVideoCheckpointStore.answersForCheckpoint(checkpoint.id));

  const rows = $derived.by((): ResponseRow[] => {
    const answerByProfile = new Map(answers.map((answer) => [answer.profileId, answer]));
    const listedIds: Record<string, true> = {};
    const nextRows: ResponseRow[] = [];

    for (const member of students) {
      const profileId = member.profileId;
      if (!profileId) continue;

      listedIds[profileId] = true;
      nextRows.push({
        profileId,
        displayName:
          member.profile?.fullname || t.get('course.navItem.lessons.materials.tabs.video.checkpoints.unnamed_student'),
        avatarUrl: getMemberAvatarUrl(member),
        answer: answerByProfile.get(profileId) ?? null
      });
    }

    for (const answer of answers) {
      if (listedIds[answer.profileId]) continue;

      nextRows.push({
        profileId: answer.profileId,
        displayName: answer.displayName,
        avatarUrl: answer.avatarUrl,
        answer
      });
    }

    return nextRows;
  });

  const answeredCount = $derived(rows.filter((row) => row.answer).length);
  const correctCount = $derived(rows.filter((row) => row.answer?.isCorrect).length);

  async function loadStudents() {
    isLoadingStudents = true;

    try {
      const response = await peopleApi.list(courseId, {
        page: 1,
        limit: 100,
        roleId: ROLE.STUDENT
      });
      students = response?.data ?? [];
    } catch (error) {
      console.error('loadStudents error:', error);
      students = [];
    } finally {
      isLoadingStudents = false;
    }
  }

  onMount(() => {
    void loadStudents();
  });
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.materials.tabs.video.checkpoints.responses_title')}</Dialog.Title>
      <Dialog.Description>
        {$t('course.navItem.lessons.materials.tabs.video.checkpoints.responses_description', {
          time: formatCheckpointTimestamp(checkpoint.timestampSeconds),
          prompt: checkpoint.question.title
        })}
      </Dialog.Description>
    </Dialog.Header>

    <p class="ui:text-muted-foreground text-sm">
      {$t('course.navItem.lessons.materials.tabs.video.checkpoints.responses_summary', {
        answered: answeredCount,
        total: rows.length,
        correct: correctCount
      })}
    </p>
    <p class="ui:text-muted-foreground text-sm">
      {$t('course.navItem.lessons.materials.tabs.video.checkpoints.responses_formative')}
    </p>

    <div class="min-h-0 flex-1 overflow-y-auto">
      {#if isLoadingStudents && rows.length === 0}
        <p class="ui:text-muted-foreground py-6 text-sm">
          {$t('course.navItem.lessons.materials.tabs.video.checkpoints.responses_loading')}
        </p>
      {:else if rows.length === 0}
        <p class="ui:text-muted-foreground py-6 text-sm">
          {$t('course.navItem.lessons.materials.tabs.video.checkpoints.responses_empty')}
        </p>
      {:else}
        <ul class="divide-border divide-y">
          {#each rows as row (row.profileId)}
            <li class="flex items-start gap-3 py-3">
              <UserAvatar src={row.avatarUrl} alt={row.displayName} class="ui:size-8" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm font-medium">{row.displayName}</p>
                  {#if row.answer}
                    <Badge variant="secondary">
                      {row.answer.isCorrect
                        ? $t('course.navItem.lessons.materials.tabs.video.checkpoints.responses_correct')
                        : $t('course.navItem.lessons.materials.tabs.video.checkpoints.responses_answered')}
                    </Badge>
                  {:else}
                    <Badge variant="outline">
                      {$t('course.navItem.lessons.materials.tabs.video.checkpoints.responses_waiting')}
                    </Badge>
                  {/if}
                </div>
                {#if row.answer}
                  <p class="ui:text-muted-foreground mt-1 text-sm">
                    {formatCheckpointAnswerSummary(checkpoint.question, row.answer.answerData)}
                  </p>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <Dialog.Footer>
      <Button type="button" variant="outline" onclick={() => onOpenChange(false)}>
        {$t('course.navItem.lessons.materials.tabs.video.checkpoints.close')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
