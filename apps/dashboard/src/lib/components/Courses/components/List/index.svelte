<script lang="ts">
  import {
    StructuredList,
    StructuredListHead,
    StructuredListRow,
    StructuredListCell,
    StructuredListBody,
    StructuredListInput,
    Tag,
    ContextMenuOption,
    ContextMenu,
    ContextMenuDivider
  } from 'carbon-components-svelte';
  import { CopyFile, OverflowMenuVertical, Share, UserFollow } from 'carbon-icons-svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { goto } from '$app/navigation';

  export let id = '';
  export let slug = '';
  export let title = '';
  export let description = '';
  export let isPublished = false;
  export let totalLessons = 0;
  export let totalStudents = 0;
  export let isOnLandingPage = false;
  export let isLMS = false;
  export let showContextMenu = false;
  let target: any;

  function handleCloneCourse() {
    // TODO: Clone course functionality
    alert('WIP: Clone course');
  }

  function handleShareCourse() {
    // TODO: Share course functionality
    alert('WIP: Share course');
  }

  function handleInvite() {
    // TODO: Invite functionality
    alert('WIP: Invite people to course');
  }

  function handleDeleteCourse() {
    // TODO: Delete course functionality
    alert('WIP: Delete course');
  }
</script>

{#if showContextMenu}
  <ContextMenu {target}>
    <ContextMenuOption indented labelText="Clone" icon={CopyFile} on:click={handleCloneCourse} />
    <ContextMenuOption indented labelText="Share" icon={Share} on:click={handleShareCourse} />
    <ContextMenuOption indented labelText="Invite" icon={UserFollow} on:click={handleInvite} />
    <ContextMenuDivider />
    <ContextMenuOption kind="danger" labelText="Delete" on:click={handleDeleteCourse} />
  </ContextMenu>
{/if}
<StructuredListRow
  label
  for="row-{id}"
  on:click={() =>
    goto(
      `${
        isOnLandingPage ? `/course/${slug}` : `/courses/${id}${isLMS ? '/lessons?next=true' : ''}`
      }`
    )}
>
  <StructuredListCell><p class="font-semibold">{title}</p></StructuredListCell>
  <StructuredListCell>
    <p class="line-clamp-2">{description}</p>
  </StructuredListCell>
  {#if !$isMobile}
    <StructuredListCell>{totalLessons}</StructuredListCell>
    <StructuredListCell>{totalStudents}</StructuredListCell>
    <StructuredListCell>
      <Tag type={isPublished ? 'green' : 'cool-gray'}>
        {#if isPublished}
          Published
        {:else}
          Unpublished
        {/if}
      </Tag>
    </StructuredListCell>
  {/if}
  <StructuredListCell>
    <IconButton onClick={() => (showContextMenu = true)}>
      <OverflowMenuVertical size={24} />
    </IconButton>
  </StructuredListCell>
</StructuredListRow>
