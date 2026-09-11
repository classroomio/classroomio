<script lang="ts">
  import { widgetApi } from '../api/widget.svelte';
  import type { WidgetListItem } from '../utils/types';
  import { Button } from '@cio/ui/base/button';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import ArchiveIcon from '@lucide/svelte/icons/archive';
  import PanelsTopLeftIcon from '@lucide/svelte/icons/panels-top-left';
  import WidgetList from '../components/widget-list.svelte';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    initialWidgets?: WidgetListItem[];
    initialArchivedWidgets?: WidgetListItem[];
    onCreate: () => void | Promise<void>;
  }

  let {
    initialWidgets = [] as WidgetListItem[],
    initialArchivedWidgets = [] as WidgetListItem[],
    onCreate
  }: Props = $props();

  let currentTab = $state('active');

  $effect(() => {
    widgetApi.widgets = initialWidgets;
    widgetApi.archivedWidgets = initialArchivedWidgets;
  });

  const tabs = $derived([
    {
      value: 'active',
      label: `${$t('widgets.tabs.active')} (${widgetApi.widgets.length})`
    },
    {
      value: 'archived',
      label: `${$t('widgets.tabs.archived')} (${widgetApi.archivedWidgets.length})`
    }
  ]);
</script>

<UnderlineTabs.Root bind:value={currentTab}>
  <UnderlineTabs.List class="mb-6">
    {#each tabs as tab (tab.value)}
      <UnderlineTabs.Trigger value={tab.value}>
        {tab.label}
      </UnderlineTabs.Trigger>
    {/each}
  </UnderlineTabs.List>

  <UnderlineTabs.Content value="active">
    <WidgetList
      widgets={widgetApi.widgets}
      mode="active"
      emptyTitle={$t('widgets.empty.heading')}
      emptyDescription={$t('widgets.empty.description')}
      emptyIcon={PanelsTopLeftIcon}
    >
      {#snippet emptyAction()}
        <Button onclick={onCreate}>{$t('widgets.actions.create')}</Button>
      {/snippet}
    </WidgetList>
  </UnderlineTabs.Content>

  <UnderlineTabs.Content value="archived">
    <WidgetList
      widgets={widgetApi.archivedWidgets}
      mode="archived"
      emptyTitle={$t('widgets.archived.empty')}
      emptyDescription={$t('widgets.archived.empty_description')}
      emptyIcon={ArchiveIcon}
    />
  </UnderlineTabs.Content>
</UnderlineTabs.Root>
