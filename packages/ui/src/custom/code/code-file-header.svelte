<script lang="ts">
  import { cn } from '../../tools';
  import FileCodeIcon from '@lucide/svelte/icons/file-code';
  import FileBracesIcon from '@lucide/svelte/icons/file-braces';
  import FileTextIcon from '@lucide/svelte/icons/file-text';

  type Props = {
    filename: string;
    class?: string;
    /** Optional: override the icon (e.g. a custom Svelte component). Default: derived from extension. */
    icon?: import('svelte').Component;
  };

  let { filename, class: className, icon: IconSlot }: Props = $props();

  const iconMap: Record<string, import('svelte').Component> = {
    '.json': FileBracesIcon,
    '.ts': FileCodeIcon,
    '.tsx': FileCodeIcon,
    '.js': FileCodeIcon,
    '.jsx': FileCodeIcon,
    '.mjs': FileCodeIcon,
    '.cjs': FileCodeIcon,
    '.svelte': FileCodeIcon,
    '.bash': FileCodeIcon,
    '.sh': FileCodeIcon,
    '.diff': FileCodeIcon
  };

  const ext = $derived(filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '');
  const Icon = $derived(IconSlot ?? iconMap[ext] ?? FileTextIcon);
</script>

<div
  id="file-name"
  class={cn('ui:flex ui:h-9 ui:items-center ui:justify-between ui:border-b ui:border-border ui:px-6', className)}
  role="presentation"
>
  <div class="ui:flex ui:items-center ui:gap-2">
    <Icon class="ui:size-4" />
    <span class="ui:text-sm ui:font-medium">{filename}</span>
  </div>
</div>
