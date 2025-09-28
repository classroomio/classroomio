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

  export let id: string = '';
  export let title: string = '';
  export let description: string = '';
  export let isPublished: boolean = false;
  export let totalCourse: number = 0;
  export let totalStudents: number = 0;

  function handleClonePathway(e) {
    e.stopPropagation();
    // TODO: Clone Pathway functionality
    alert('WIP: Clone Pathway');
  }
  function handleSharePathway(e) {
    e.stopPropagation();
    // TODO: Share Pathway functionality
    alert('WIP: Share Pathway');
  }
  function handleInvite(e) {
    e.stopPropagation();
    // TODO: Invite functionality
    alert('WIP: Invite people to Pathway');
  }
  function handleDeletePathway(e) {
    e.stopPropagation();
    // TODO: Delete Pathway functionality
    alert('WIP: Delete Pathway');
  }
</script>

<StructuredListRow label for="row-{id}" on:click={() => goto(`/pathways/${id}`)}>
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
        on:click={handleClonePathway}
      />
      <OverflowMenuItem
        text={$t('pathway.pathway_card.context_menu.share')}
        on:click={handleSharePathway}
      />
      <OverflowMenuItem
        text={$t('pathway.pathway_card.context_menu.invite')}
        on:click={handleInvite}
      />
      <OverflowMenuItem
        danger
        text={$t('pathway.pathway_card.context_menu.delete')}
        on:click={handleDeletePathway}
      />
    </OverflowMenu>
  </StructuredListCell>
</StructuredListRow>
