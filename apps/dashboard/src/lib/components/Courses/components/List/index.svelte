<script lang="ts">
  import {
    StructuredListRow,
    StructuredListCell,
    Tag,
    OverflowMenuItem,
    OverflowMenu
  } from 'carbon-components-svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { goto } from '$app/navigation';
  import { t } from '$lib/utils/functions/translations';
  import { globalStore } from '$lib/utils/store/app';

  export let id = '';
  export let title = '';
  export let type = '';
  export let description = '';
  export let isPublished = false;
  export let totalLessons = 0;
  export let totalStudents = 0;
  export let isExplore = false;
  export let isLMS = false;
  export let isLearningPath = false;
  export let slug = '';

  function handleCloneCourse(e) {
    e.stopPropagation();
    // TODO: Clone course functionality
    alert('WIP: Clone course');
  }

  function handleShareCourse(e) {
    e.stopPropagation();
    // TODO: Share course functionality
    alert('WIP: Share course');
  }

  function handleInvite(e) {
    e.stopPropagation();
    // TODO: Invite functionality
    alert('WIP: Invite people to course');
  }

  function handleDeleteCourse(e) {
    e.stopPropagation();
    // TODO: Delete course functionality
    alert('WIP: Delete course');
  }

  function getCourseUrl() {
    if (isLMS && isLearningPath) {
      return goto(isExplore ? `/pathway/${slug}` : `/pathways/${id}`);
    }

    return goto(
      isExplore ? `/course/${slug}` : `/courses/${id}${isLMS ? '/lessons?next=true' : ''}`
    );
  }
</script>

<StructuredListRow label for="row-{id}" on:click={getCourseUrl}>
  <StructuredListCell><p class="font-semibold">{title}</p></StructuredListCell>
  <StructuredListCell>
    <p class="line-clamp-2">{description}</p>
  </StructuredListCell>
  {#if !$isMobile}
    <StructuredListCell>{type}</StructuredListCell>
    {#if !$globalStore.isOrgSite}
      <StructuredListCell>{totalLessons}</StructuredListCell>
    {/if}
    <StructuredListCell>{totalStudents}</StructuredListCell>
    <StructuredListCell>
      <Tag class="break-normal" type={isPublished ? 'green' : 'cool-gray'}>
        {#if isPublished}
          {$t('courses.course_card.published')}
        {:else}
          {$t('courses.course_card.unpublished')}
        {/if}
      </Tag>
    </StructuredListCell>
  {/if}
  <StructuredListCell>
    <OverflowMenu
      id="course-list"
      flipped
      on:click={(e) => {
        e.stopPropagation();
      }}
    >
      <OverflowMenuItem
        text={$t('courses.course_card.context_menu.clone')}
        on:click={handleCloneCourse}
      />
      <OverflowMenuItem
        text={$t('courses.course_card.context_menu.share')}
        on:click={handleShareCourse}
      />
      <OverflowMenuItem
        text={$t('courses.course_card.context_menu.invite')}
        on:click={handleInvite}
      />
      <OverflowMenuItem
        danger
        text={$t('courses.course_card.context_menu.delete')}
        on:click={handleDeleteCourse}
      />
    </OverflowMenu>
  </StructuredListCell>
</StructuredListRow>
