<script lang="ts">
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Input } from '@cio/ui/base/input';
  import { Label } from '@cio/ui/base/label';
  import { Textarea } from '@cio/ui/base/textarea';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { notesApi } from '../api';
  import {
    buildNoteCourseStructure,
    noteCourseStructureSummary,
    type NoteCourseStructureDraft
  } from '../utils/note-course-structure';

  interface Props {
    noteId: string;
    noteTitle: string;
    noteContent: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { noteId, noteTitle, noteContent, open = $bindable(false), onOpenChange }: Props = $props();

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

    isConverting = true;

    const result = await notesApi.convertToCourse(noteId, {
      courseTitle: structure.courseTitle,
      sections: structure.sections.map((section) => ({
        title: section.title,
        lessons: section.lessons.map((lesson) => ({
          title: lesson.title,
          content: lesson.content
        }))
      })),
      unsectionedLessons: structure.unsectionedLessons.map((lesson) => ({
        title: lesson.title,
        content: lesson.content
      }))
    });

    isConverting = false;

    if (!result) {
      snackbar.error('notes.convert_course.error');
      return;
    }

    snackbar.success('notes.convert_course.copy_success');
    open = false;
    onOpenChange?.(false);
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
