<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Select from '@cio/ui/base/select';
  import { Search } from '@cio/ui/custom/search';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    hasSelection: boolean;
    selectedCount: number;
    searchValue?: string;
    sortValue: string;
    onSortChange: (value: string) => void;
    onOpenAssign: () => void;
  }

  let {
    hasSelection,
    selectedCount,
    searchValue = $bindable(''),
    sortValue,
    onSortChange,
    onOpenAssign
  }: Props = $props();

  const sortOptions = [
    { label: t.get('audience.sort.newest'), value: 'createdAt:desc' },
    { label: t.get('audience.sort.oldest'), value: 'createdAt:asc' },
    { label: t.get('audience.sort.name_asc'), value: 'name:asc' },
    { label: t.get('audience.sort.name_desc'), value: 'name:desc' },
    { label: t.get('audience.sort.email_asc'), value: 'email:asc' },
    { label: t.get('audience.sort.email_desc'), value: 'email:desc' }
  ];
</script>

<Page.BodyHeader>
  {#if hasSelection}
    <div class="flex items-center gap-3 rounded-md border px-4 py-2">
      <span class="ui:text-muted-foreground text-sm">
        {$t('audience.selected_count', { count: selectedCount })}
      </span>
      <Button variant="secondary" size="sm" onclick={onOpenAssign}>
        {$t('audience.assign_courses')}
      </Button>
    </div>
  {:else}
    <div class="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <Search placeholder={$t('audience.search_placeholder')} bind:value={searchValue} class="w-full md:max-w-sm" />
      <Select.Root type="single" value={sortValue} onValueChange={onSortChange} name="audience-sort">
        <Select.Trigger class="w-full md:w-[220px]">
          {sortOptions.find((option) => option.value === sortValue)?.label ?? $t('audience.sort.label')}
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            {#each sortOptions as option (option.value)}
              <Select.Item value={option.value} label={option.label} disabled={option.value === sortValue}>
                {option.label}
              </Select.Item>
            {/each}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </div>
  {/if}
</Page.BodyHeader>
