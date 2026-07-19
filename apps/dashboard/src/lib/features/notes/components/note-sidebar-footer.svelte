<script lang="ts">
  import LayoutTemplateIcon from '@lucide/svelte/icons/layout-template';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { page } from '$app/state';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    templatesHref: string;
    trashHref: string;
    class?: string;
  }

  let { templatesHref, trashHref, class: className = '' }: Props = $props();

  const pathname = $derived(page.url.pathname);

  function footerLinkClass(active: boolean) {
    return cn(
      'mx-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
      active ? 'bg-primary/10 text-foreground font-medium' : 'ui:hover:bg-muted/60 ui:text-muted-foreground'
    );
  }
</script>

<footer class={cn('border-border mt-auto space-y-0.5 border-t px-1 py-2', className)}>
  <a href={templatesHref} class={footerLinkClass(pathname.endsWith('/notes/templates'))}>
    <LayoutTemplateIcon size={16} />
    {$t('notes.sidebar.footer.templates')}
  </a>
  <a href={trashHref} class={footerLinkClass(pathname.endsWith('/notes/trash'))}>
    <Trash2Icon size={16} />
    {$t('notes.sidebar.footer.trash')}
  </a>
</footer>
