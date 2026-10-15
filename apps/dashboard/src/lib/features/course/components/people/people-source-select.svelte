<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { t } from '$lib/utils/functions/translations';
  import { ALL_SOURCES_FILTER, getPeopleSourceFilterGroup } from '$features/course/utils/people-source-utils';

  // TODO(#1226): interim control. Once the roster filter popover lands, the same options come from
  // `getPeopleSourceFilterGroup` inside it and this component is deleted (see people-source-utils.ts).

  interface Props {
    value?: string;
    onValueChange?: (value: string) => void;
  }

  let { value = $bindable(ALL_SOURCES_FILTER), onValueChange }: Props = $props();

  const options = $derived([
    { label: $t('course.navItem.people.source_filter_all'), value: ALL_SOURCES_FILTER },
    ...getPeopleSourceFilterGroup($t).options.map((option) => ({ label: option.label, value: option.patch.source }))
  ]);

  const selectedLabel = $derived(options.find((option) => option.value === value)?.label);
</script>

<Select.Root type="single" name="source" bind:value {onValueChange}>
  <Select.Trigger class="max-w-[130px]">
    {selectedLabel}
  </Select.Trigger>
  <Select.Content>
    <Select.Group>
      {#each options as option (option.value)}
        <Select.Item value={option.value} label={option.label} disabled={option.value === value}>
          {option.label}
        </Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>
