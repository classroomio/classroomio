<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';

  import { t } from '$lib/utils/functions/translations';

  interface Props {
    html: string;
    isLoading?: boolean;
  }

  let { html, isLoading = false }: Props = $props();
</script>

<div class="space-y-2">
  <h3 class="text-sm font-semibold">{$t('settings.email_templates.preview.heading')}</h3>

  {#if isLoading}
    <div class="flex h-[560px] items-center justify-center rounded-md border">
      <Spinner class="size-5!" />
    </div>
  {:else if html}
    <div class="rounded-md border bg-white">
      <iframe
        title={$t('settings.email_templates.preview.iframe_title')}
        srcdoc={html}
        class="h-[560px] w-full rounded-md border-0"
      ></iframe>
    </div>
  {:else}
    <div class="ui:text-muted-foreground rounded-md border border-dashed p-6 text-sm">
      {$t('settings.email_templates.preview.empty_state')}
    </div>
  {/if}
</div>
