<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Select from '@cio/ui/base/select';
  import * as Page from '@cio/ui/base/page';
  import { Search } from '@cio/ui/custom/search';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { tagApi } from '$features/tag/api';
  import { docsApi } from '../api';
  import MyNotesPage from './my-notes-page.svelte';

  interface Props {
    searchValue?: string;
    selectedTagFilter?: string;
  }

  let { searchValue = $bindable(''), selectedTagFilter = $bindable('all') }: Props = $props();

  const tagFilterOptions = $derived.by(() => {
    const options = [{ value: 'all', label: t.get('docs.tags.filter_all') }];

    for (const group of tagApi.tagGroups) {
      for (const tag of group.tags) {
        options.push({ value: tag.id, label: tag.name });
      }
    }

    return options;
  });

  const activeTagId = $derived(selectedTagFilter === 'all' ? undefined : selectedTagFilter);

  function noteEditorHref(docId: string) {
    return resolve(`${$currentOrgPath}/docs/${docId}`, {});
  }

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) return;

    void tagApi.getTagGroups();
  });
</script>

<div class="flex flex-col gap-4">
  {#if docsApi.usage?.limit !== null && docsApi.usage}
    <p class="ui:text-muted-foreground text-sm">
      {$t('docs.usage.workspace', {
        used: docsApi.usage.used,
        limit: docsApi.usage.limit
      })}
    </p>
  {/if}

  <Page.BodyHeader align="right" class="p-0!">
    <Search placeholder={$t('docs.list.search')} bind:value={searchValue} />
    <Select.Root type="single" bind:value={selectedTagFilter}>
      <Select.Trigger class="w-[220px]">
        {tagFilterOptions.find((option) => option.value === selectedTagFilter)?.label ?? $t('docs.tags.filter_all')}
      </Select.Trigger>
      <Select.Content>
        {#each tagFilterOptions as option (option.value)}
          <Select.Item value={option.value}>{option.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </Page.BodyHeader>

  <MyNotesPage
    showWorkspaceUsage={false}
    noteHref={noteEditorHref}
    tagId={activeTagId}
    showTeamTab={true}
    showSearch={false}
    bind:searchValue
  />
</div>
