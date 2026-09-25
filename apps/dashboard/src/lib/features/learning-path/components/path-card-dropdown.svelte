<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import PathContextMenuContent from './path-context-menu-content.svelte';

  interface Props {
    id: string;
    publicId: string;
    slug?: string | null;
    name: string;
    description?: string;
    isPublished?: boolean;
    onDelete?: (id: string, name: string) => void;
  }

  let { id, publicId, slug = null, name, description = '', isPublished = false, onDelete }: Props = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class="absolute top-6 right-6 z-40 flex items-center justify-center opacity-0 transition-all delay-150 duration-200 ease-in-out group-hover:opacity-100 data-[state=open]:opacity-100"
    onclick={(e) => {
      e.stopPropagation();
      e.preventDefault();
    }}
  >
    <IconButton variant="outline">
      <EllipsisVerticalIcon size={16} />
    </IconButton>
  </DropdownMenu.Trigger>

  <DropdownMenu.Content align="end">
    <PathContextMenuContent {id} {publicId} {slug} {name} {description} {isPublished} {onDelete} includeOpen={false} />
  </DropdownMenu.Content>
</DropdownMenu.Root>
