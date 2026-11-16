<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { page } from '$app/state';
  import { courseApi } from '$features/course/api';
  import { sidePanel } from '$features/side-panel';
  import { isStudentExperience } from '$lib/utils/store/app';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { courseCommentsApi } from '../api/course-comments.svelte';
  import { commentsPanel } from '../store/comments-panel.svelte';
  import { isCourseCommentViewer } from '../utils/anchor-utils';
  import { COURSE_COMMENTS_PANEL_ID, COURSE_COMMENTS_THREAD_QUERY_PARAM } from '../utils/constants';
  import { openLinkedThread } from '../utils/navigation';

  const courseId = $derived(courseApi.course?.id);
  const courseRoleId = $derived.by(() => {
    const member = courseApi.group.people.find((person) => person.profileId === $profile.id);

    return member ? Number(member.roleId) : null;
  });
  const isViewer = $derived(
    isCourseCommentViewer({ isStudentExperience: $isStudentExperience, isOrgAdmin: $isOrgAdmin, courseRoleId })
  );
  const linkedThreadId = $derived(page.url.searchParams.get(COURSE_COMMENTS_THREAD_QUERY_PARAM));

  let loadedCourseId = '';
  let handledThreadId = '';

  function closeCommentsPanel() {
    if (sidePanel.activePanelId === COURSE_COMMENTS_PANEL_ID) sidePanel.close();
  }

  $effect(() => {
    const currentCourseId = courseId;
    const canView = isViewer;

    untrack(() => {
      if (!currentCourseId || !canView) {
        if (!loadedCourseId) return;

        loadedCourseId = '';
        courseCommentsApi.clear();
        commentsPanel.reset();
        closeCommentsPanel();
        return;
      }

      if (currentCourseId === loadedCourseId) return;

      loadedCourseId = currentCourseId;
      handledThreadId = '';
      commentsPanel.reset();
      void courseCommentsApi.load(currentCourseId);
    });
  });

  $effect(() => {
    const threadId = linkedThreadId;
    const currentCourseId = courseId;
    const isLoaded = courseCommentsApi.threads !== null && courseCommentsApi.isReadyFor(currentCourseId);
    if (!threadId || !currentCourseId || !isLoaded || threadId === handledThreadId) return;

    handledThreadId = threadId;
    void openLinkedThread(currentCourseId, threadId);
  });

  onDestroy(() => {
    courseCommentsApi.clear();
    commentsPanel.reset();
    closeCommentsPanel();
  });
</script>
