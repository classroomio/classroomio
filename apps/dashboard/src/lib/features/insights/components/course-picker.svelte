<script lang="ts">
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import { Button } from '@cio/ui/base/button';
  import * as Command from '@cio/ui/base/command';
  import { Label } from '@cio/ui/base/label';
  import * as Popover from '@cio/ui/base/popover';
  import * as Select from '@cio/ui/base/select';
  import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
  import { t } from '$lib/utils/functions/translations';

  import type { InsightsScopeCourse } from '../utils/types';

  interface Props {
    courses: InsightsScopeCourse[];
    value: string | null;
    onChange: (courseId: string | null) => void;
  }

  let { courses, value, onChange }: Props = $props();

  const ALL_COURSES = 'all';
  const triggerId = $props.id();

  let isOpen = $state(false);

  const selectedValue = $derived(value ?? ALL_COURSES);
  const selectedLabel = $derived(
    value ? (courses.find((course) => course.id === value)?.title ?? '') : $t('insights.all_courses')
  );

  function handleChange(next: string) {
    onChange(next === ALL_COURSES ? null : next);
  }

  function choose(courseId: string | null) {
    isOpen = false;
    onChange(courseId);
  }
</script>

<div class="flex flex-wrap items-center gap-2">
  <Label for={triggerId} class="text-sm font-medium">{$t('insights.course_picker')}</Label>
  {#if courses.length >= INSIGHTS_LIMITS.coursePickerSearchFrom}
    <Popover.Root bind:open={isOpen}>
      <Popover.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            id={triggerId}
            variant="outline"
            class="w-full justify-between sm:w-[280px]"
            data-testid="insights-course-picker"
          >
            <span class="truncate">{selectedLabel}</span>
            <ChevronsUpDownIcon class="size-4 opacity-50" />
          </Button>
        {/snippet}
      </Popover.Trigger>
      <Popover.Content class="w-[320px] p-0" align="start">
        <Command.Root>
          <Command.Input placeholder={$t('insights.course_search')} />
          <Command.List>
            <Command.Empty>{$t('insights.course_search_empty')}</Command.Empty>
            <Command.Item value={`${$t('insights.all_courses')} __all`} onSelect={() => choose(null)}>
              {$t('insights.all_courses')}
            </Command.Item>
            {#each courses as course (course.id)}
              <Command.Item value={`${course.title} ${course.id}`} onSelect={() => choose(course.id)}>
                {course.title}
              </Command.Item>
            {/each}
          </Command.List>
        </Command.Root>
      </Popover.Content>
    </Popover.Root>
  {:else}
    <Select.Root type="single" value={selectedValue} onValueChange={handleChange}>
      <Select.Trigger id={triggerId} class="w-full sm:w-[280px]" data-testid="insights-course-picker">
        <span class="truncate">{selectedLabel}</span>
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={ALL_COURSES} label={$t('insights.all_courses')}>{$t('insights.all_courses')}</Select.Item>
        {#each courses as course (course.id)}
          <Select.Item value={course.id} label={course.title}>{course.title}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  {/if}
</div>
