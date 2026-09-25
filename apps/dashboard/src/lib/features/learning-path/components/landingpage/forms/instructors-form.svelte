<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import UserIcon from '@lucide/svelte/icons/user';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { t } from '$lib/utils/functions/translations';
  import type { TLandingPage, TLandingPageInstructor } from '@cio/utils/validation/learning-path';
  import type { LearningPathDetail } from '$features/learning-path/utils/types';
  import { AddSectionButton } from '$features/ui';
  import InstructorEditorItem from './instructor-editor-item.svelte';

  interface Props {
    landingPage: TLandingPage;
    path: LearningPathDetail;
    onChange: (patch: Partial<TLandingPage>) => void;
  }

  let { landingPage, path, onChange }: Props = $props();

  function getTutorsFromCourses(): TLandingPageInstructor[] {
    const list: TLandingPageInstructor[] = [];
    const seenNames = new Set<string>();

    for (const pathCourse of path.courses ?? []) {
      const instructor = pathCourse.instructor;
      if (instructor?.name && instructor.name.trim()) {
        const normalized = instructor.name.trim().toLowerCase();
        if (!seenNames.has(normalized)) {
          seenNames.add(normalized);
          list.push({
            id: `inst_${list.length + 1}`,
            name: instructor.name.trim(),
            role: instructor.role?.trim() || $t('learningPath.landing.instructors.default_role'),
            imgUrl: instructor.imgUrl?.trim() || '',
            description: '',
            coursesNo: 1
          });
        } else {
          const existing = list.find((item) => item.name.trim().toLowerCase() === normalized);
          if (existing && typeof existing.coursesNo === 'number') {
            existing.coursesNo += 1;
          }
        }
      }
    }

    return list;
  }

  const initialTutors = getTutorsFromCourses();
  const hasSavedInstructors = Array.isArray(landingPage.instructors) && landingPage.instructors.length > 0;

  let instructors = $state<TLandingPageInstructor[]>(
    hasSavedInstructors ? [...landingPage.instructors!] : initialTutors
  );
  let expandedId = $state<string | number | null>(null);

  // If we pre-populated tutors because none were saved, immediately propagate them so they're in draft
  if (!hasSavedInstructors && initialTutors.length > 0) {
    onChange({
      instructors: initialTutors
    });
  }

  $effect(() => {
    if (Array.isArray(landingPage.instructors) && landingPage.instructors.length > 0) {
      instructors = [...landingPage.instructors];
    } else if (instructors.length === 0) {
      const derived = getTutorsFromCourses();
      if (derived.length > 0) {
        instructors = derived;
        notifyChange();
      }
    }
  });

  function notifyChange() {
    onChange({
      instructors
    });
  }

  function addInstructor() {
    const newInstructor: TLandingPageInstructor = {
      id: `inst_${Date.now()}`,
      name: '',
      role: '',
      imgUrl: '',
      description: '',
      coursesNo: 1
    };
    instructors.push(newInstructor);
    expandedId = newInstructor.id!;
    notifyChange();
  }

  function deleteInstructor(id: string | number) {
    // Min 1 instructor: never allow removing the last one
    if (instructors.length <= 1) return;

    const actualIndex = instructors.findIndex((item) => (item.id ?? '') === id);

    if (actualIndex !== -1) {
      instructors.splice(actualIndex, 1);
    }

    if (expandedId === id) expandedId = null;
    notifyChange();
  }

  function toggleExpand(id: string | number) {
    expandedId = expandedId === id ? null : id;
  }
</script>

<div class="space-y-4">
  <div class="space-y-3">
    {#each instructors as instructor, index (instructor.id ?? index)}
      {@const isExpanded = instructor.id ? expandedId === instructor.id : expandedId === index}
      {@const instructorId = instructor.id ?? index}
      <div class="ui:border-border relative flex flex-col rounded-lg border p-3 transition-colors">
        {#if !isExpanded}
          <div class="flex w-full items-center justify-between">
            <div class="flex min-w-0 items-center gap-3">
              <Avatar.Root class="size-9 shrink-0">
                {#if instructor.imgUrl}
                  <Avatar.Image src={instructor.imgUrl} alt={instructor.name || 'Instructor'} />
                {/if}
                <Avatar.Fallback>
                  <UserIcon class="ui:text-muted-foreground size-4" />
                </Avatar.Fallback>
              </Avatar.Root>
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">
                  {instructor.name || $t('learningPath.landing.instructors.untitled')}
                </p>
                {#if instructor.role}
                  <p class="ui:text-muted-foreground truncate text-xs">{instructor.role}</p>
                {/if}
              </div>
            </div>

            <IconButton onclick={() => toggleExpand(instructorId)} aria-label={$t('common.edit')}>
              <ChevronDownIcon size={16} />
            </IconButton>
          </div>
        {:else}
          <InstructorEditorItem
            bind:instructor={instructors[index]}
            onDelete={() => deleteInstructor(instructorId)}
            onCollapse={() => toggleExpand(instructorId)}
            onChange={notifyChange}
          />
        {/if}
      </div>
    {/each}

    <AddSectionButton label={$t('learningPath.landing.instructors.add')} onclick={addInstructor} />

    {#if instructors.length === 0}
      <div class="ui:border-border ui:bg-muted/20 mt-4 rounded-lg border border-dashed p-4 text-center">
        <p class="ui:text-muted-foreground text-xs">{$t('learningPath.landing.instructors.no_tutors_found')}</p>
      </div>
    {/if}
  </div>
</div>
