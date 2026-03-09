<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { copyCourseModal, deleteCourseModal } from '$features/course/utils/store';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { t } from '$lib/utils/functions/translations';

  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  interface Props {
    id: string;
    title: string;
    description: string;
  }

  let { id, title, description }: Props = $props();

  function redirect(url: string) {
    goto(resolve(url, {}));
  }

  function handleShareCourse() {
    redirect(`/courses/${id}/settings#share`);
  }

  function handleInvite() {
    redirect(`/courses/${id}/people?add=true`);
  }

  function handleDeleteCourse() {
    $deleteCourseModal.open = true;
    $deleteCourseModal.id = id;
    $deleteCourseModal.title = title;
  }

  function handleCloneCourse() {
    $copyCourseModal.open = true;
    $copyCourseModal.id = id;
    $copyCourseModal.title = title;
    $copyCourseModal.description = description;
  }
</script>

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
