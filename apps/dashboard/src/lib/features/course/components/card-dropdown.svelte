<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import CourseContextMenuContent from './course-context-menu-content.svelte';

  interface Props {
    id: string;
    title: string;
    description: string;
    isPublished?: boolean;
    courseType?: string | null;
    slug?: string;
    /** Compact menu for LMS course cards */
    lmsPublicQuickOnly?: boolean;
  }

  let {
    id,
    title,
    description,
    isPublished = false,
    courseType = null,
    slug = '',
    lmsPublicQuickOnly = false
  }: Props = $props();

  const showPublicCourseLinks = $derived(isPublished && courseType === 'PUBLIC' && slug.trim().length > 0);
</script>

{#if lmsPublicQuickOnly ? showPublicCourseLinks : true}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class="ui:data-[state=open]:opacity-100 absolute top-6 right-6 z-40 flex items-center justify-center opacity-0 transition-all delay-150 duration-200 ease-in-out group-hover:opacity-100"
      onclick={(e) => e.stopPropagation()}
    >
      <IconButton variant="outline">
        <EllipsisVerticalIcon size={16} />
      </IconButton>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      <CourseContextMenuContent {id} {title} {description} {isPublished} {courseType} {slug} {lmsPublicQuickOnly} />
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
