<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { peopleApi } from '$features/course/api/people.svelte';
  import type { UserCourseAnalytics } from '$features/course/utils/types';

  let {
    open = $bindable(false),
    courseId,
    memberId,
    studentName,
    userCourseAnalytics,
    onSuccess = () => {}
  }: {
    open?: boolean;
    courseId: string;
    memberId: string;
    studentName: string;
    userCourseAnalytics: UserCourseAnalytics;
    onSuccess?: () => void | Promise<void>;
  } = $props();

  const progressImpact = $derived(userCourseAnalytics.progressImpact);

  const impactBullets = $derived.by(() => {
    if (!progressImpact) {
      return [];
    }

    return [
      {
        key: 'lessons',
        text: t.get('course.navItem.people.reset_progress.dialog.bullets.lessons', {
          completed: progressImpact.completedLessons,
          total: progressImpact.totalLessons
        })
      },
      {
        key: 'exercises',
        text: t.get('course.navItem.people.reset_progress.dialog.bullets.exercises', {
          count: progressImpact.exerciseSubmissions
        })
      },
      {
        key: 'comments',
        text: t.get('course.navItem.people.reset_progress.dialog.bullets.comments', {
          count: progressImpact.lessonComments
        })
      },
      {
        key: 'community',
        text: t.get('course.navItem.people.reset_progress.dialog.bullets.community', {
          count: progressImpact.newsfeedAndCommunityPosts
        })
      },
      {
        key: 'video_progress',
        text: t.get('course.navItem.people.reset_progress.dialog.bullets.video_progress', {
          count: progressImpact.videoProgressLessons
        })
      },
      {
        key: 'attendance',
        text: t.get('course.navItem.people.reset_progress.dialog.bullets.attendance', {
          count: progressImpact.attendanceEntries
        })
      },
      {
        key: 'certificate',
        text: t.get(
          progressImpact.hasCertificationRecords
            ? 'course.navItem.people.reset_progress.dialog.bullets.certificate_yes'
            : 'course.navItem.people.reset_progress.dialog.bullets.certificate_no'
        )
      }
    ];
  });

  async function handleReset() {
    if (!courseId || !memberId) {
      return;
    }

    await peopleApi.resetCourseProgress(courseId, memberId);

    if (peopleApi.success) {
      open = false;
      await onSuccess();
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>
        {$t('course.navItem.people.reset_progress.dialog.title', { studentName })}
      </Dialog.Title>
      <Dialog.Description>
        {$t('course.navItem.people.reset_progress.dialog.intro')}
      </Dialog.Description>
    </Dialog.Header>

    <ul class="list-disc space-y-2 pl-5 text-sm">
      {#each impactBullets as bullet (bullet.key)}
        <li>{bullet.text}</li>
      {/each}
    </ul>

    <p class="ui:text-destructive mt-4 text-sm">
      {$t('course.navItem.people.reset_progress.dialog.warning')}
    </p>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)} disabled={peopleApi.isLoading}>
        {$t('course.navItem.people.reset_progress.dialog.cancel')}
      </Button>
      <Button variant="destructive" onclick={handleReset} loading={peopleApi.isLoading} disabled={peopleApi.isLoading}>
        {$t('course.navItem.people.reset_progress.dialog.confirm')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
