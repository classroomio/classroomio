<script lang="ts">
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Badge } from '@cio/ui/base/badge';
  import { DEFAULT_COURSE_BANNER_IMAGE } from '@cio/ui';
  import { courseTemplateApi } from '$features/course/api';
  import { templatePreviewSettingRows, templateTypeBadge } from '$features/course/utils/template-display';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  interface Props {
    templateId?: string | null;
    onClose: () => void;
  }

  let { templateId = null, onClose }: Props = $props();

  let courseName = $state('');
  let loadedId = $state<string | null>(null);
  let loadedOrgId = $state('');
  let namedFor = $state<string | null>(null);

  const open = $derived(Boolean(templateId));
  const preview = $derived(courseTemplateApi.preview);
  const typeBadge = $derived(templateTypeBadge(preview?.type, $t));
  const settingRows = $derived(preview ? templatePreviewSettingRows(preview.settings, $t) : []);

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!templateId || !organizationId) return;
    if (templateId === loadedId && organizationId === loadedOrgId) return;

    loadedId = templateId;
    loadedOrgId = organizationId;
    courseName = '';
    void courseTemplateApi.loadPreview(templateId);
  });

  $effect(() => {
    if (!preview || preview.id !== templateId || namedFor === templateId) return;

    namedFor = templateId;
    courseName = preview.title;
  });

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) return;

    onClose();
  }

  function handleOpenChangeComplete(isOpen: boolean) {
    if (isOpen || templateId) return;

    loadedId = null;
    loadedOrgId = '';
    namedFor = null;
    courseName = '';
    courseTemplateApi.preview = null;
  }

  async function useTemplate() {
    if (!templateId || !preview || courseTemplateApi.creating) return;

    await courseTemplateApi.createCourse(templateId, courseName.trim(), preview.title);
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange} onOpenChangeComplete={handleOpenChangeComplete}>
  <Dialog.Content class="max-w-4xl! gap-0 overflow-hidden p-0 sm:max-w-4xl!">
    {#if !preview}
      <Dialog.Title class="sr-only">{$t('course_templates.preview.loading')}</Dialog.Title>
      <div class="ui:text-muted-foreground min-h-[12rem] p-8 text-sm">{$t('course_templates.preview.loading')}</div>
    {:else}
      <div class="grid h-[min(620px,80vh)] md:grid-cols-2">
        <div class="ui:bg-muted/40 min-h-0 overflow-auto border-b p-5 md:border-r md:border-b-0">
          <img
            src={preview.bannerImage || DEFAULT_COURSE_BANNER_IMAGE}
            alt=""
            class="mb-4 aspect-[16/7] w-full rounded-md object-cover"
          />
          {#each preview.outline as section (section.id || section.title)}
            <div class="mb-3">
              {#if section.title}
                <p class="mb-1 text-sm font-medium">{section.title}</p>
              {/if}
              {#each section.lessons as lesson (lesson.id)}
                <p class="ui:text-muted-foreground flex items-center gap-2 py-0.5 text-sm">
                  <BookOpenIcon class="size-3.5 shrink-0" />
                  <span class="truncate">{lesson.title}</span>
                </p>
              {/each}
              {#each section.exercises as exercise (exercise.id)}
                <p class="ui:text-muted-foreground flex items-center gap-2 py-0.5 text-sm">
                  <ListChecksIcon class="size-3.5 shrink-0" />
                  <span class="truncate">{exercise.title}</span>
                  <span class="shrink-0 text-xs">
                    {$t('course_templates.preview.questions', { count: exercise.questionCount })}
                  </span>
                </p>
              {/each}
            </div>
          {/each}
        </div>

        <div class="flex min-h-0 flex-col">
          <div class="min-h-0 flex-1 overflow-auto p-5">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              {#if typeBadge}
                {@const Icon = typeBadge.icon}
                <Badge variant="secondary">
                  <Icon class="size-3" />
                  {typeBadge.label}
                </Badge>
              {/if}
              <span class="ui:text-muted-foreground text-xs">
                {preview.curated || preview.global
                  ? $t('course_templates.card.curated')
                  : $t('course_templates.card.yours')}
              </span>
            </div>
            <Dialog.Title class="text-lg">{preview.title}</Dialog.Title>
            {#if preview.description}
              <Dialog.Description class="mt-2">{preview.description}</Dialog.Description>
            {/if}
            <p class="ui:text-muted-foreground mt-3 text-xs">
              {$t('course_templates.preview.counts', {
                sections: preview.counts.sections,
                lessons: preview.counts.lessons,
                exercises: preview.counts.exercises
              })}
            </p>

            {#if settingRows.length > 0}
              <p class="mt-5 text-sm font-medium">{$t('course_templates.preview.settings')}</p>
              <ul class="mt-2 space-y-2">
                {#each settingRows as row (row.key)}
                  <li class="flex gap-2 text-sm">
                    <CheckIcon class="ui:text-primary mt-0.5 size-4 shrink-0" />
                    <span>{row.label}</span>
                  </li>
                {/each}
              </ul>
            {/if}

            {#if preview.highlights.length > 0}
              <p class="mt-5 text-sm font-medium">{$t('course_templates.preview.shows_off')}</p>
              <ul class="mt-2 space-y-2">
                {#each preview.highlights as highlight (highlight.title)}
                  <li class="flex gap-2 text-sm">
                    <CheckIcon class="ui:text-primary mt-0.5 size-4 shrink-0" />
                    <span>
                      <span class="font-medium">{highlight.title}</span>
                      <span class="ui:text-muted-foreground block text-xs">{highlight.description}</span>
                    </span>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>

          <div class="border-t p-5">
            {#if courseTemplateApi.creating}
              <p class="ui:ui:text-muted-foreground flex items-center gap-2 text-sm">
                <span class="ui:border-muted ui:border-t-primary size-4 shrink-0 animate-spin rounded-full border-2"
                ></span>
                {$t('course_templates.preview.copying', {
                  sections: preview.counts.sections,
                  lessons: preview.counts.lessons
                })}
              </p>
            {:else}
              <InputField
                label={$t('course_templates.preview.course_name')}
                bind:value={courseName}
                errorMessage={courseTemplateApi.errors.title}
              />
              <div class="mt-3 flex flex-wrap justify-end gap-2">
                <Button variant="outline" size="sm" type="button" onclick={() => handleOpenChange(false)}>
                  {$t('course_templates.preview.cancel')}
                </Button>
                {#if !preview.global}
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onclick={() => goto(resolve(`/courses/${preview.id}/lessons`, {}))}
                  >
                    {$t('course_templates.preview.open')}
                  </Button>
                {/if}
                {#if $isOrgAdmin}
                  <Button
                    size="sm"
                    type="button"
                    testId="template-preview-use"
                    disabled={!courseName.trim()}
                    onclick={useTemplate}
                  >
                    {$t('course_templates.preview.use')}
                  </Button>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
