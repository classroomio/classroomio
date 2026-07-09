<script lang="ts">
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Input } from '@cio/ui/base/input';
  import { Label } from '@cio/ui/base/label';
  import { Textarea } from '@cio/ui/base/textarea';
  import { classroomio } from '$lib/utils/services/api';
  import { currentOrg } from '$lib/utils/store/org';
  import { get } from 'svelte/store';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import {
    buildNoteCourseStructure,
    noteCourseStructureSummary,
    type NoteCourseStructureDraft
  } from '../utils/note-course-structure';

  interface Props {
    noteTitle: string;
    noteContent: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { noteTitle, noteContent, open = $bindable(false), onOpenChange }: Props = $props();

  let useSections = $state(true);
  let useTableOfContents = $state(true);
  let structure = $state<NoteCourseStructureDraft | null>(null);
  let isConverting = $state(false);

  const summary = $derived(structure ? noteCourseStructureSummary(structure) : null);

  function rebuildStructure() {
    structure = buildNoteCourseStructure({
      noteTitle,
      noteContent,
      useSections,
      useTableOfContents
    });
  }

  async function handleCreateCourse() {
    if (!structure) {
      return;
    }

    const org = get(currentOrg);

    if (!org.id) {
      return;
    }

    isConverting = true;

    try {
      const courseResponse = await classroomio.course.$post({
        json: {
          title: structure.courseTitle,
          description: '',
          type: 'SELF_PACED',
          organizationId: org.id
        }
      });

      const coursePayload = await courseResponse.json();

      if (!coursePayload.success || !coursePayload.data?.course?.id) {
        snackbar.error('notes.convert_course.error');
        return;
      }

      const courseId = coursePayload.data.course.id as string;
      let lessonOrder = 0;

      for (const lesson of structure.unsectionedLessons) {
        await classroomio.course[':courseId'].lesson.$post({
          param: { courseId },
          json: {
            title: lesson.title,
            note: lesson.content,
            courseId,
            order: lessonOrder
          }
        });
        lessonOrder += 1;
      }

      for (const section of structure.sections) {
        const sectionResponse = await classroomio.course[':courseId'].section.$post({
          param: { courseId },
          json: {
            title: section.title,
            courseId
          }
        });
        const sectionPayload = await sectionResponse.json();

        if (!sectionPayload.success || !sectionPayload.data?.id) {
          throw new Error('Failed to create section');
        }

        const sectionId = sectionPayload.data.id as string;

        for (const [index, lesson] of section.lessons.entries()) {
          await classroomio.course[':courseId'].lesson.$post({
            param: { courseId },
            json: {
              title: lesson.title,
              note: lesson.content,
              courseId,
              sectionId,
              order: index
            }
          });
        }
      }

      snackbar.success('notes.convert_course.success');
      open = false;
      onOpenChange?.(false);
      await goto(resolve(`/courses/${courseId}`, {}));
    } catch (error) {
      console.error('convertNoteToCourse error:', error);
      snackbar.error('notes.convert_course.error');
    } finally {
      isConverting = false;
    }
  }

  $effect(() => {
    if (!open) {
      return;
    }

    useSections;
    useTableOfContents;
    noteTitle;
    noteContent;
    rebuildStructure();
  });
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="max-h-[85vh] max-w-2xl overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>{$t('notes.convert_course.title')}</Dialog.Title>
      <Dialog.Description>{$t('notes.convert_course.description')}</Dialog.Description>
    </Dialog.Header>

    {#if structure}
      <div class="space-y-4 py-2">
        <div class="space-y-2">
          <Label for="course-title">{$t('notes.convert_course.course_title')}</Label>
          <Input id="course-title" bind:value={structure.courseTitle} />
        </div>

        <div class="space-y-3 rounded-lg border p-3">
          <div class="flex items-start gap-3">
            <Checkbox id="use-sections" bind:checked={useSections} />
            <div>
              <Label for="use-sections">{$t('notes.convert_course.use_sections')}</Label>
              <p class="ui:text-muted-foreground text-sm">{$t('notes.convert_course.use_sections_hint')}</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <Checkbox id="use-toc" bind:checked={useTableOfContents} />
            <div>
              <Label for="use-toc">{$t('notes.convert_course.use_toc')}</Label>
              <p class="ui:text-muted-foreground text-sm">{$t('notes.convert_course.use_toc_hint')}</p>
            </div>
          </div>
        </div>

        {#if summary}
          <p class="ui:text-muted-foreground text-sm">
            {$t('notes.convert_course.summary', {
              sections: summary.sectionCount,
              lessons: summary.lessonCount
            })}
          </p>
        {/if}

        <div class="space-y-3">
          {#each structure.sections as section (section.id)}
            <div class="rounded-lg border p-3">
              <Input bind:value={section.title} class="mb-3 font-medium" />
              <div class="space-y-2">
                {#each section.lessons as lesson (lesson.id)}
                  <div class="ui:bg-muted/30 rounded-md p-2">
                    <Input bind:value={lesson.title} class="mb-2" />
                    <Textarea bind:value={lesson.content} rows={3} />
                  </div>
                {/each}
              </div>
            </div>
          {/each}

          {#each structure.unsectionedLessons as lesson (lesson.id)}
            <div class="ui:bg-muted/30 rounded-lg border p-3">
              <Input bind:value={lesson.title} class="mb-2" />
              <Textarea bind:value={lesson.content} rows={4} />
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <Dialog.Footer>
      <Button variant="secondary" onclick={() => (open = false)}>{$t('notes.share.cancel')}</Button>
      <Button onclick={handleCreateCourse} loading={isConverting}>
        <BookOpenIcon size={16} />
        {$t('notes.convert_course.create')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
