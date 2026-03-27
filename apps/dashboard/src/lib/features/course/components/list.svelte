<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import * as Table from '@cio/ui/base/table';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';

  import { isMobileStore } from '@cio/ui/hooks/is-mobile.svelte';
  import { t } from '$lib/utils/functions/translations';
  import CoursePublishBadge from './course-publish-badge.svelte';
  import CourseTagsOverflow from './course-tags-overflow.svelte';

  interface Props {
    id?: string;
    title?: string;
    type?: string;
    description?: string;
    isPublished?: boolean;
    totalLessons?: number;
    totalStudents?: number;
    tags?: Array<{
      id: string;
      name: string;
      slug: string;
      color?: string | null;
    }>;
  }

  let {
    id = '',
    title = '',
    type = '',
    description = '',
    isPublished = false,
    totalLessons = 0,
    totalStudents = 0,
    tags = []
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

<Table.Row class="cursor-pointer" onclick={() => goto(resolve(`/courses/[id]`, { id }))}>
  <Table.Cell class="truncate"><p class="font-semibold">{title}</p></Table.Cell>
  <Table.Cell class="truncate">
    <p>{description}</p>
  </Table.Cell>
  {#if !isMobileStore.current}
    <Table.Cell class="truncate">{type}</Table.Cell>
    <Table.Cell class="w-3/12 min-w-0">
      {#if tags.length === 0}
        <span class="ui:text-muted-foreground text-2xs">-</span>
      {:else}
        <CourseTagsOverflow {tags} variant="table" />
      {/if}
    </Table.Cell>
    <Table.Cell>{totalLessons}</Table.Cell>
    <Table.Cell>{totalStudents}</Table.Cell>
    <Table.Cell>
      <CoursePublishBadge {isPublished} />
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
