<script lang="ts">
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Input } from '@cio/ui/base/input';
  import { Label } from '@cio/ui/base/label';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { docsApi } from '../api';
  import {
    buildNoteCourseStructure,
    noteContentPreview,
    noteCourseStructureSummary,
    type NoteCourseStructureDraft
  } from '../utils/doc-course-structure';

  interface Props {
    docId: string;
    docTitle: string;
    noteContent: string;
    convertedCourseId?: string | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onConverted?: (courseId: string) => void;
  }

  let {
    docId,
    docTitle,
    noteContent,
    convertedCourseId = null,
    open = $bindable(false),
    onOpenChange,
    onConverted
  }: Props = $props();

  let useSections = $state(true);
  let useTableOfContents = $state(true);
  let structure = $state<NoteCourseStructureDraft | null>(null);
  let isConverting = $state(false);

  const summary = $derived(structure ? noteCourseStructureSummary(structure) : null);
  const hasLessons = $derived((summary?.lessonCount ?? 0) > 0);
  const alreadyConverted = $derived(Boolean(convertedCourseId));

  function rebuildStructure() {
    structure = buildNoteCourseStructure({
      docTitle,
      noteContent,
      useSections,
      useTableOfContents
    });
  }

  async function openCourse(courseId: string) {
    open = false;
    onOpenChange?.(false);
    await goto(resolve(`/courses/${courseId}`, {}));
  }

  async function handleCreateCourse() {
    if (!structure || !hasLessons) {
      snackbar.error('docs.convert_course.empty_error');
      return;
    }

    isConverting = true;

    const result = await docsApi.convertToCourse(docId, {
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
      snackbar.error('docs.convert_course.error');
      return;
    }

    onConverted?.(result.courseId);
    snackbar.success('docs.convert_course.success');
    await openCourse(result.courseId);
  }

  $effect(() => {
    if (!open || alreadyConverted) {
      return;
    }

    useSections;
    useTableOfContents;
    docTitle;
    noteContent;
    rebuildStructure();
  });
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="max-h-[85vh] max-w-2xl overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>{$t('docs.convert_course.title')}</Dialog.Title>
      <Dialog.Description>
        {alreadyConverted
          ? $t('docs.convert_course.already_converted_description')
          : $t('docs.convert_course.description')}
      </Dialog.Description>
    </Dialog.Header>

    {#if alreadyConverted && convertedCourseId}
      <div class="ui:bg-muted/30 space-y-3 rounded-lg border p-4">
        <p class="text-sm">{$t('docs.convert_course.already_converted_body')}</p>
        <Button onclick={() => openCourse(convertedCourseId)}>
          <ExternalLinkIcon size={16} />
          {$t('docs.convert_course.open_course')}
        </Button>
      </div>
    {:else if structure}
      <div class="space-y-4 py-2">
        <div class="space-y-2">
          <Label for="course-title">{$t('docs.convert_course.course_title')}</Label>
          <Input id="course-title" bind:value={structure.courseTitle} />
        </div>

        <div class="space-y-3 rounded-lg border p-3">
          <div class="flex items-start gap-3">
            <Checkbox id="use-sections" bind:checked={useSections} />
            <div>
              <Label for="use-sections">{$t('docs.convert_course.use_sections')}</Label>
              <p class="ui:text-muted-foreground text-sm">{$t('docs.convert_course.use_sections_hint')}</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <Checkbox id="use-toc" bind:checked={useTableOfContents} />
            <div>
              <Label for="use-toc">{$t('docs.convert_course.use_toc')}</Label>
              <p class="ui:text-muted-foreground text-sm">{$t('docs.convert_course.use_toc_hint')}</p>
            </div>
          </div>
        </div>

        {#if summary}
          <p class="ui:text-muted-foreground text-sm">
            {$t('docs.convert_course.summary', {
              sections: summary.sectionCount,
              lessons: summary.lessonCount
            })}
          </p>
        {/if}

        {#if !hasLessons}
          <p class="ui:text-destructive text-sm">{$t('docs.convert_course.empty_error')}</p>
        {/if}

        <div class="space-y-3">
          {#each structure.sections as section (section.id)}
            <div class="rounded-lg border p-3">
              <Input bind:value={section.title} class="mb-3 font-medium" />
              <div class="space-y-2">
                {#each section.lessons as lesson (lesson.id)}
                  <div class="ui:bg-muted/30 rounded-md p-2">
                    <Input bind:value={lesson.title} class="mb-2" />
                    <p class="ui:text-muted-foreground text-xs leading-relaxed">
                      {noteContentPreview(lesson.content) || $t('docs.list.no_content')}
                    </p>
                  </div>
                {/each}
              </div>
            </div>
          {/each}

          {#each structure.unsectionedLessons as lesson (lesson.id)}
            <div class="ui:bg-muted/30 rounded-lg border p-3">
              <Input bind:value={lesson.title} class="mb-2" />
              <p class="ui:text-muted-foreground text-xs leading-relaxed">
                {noteContentPreview(lesson.content) || $t('docs.list.no_content')}
              </p>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <Dialog.Footer>
      <Button variant="secondary" onclick={() => (open = false)}>{$t('docs.share.cancel')}</Button>
      {#if !alreadyConverted}
        <Button onclick={handleCreateCourse} loading={isConverting} disabled={!hasLessons}>
          <BookOpenIcon size={16} />
          {$t('docs.convert_course.create')}
        </Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
