<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { t } from '$lib/utils/functions/translations';

  import type { InsightsScopeCourse } from '../utils/types';

  interface Props {
    courses: InsightsScopeCourse[];
    value: string | null;
    onChange: (courseId: string | null) => void;
  }

  let { courses, value, onChange }: Props = $props();

  const ALL_COURSES = 'all';

  const selectedValue = $derived(value ?? ALL_COURSES);
  const selectedLabel = $derived(
    value ? (courses.find((course) => course.id === value)?.title ?? '') : $t('insights.all_courses')
  );

  function handleChange(next: string) {
    onChange(next === ALL_COURSES ? null : next);
  }
</script>

<Select.Root type="single" value={selectedValue} onValueChange={handleChange}>
  <Select.Trigger
    class="w-full sm:w-[260px]"
    aria-label={$t('insights.course_picker')}
    data-testid="insights-course-picker"
  >
    <span class="truncate">{selectedLabel}</span>
  </Select.Trigger>
  <Select.Content>
    <Select.Item value={ALL_COURSES} label={$t('insights.all_courses')}>{$t('insights.all_courses')}</Select.Item>
    {#each courses as course (course.id)}
      <Select.Item value={course.id} label={course.title}>{course.title}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
