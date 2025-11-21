<script lang="ts">
  import { goto } from '$app/navigation';
  import { Badge } from '@cio/ui/base/badge';
  import * as Table from '@cio/ui/base/table';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';

  import { isMobile } from '$lib/utils/store/useMobile';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    id?: string;
    title?: string;
    type?: string;
    description?: string;
    isPublished?: boolean;
    totalLessons?: number;
    totalStudents?: number;
  }

  let {
    id = '',
    title = '',
    type = '',
    description = '',
    isPublished = false,
    totalLessons = 0,
    totalStudents = 0
  }: Props = $props();

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

<Table.Row class="cursor-pointer" onclick={() => goto(`/courses/${id}`)}>
  <Table.Cell class="truncate"><p class="font-semibold">{title}</p></Table.Cell>
  <Table.Cell class="truncate">
    <p>{description}</p>
  </Table.Cell>
  {#if !$isMobile}
    <Table.Cell class="truncate">{type}</Table.Cell>
    <Table.Cell>{totalLessons}</Table.Cell>
    <Table.Cell>{totalStudents}</Table.Cell>
    <Table.Cell>
      <Badge variant={isPublished ? 'default' : 'secondary'}>
        {#if isPublished}
          {$t('courses.course_card.published')}
        {:else}
          {$t('courses.course_card.unpublished')}
        {/if}
      </Badge>
    </Table.Cell>
  {/if}
  <Table.Cell class="text-center">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        class="flex items-center justify-center rounded-md p-1 hover:bg-gray-100"
        onclick={(e) => e.stopPropagation()}
      >
        <EllipsisVerticalIcon size={16} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item onclick={handleCloneCourse}>
          {$t('courses.course_card.context_menu.clone')}
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={handleShareCourse}>
          {$t('courses.course_card.context_menu.share')}
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={handleInvite}>
          {$t('courses.course_card.context_menu.invite')}
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item class="text-red-600" onclick={handleDeleteCourse}>
          {$t('courses.course_card.context_menu.delete')}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Table.Cell>
</Table.Row>
