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

  export let id;
  export let title;
  export let description;
  export let isPublished;
  export let totalCourse;
  export let totalStudents;

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
</script>

<StructuredListRow label for="row-{id}" on:click={() => goto(`/pathway/${id}`)}>
  <StructuredListCell><p class="font-semibold">{title}</p></StructuredListCell>
  <StructuredListCell>
    <p class="line-clamp-2">{description}</p>
  </StructuredListCell>
  {#if !$isMobile}
    <StructuredListCell>{totalCourse}</StructuredListCell>
    <StructuredListCell>{totalStudents}</StructuredListCell>
    <StructuredListCell>
      <Tag class="break-normal" type={isPublished ? 'green' : 'cool-gray'}>
        {#if isPublished}
          {$t('pathway.pathway_card.published')}
        {:else}
          {$t('pathway.pathway_card.unpublished')}
        {/if}
      </Tag>
    </StructuredListCell>
  {/if}
  <StructuredListCell>
    <OverflowMenu
      id="pathway-list"
      flipped
      on:click={(e) => {
        e.stopPropagation();
      }}
    >
      <OverflowMenuItem
        text={$t('pathway.pathway_card.context_menu.clone')}
        on:click={handleCloneCourse}
      />
      <OverflowMenuItem
        text={$t('pathway.pathway_card.context_menu.share')}
        on:click={handleShareCourse}
      />
      <OverflowMenuItem
        text={$t('pathway.pathway_card.context_menu.invite')}
        on:click={handleInvite}
      />
      <OverflowMenuItem
        danger
        text={$t('pathway.pathway_card.context_menu.delete')}
        on:click={handleDeleteCourse}
      />
    </OverflowMenu>
  </StructuredListCell>
</StructuredListRow>
