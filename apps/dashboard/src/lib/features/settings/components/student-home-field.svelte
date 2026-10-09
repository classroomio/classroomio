<script lang="ts">
  import * as Alert from '@cio/ui/base/alert';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Command from '@cio/ui/base/command';
  import * as Field from '@cio/ui/base/field';
  import * as Popover from '@cio/ui/base/popover';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { BookOpen, Check, ChevronsUpDown } from '@lucide/svelte';
  import { t } from '$lib/utils/functions/translations';
  import { studentHomeApi } from '$features/org/api/student-home.svelte';
  import { LMS_DESTINATION_ICONS } from '$features/ui/navigation/lms-navigation';
  import { DebouncedSearch } from '$lib/utils/functions/debounced-search.svelte';
  import type { TStudentHomeDestination } from '@cio/utils/validation/organization';
  import type { StudentHomePageOption, StudentHomeWarning } from '$features/org/utils/student-home-utils';

  interface Props {
    value: TStudentHomeDestination | null;
    pageOptions: StudentHomePageOption[];
    warning: StudentHomeWarning | null;
    error?: string | null;
  }

  let { value = $bindable(null), pageOptions, warning, error }: Props = $props();

  let open = $state(false);
  let query = $state('');

  const selectedCourseId = $derived(value?.type === 'course' ? value.courseId : undefined);
  const courses = $derived(studentHomeApi.courses);
  const selectedPage = $derived(
    value?.type === 'page' ? (pageOptions.find((option) => option.key === value.key) ?? null) : null
  );
  const selectedCourse = $derived(
    selectedCourseId ? (courses?.find((course) => course.id === selectedCourseId) ?? null) : null
  );
  const normalizedQuery = $derived(query.trim().toLowerCase());
  const filteredPages = $derived(pageOptions.filter((option) => option.label.toLowerCase().includes(normalizedQuery)));
  const showSearchEmpty = $derived(
    normalizedQuery.length > 0 && filteredPages.length === 0 && (courses?.length ?? 0) === 0 && !studentHomeApi.loading
  );
  const courseHint = $derived(!selectedCourse ? null : selectedCourse.canSelfEnroll ? 'open' : 'restricted');
  const warningTitle = $derived(selectedPage?.label ?? selectedCourse?.title ?? '');
  const warningDescription = $derived(
    warning === 'unavailable'
      ? t.get('components.settings.customize_lms.student_home.warning_unavailable', {
          destination: warningTitle
        })
      : warning === 'course-missing'
        ? t.get('components.settings.customize_lms.student_home.warning_course_missing')
        : ''
  );

  const search = new DebouncedSearch({
    onApply: (nextSearch) => {
      void studentHomeApi.listCourses({
        search: nextSearch || undefined,
        includeCourseId: selectedCourseId
      });
    }
  });

  $effect(() => {
    search.input(query);
  });

  function handleOpenChange(nextOpen: boolean) {
    open = nextOpen;

    if (!nextOpen && (query !== '' || search.applied !== '')) {
      query = '';
      search.reset();
      void studentHomeApi.listCourses({ includeCourseId: selectedCourseId });
    }
  }

  function selectDestination(next: TStudentHomeDestination | null) {
    value = next;
    open = false;
  }

  function disabledReasonText(reason: StudentHomePageOption['disabledReason']): string {
    return reason === 'plan'
      ? t.get('components.settings.customize_lms.student_home.reason_paid_plan')
      : t.get('components.settings.customize_lms.student_home.reason_disabled_toggle');
  }
</script>

<Popover.Root bind:open onOpenChange={handleOpenChange}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        testId="customize-lms-student-home"
        class="w-full justify-between font-normal"
      >
        <span class="flex min-w-0 items-center gap-2">
          {#if value === null}
            {$t('components.settings.customize_lms.student_home.option_default')}
          {:else if selectedPage}
            {@const Icon = LMS_DESTINATION_ICONS[selectedPage.key]}
            <Icon class="size-4 shrink-0" />
            <span class="truncate">{selectedPage.label}</span>
          {:else if selectedCourse}
            <BookOpen class="size-4 shrink-0" />
            <span class="truncate">{selectedCourse.title}</span>
          {:else}
            <Skeleton class="h-4 w-32" />
          {/if}
        </span>
        <span class="flex shrink-0 items-center gap-2">
          {#if warning}
            <Badge variant="secondary">{$t('components.settings.customize_lms.student_home.unavailable_badge')}</Badge>
          {/if}
          <ChevronsUpDown class="size-4 opacity-50" />
        </span>
      </Button>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content align="start" class="w-(--bits-popover-anchor-width) p-0">
    <Command.Root shouldFilter={false}>
      <Command.Input
        bind:value={query}
        placeholder={$t('components.settings.customize_lms.student_home.placeholder')}
      />
      <Command.List class="max-h-[300px] overflow-y-auto p-2">
        {#if showSearchEmpty}
          <Command.Empty>
            {$t('components.settings.customize_lms.student_home.search_empty', { query: query.trim() })}
          </Command.Empty>
        {/if}

        <Command.Group heading={$t('components.settings.customize_lms.student_home.option_default')}>
          <Command.Item
            value={$t('components.settings.customize_lms.student_home.option_default')}
            onSelect={() => selectDestination(null)}
          >
            <div class="min-w-0 flex-1">
              <div class="truncate font-medium">
                {$t('components.settings.customize_lms.student_home.option_default')}
              </div>
              <div class="ui:text-muted-foreground truncate text-xs">
                {$t('components.settings.customize_lms.student_home.option_default_hint')}
              </div>
            </div>
            {#if value === null}
              <Check class="size-4 shrink-0" />
            {/if}
          </Command.Item>
        </Command.Group>

        <Command.Group heading={$t('components.settings.customize_lms.student_home.group_pages')}>
          {#each filteredPages as option (option.key)}
            {@const Icon = LMS_DESTINATION_ICONS[option.key]}
            <Command.Item
              value={option.label}
              disabled={option.disabled}
              onSelect={() => selectDestination({ type: 'page', key: option.key })}
            >
              <Icon class="size-4" />
              <div class="min-w-0 flex-1">
                <div class="truncate font-medium">{option.label}</div>
              </div>
              {#if option.disabled && option.disabledReason}
                <span class="ui:text-muted-foreground truncate text-xs">
                  {disabledReasonText(option.disabledReason)}
                </span>
              {:else if value?.type === 'page' && value.key === option.key}
                <Check class="size-4 shrink-0" />
              {/if}
            </Command.Item>
          {/each}
        </Command.Group>

        <Command.Group heading={$t('components.settings.customize_lms.student_home.group_courses')}>
          {#if courses === null}
            <div class="flex flex-col gap-2 px-2 py-1.5" aria-hidden="true">
              <Skeleton class="h-8 w-full" />
              <Skeleton class="h-8 w-full" />
            </div>
          {:else if courses.length === 0}
            <div class="ui:text-muted-foreground px-2 py-3 text-sm">
              {$t('components.settings.customize_lms.student_home.courses_empty')}
            </div>
          {:else}
            {#each courses as course (course.id)}
              <Command.Item
                value={course.title}
                onSelect={() => selectDestination({ type: 'course', courseId: course.id })}
              >
                <BookOpen class="size-4" />
                <div class="min-w-0 flex-1">
                  <div class="truncate font-medium">{course.title}</div>
                </div>
                {#if course.type === 'LIVE_CLASS' || course.type === 'COMPLIANCE'}
                  <Badge variant="secondary">
                    {course.type === 'LIVE_CLASS'
                      ? $t('components.settings.customize_lms.student_home.course_type_live')
                      : $t('components.settings.customize_lms.student_home.course_type_compliance')}
                  </Badge>
                {/if}
                {#if value?.type === 'course' && value.courseId === course.id}
                  <Check class="size-4 shrink-0" />
                {/if}
              </Command.Item>
            {/each}
          {/if}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>

{#if courseHint === 'open'}
  <Field.Description>{$t('components.settings.customize_lms.student_home.course_hint_open')}</Field.Description>
{:else if courseHint === 'restricted'}
  <Field.Description>{$t('components.settings.customize_lms.student_home.course_hint_restricted')}</Field.Description>
{/if}

{#if warning}
  <Alert.Callout variant="information" title={warningTitle} description={warningDescription} class="w-full" />
{/if}

{#if error}
  <Field.Error errors={[{ message: error }]} />
{/if}
