<script lang="ts">
  import * as Accordion from '@cio/ui/base/accordion';
  import { ZAPIER_ACTIONS, ZAPIER_SEARCHES, ZAPIER_TRIGGERS } from '@cio/utils/constants/zapier';

  import { flattenZapierSampleData, getZapierExampleData } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  const T = 'automation.zapier.recipes';

  function getTriggerSampleRows(eventType: Parameters<typeof getZapierExampleData>[0]) {
    return flattenZapierSampleData(getZapierExampleData(eventType));
  }
</script>

<Accordion.Root
  type="multiple"
  class="ui:border-border ui:bg-card overflow-hidden rounded-2xl border"
  data-testid="zapier-capability-reference"
>
  <Accordion.Item value="triggers" class="ui:border-border px-4">
    <Accordion.Trigger class="py-3 text-sm font-semibold">
      {$t(`${T}.reference_triggers`, { count: ZAPIER_TRIGGERS.length })}
    </Accordion.Trigger>
    <Accordion.Content>
      <ul class="flex flex-col gap-3 pb-4">
        {#each ZAPIER_TRIGGERS as trigger (trigger.key)}
          <li class="space-y-1">
            <p class="text-[13.5px] font-medium">{$t(`automation.zapier.catalog_triggers.${trigger.key}.label`)}</p>
            <p class="ui:text-muted-foreground text-xs leading-relaxed">
              {$t(`automation.zapier.catalog_triggers.${trigger.key}.description`)}
            </p>
            <dl
              class="ui:bg-muted/40 ui:border-border mt-1.5 grid gap-1 rounded-md border p-2 text-[11px] sm:grid-cols-2"
            >
              {#each getTriggerSampleRows(trigger.eventType) as row, index (index)}
                <div class="flex min-w-0 gap-1.5">
                  <dt class="ui:text-muted-foreground shrink-0">{row.label}:</dt>
                  <dd class="truncate font-medium">{row.value}</dd>
                </div>
              {/each}
            </dl>
          </li>
        {/each}
      </ul>
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item value="actions" class="ui:border-border px-4">
    <Accordion.Trigger class="py-3 text-sm font-semibold">
      {$t(`${T}.reference_actions`, { count: ZAPIER_ACTIONS.length })}
    </Accordion.Trigger>
    <Accordion.Content>
      <ul class="flex flex-col gap-3 pb-4">
        {#each ZAPIER_ACTIONS as action (action.key)}
          <li class="space-y-1">
            <p class="text-[13.5px] font-medium">{$t(`automation.zapier.catalog_actions.${action.key}.label`)}</p>
            <p class="ui:text-muted-foreground text-xs leading-relaxed">
              {$t(`automation.zapier.catalog_actions.${action.key}.description`)}
            </p>
          </li>
        {/each}
      </ul>
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item value="searches" class="ui:border-border px-4">
    <Accordion.Trigger class="py-3 text-sm font-semibold">
      {$t(`${T}.reference_searches`, { count: ZAPIER_SEARCHES.length })}
    </Accordion.Trigger>
    <Accordion.Content>
      <ul class="flex flex-col gap-3 pb-4">
        {#each ZAPIER_SEARCHES as search (search.key)}
          <li class="space-y-1">
            <p class="text-[13.5px] font-medium">{$t(`automation.zapier.catalog_searches.${search.key}.label`)}</p>
            <p class="ui:text-muted-foreground text-xs leading-relaxed">
              {$t(`automation.zapier.catalog_searches.${search.key}.description`)}
            </p>
          </li>
        {/each}
      </ul>
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
