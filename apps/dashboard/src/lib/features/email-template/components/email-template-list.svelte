<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';

  import { t } from '$lib/utils/functions/translations';
  import type { TEmailTemplateId, TEmailTemplateLocale } from '@cio/utils/constants';
  import { formatEmailTemplateId, getTemplateOverrideForLocale } from '../utils/email-template-utils';
  import type { EmailTemplateCatalogItem, OrganizationEmailTemplateOverride } from '../utils/types';

  interface Props {
    catalog: EmailTemplateCatalogItem[];
    templates: OrganizationEmailTemplateOverride[];
    selectedEmailId: TEmailTemplateId | null;
    locale: TEmailTemplateLocale;
    onSelect: (emailId: TEmailTemplateId) => void;
  }

  let { catalog, templates, selectedEmailId, locale, onSelect }: Props = $props();

  function getStatus(
    item: EmailTemplateCatalogItem
  ):
    | 'settings.email_templates.status.default'
    | 'settings.email_templates.status.enabled'
    | 'settings.email_templates.status.disabled' {
    const override = getTemplateOverrideForLocale(templates, item.id, locale);
    if (!override) {
      return 'settings.email_templates.status.default';
    }

    return override.isEnabled ? 'settings.email_templates.status.enabled' : 'settings.email_templates.status.disabled';
  }
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <h2 class="text-sm font-semibold">{$t('settings.email_templates.list.heading')}</h2>
    <Badge variant="outline">{locale.toUpperCase()}</Badge>
  </div>

  <div class="max-h-[680px] space-y-1 overflow-y-auto rounded-md border p-2">
    {#each catalog as item (item.id)}
      {@const status = getStatus(item)}
      <Button
        variant={selectedEmailId === item.id ? 'secondary' : 'ghost-default'}
        class="h-auto w-full justify-between px-3 py-2 text-left"
        onclick={() => onSelect(item.id)}
      >
        <div class="flex min-w-0 flex-col gap-1">
          <span class="truncate font-medium">{formatEmailTemplateId(item.id)}</span>
          <div class="flex items-center gap-2">
            <span class="ui:text-muted-foreground text-xs">{$t(status)}</span>
            {#if item.isRequiredTemplate}
              <Badge variant="secondary" class="text-[10px]">
                {$t('settings.email_templates.list.required_badge')}
              </Badge>
            {/if}
          </div>
        </div>
      </Button>
    {/each}
  </div>
</div>
