<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Label } from '@cio/ui/base/label';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { InputField } from '@cio/ui/custom/input-field';
  import { courseTemplateApi } from '$features/course/api';
  import { saveTemplateModal, saveTemplateModalInitialState } from '$features/course/utils/store';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { openUpgradeModal } from '$lib/utils/store/upgrade-modal';

  const usage = $derived($currentOrg.limits?.templates);
  const atLimit = $derived(usage?.limit != null && usage.used >= usage.limit);
  const existingTemplateTitle = $derived(courseTemplateApi.cards?.org[0]?.title || $t('course_templates.card.yours'));
  const hasStudents = $derived($saveTemplateModal.studentCount > 0);
  const mode = $derived($saveTemplateModal.mode);

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      courseTemplateApi.errors = {};
      return;
    }

    saveTemplateModal.set(saveTemplateModalInitialState);
  }

  function setMode(value: string) {
    if (value !== 'copy' && value !== 'convert') return;

    saveTemplateModal.update((current) => ({ ...current, mode: value }));
  }

  async function submit() {
    const courseId = $saveTemplateModal.id;
    if (!courseId || courseTemplateApi.saving) return;

    if (mode === 'convert') {
      await courseTemplateApi.convert(courseId);
      return;
    }

    await courseTemplateApi.saveCopy(courseId, $saveTemplateModal.name.trim());
  }
</script>

<Dialog.Root open={$saveTemplateModal.open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    {#if atLimit && usage}
      <Dialog.Header>
        <Dialog.Title>{$t('course_templates.save.limit_title', { count: usage.limit ?? 0 })}</Dialog.Title>
        <Dialog.Description>
          {$t('course_templates.save.limit_body', { used: usage.used, title: existingTemplateTitle })}
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          class="mr-auto"
          onclick={() => {
            handleOpenChange(false);
            goto(`${$currentOrgPath}/courses/templates`);
          }}
        >
          {$t('course_templates.save.manage')}
        </Button>
        <Button variant="outline" size="sm" type="button" onclick={() => handleOpenChange(false)}>
          {$t('course_templates.preview.cancel')}
        </Button>
        <Button
          size="sm"
          type="button"
          onclick={() => {
            handleOpenChange(false);
            openUpgradeModal();
          }}
        >
          {$t('course_templates.save.upgrade')}
        </Button>
      </Dialog.Footer>
    {:else}
      <Dialog.Header>
        <Dialog.Title>{$t('course_templates.save.title')}</Dialog.Title>
        <Dialog.Description>{$saveTemplateModal.title}</Dialog.Description>
      </Dialog.Header>

      <RadioGroup.Root value={mode} onValueChange={setMode} class="grid gap-3">
        <Label class="flex items-start gap-3 font-normal" for="save-template-copy">
          <RadioGroup.Item id="save-template-copy" value="copy" class="mt-1" />
          <span>
            <span class="block text-sm font-medium">{$t('course_templates.save.copy')}</span>
            <span class="ui:text-muted-foreground block text-sm">{$t('course_templates.save.copy_description')}</span>
          </span>
        </Label>
        <Label class="flex items-start gap-3 font-normal {hasStudents ? 'opacity-50' : ''}" for="save-template-convert">
          <RadioGroup.Item id="save-template-convert" value="convert" disabled={hasStudents} class="mt-1" />
          <span>
            <span class="block text-sm font-medium">{$t('course_templates.save.convert')}</span>
            <span class="ui:text-muted-foreground block text-sm">
              {hasStudents
                ? $t('course_templates.save.has_students', { count: $saveTemplateModal.studentCount })
                : $t('course_templates.save.convert_description')}
            </span>
            {#if $saveTemplateModal.isPublished && !hasStudents}
              <span class="ui:text-muted-foreground mt-1 block text-sm">{$t('course_templates.save.unpublish')}</span>
            {/if}
          </span>
        </Label>
      </RadioGroup.Root>

      {#if mode === 'copy'}
        <InputField
          className="mt-4"
          label={$t('course_templates.save.name')}
          bind:value={$saveTemplateModal.name}
          errorMessage={courseTemplateApi.errors.title}
        />
      {/if}

      <Dialog.Footer>
        <Button variant="outline" size="sm" type="button" onclick={() => handleOpenChange(false)}>
          {$t('course_templates.preview.cancel')}
        </Button>
        <Button
          size="sm"
          type="button"
          loading={courseTemplateApi.saving}
          testId="template-save-submit"
          disabled={mode === 'copy' ? !$saveTemplateModal.name.trim() : hasStudents}
          onclick={submit}
        >
          {mode === 'convert' ? $t('course_templates.save.convert_button') : $t('course_templates.save.save_button')}
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
