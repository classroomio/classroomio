<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    onRemove: () => void;
  }

  let { onRemove }: Props = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class="ui:data-[state=open]:opacity-100 absolute top-2 right-2 z-40 flex items-center justify-center opacity-0 transition-all delay-150 duration-200 ease-in-out group-hover:opacity-100"
    onclick={(e) => e.stopPropagation()}
  >
    <IconButton variant="outline">
      <EllipsisVerticalIcon size={16} />
    </IconButton>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item class="ui:text-red-600" onclick={onRemove}>
      {$t('course.navItem.lessons.materials.tabs.document.remove_document')}
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
