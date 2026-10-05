<script lang="ts">
  import { replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import type { TiptapEditor } from '@cio/ui/custom/editor';
  import {
    STUDENT_EMAIL_CATALOG,
    STUDENT_EMAIL_IDS,
    STUDENT_EMAIL_LINKS,
    STUDENT_EMAIL_VARIABLES,
    isEmailLocale,
    isStudentEmailId,
    type StudentEmailId
  } from '@cio/utils/email';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Field from '@cio/ui/base/field';
  import * as Page from '@cio/ui/base/page';
  import * as Select from '@cio/ui/base/select';
  import * as Tabs from '@cio/ui/base/tabs';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import Eye from '@lucide/svelte/icons/eye';
  import Globe from '@lucide/svelte/icons/globe';
  import InfoIcon from '@lucide/svelte/icons/info';
  import Pencil from '@lucide/svelte/icons/pencil';

  import { InputField } from '@cio/ui/custom/input-field';
  import { TextEditor, UnsavedChanges, UpgradeBanner } from '$features/ui';
  import { profile } from '$lib/utils/store/user';
  import { studentEmailTemplatesApi } from '../api/student-email-templates.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { LANGUAGE } from '$lib/utils/constants/translation';
  import { currentOrg, currentOrgPath, isFreePlan } from '$lib/utils/store/org';

  const requestedTemplate = page.url.searchParams.get('template');
  let selectedTemplate = $state<StudentEmailId>(
    isStudentEmailId(requestedTemplate) ? requestedTemplate : 'studentCourseInvite'
  );
  let editor: TiptapEditor | null = $state(null);
  let capturedOrgId = $state('');
  let viewMode = $state<'edit' | 'preview'>('edit');
  let isTestDialogOpen = $state(false);
  let testRecipients = $state('');

  const templateGroups = [
    {
      key: 'settings.emails.groups.enrollment',
      emailIds: ['studentCourseInvite', 'studentOrgInvite', 'studentCourseWelcome', 'studentCohortWelcome']
    },
    {
      key: 'settings.emails.groups.learning',
      emailIds: ['quizAssigned', 'submissionGraded', 'cohortGoalReminder', 'studentCourseCompletion']
    },
    {
      key: 'settings.emails.groups.live_sessions',
      emailIds: ['sessionReminder', 'sessionUpdated']
    },
    {
      key: 'settings.emails.groups.updates_billing',
      emailIds: ['newsfeedPost', 'studentProvePayment']
    }
  ] as const;

  const selectedLocale = $derived(
    $currentOrg.settings?.language?.enforced && isEmailLocale($currentOrg.settings.language.locale)
      ? $currentOrg.settings.language.locale
      : 'en'
  );
  const currentCopy = $derived(STUDENT_EMAIL_CATALOG[selectedLocale].templates[selectedTemplate]);
  const currentOverride = $derived(studentEmailTemplatesApi.drafts[selectedTemplate]?.[selectedLocale]);
  const editorContent = $derived(currentOverride?.content ?? currentCopy.body);
  const editorSubject = $derived(currentOverride?.subject ?? currentCopy.subject);
  const variables = $derived(STUDENT_EMAIL_VARIABLES[selectedTemplate]);
  const dynamicLink = $derived(STUDENT_EMAIL_LINKS[selectedTemplate]);
  const hasOverride = $derived(currentOverride !== undefined);
  const hasUnsavedChanges = $derived(studentEmailTemplatesApi.hasChanges(selectedTemplate, selectedLocale));

  function updateSubject(event: Event) {
    if (!(event.currentTarget instanceof HTMLInputElement)) return;

    studentEmailTemplatesApi.updateSubject(
      selectedTemplate,
      selectedLocale,
      event.currentTarget.value,
      currentCopy.body
    );
  }

  function selectTemplate(emailId: StudentEmailId) {
    if (hasUnsavedChanges) return;

    selectedTemplate = emailId;
    const url = new URL(page.url);
    url.searchParams.set('template', emailId);
    replaceState(resolve(`${url.pathname}${url.search}`, {}), page.state);
  }

  function openTestDialog() {
    testRecipients = $profile.email ?? '';
    isTestDialogOpen = true;
  }

  function handleTestDialogOpenChange(isOpen: boolean) {
    isTestDialogOpen = isOpen;

    if (!isOpen) {
      studentEmailTemplatesApi.testRecipientsError = '';
    }
  }

  async function sendTest() {
    const isSent = await studentEmailTemplatesApi.sendTest(selectedTemplate, selectedLocale, {
      subject: editorSubject,
      content: editorContent,
      recipients: testRecipients
    });
    if (isSent) handleTestDialogOpenChange(false);
  }

  function insertVariable(variable: string) {
    editor?.chain().focus().insertContent(`{{${variable}}}`).run();
  }

  function insertDynamicLink() {
    if (!dynamicLink) return;

    const label = currentCopy.cta ?? $t('settings.emails.dynamic_link');
    editor?.chain().focus().insertContent(`<a href="{{action_url}}">${label}</a>`).run();
  }

  function variableChipLabel(variable: string) {
    if (variable === 'org_name') return $t('settings.emails.variables.organization');
    return $t(`settings.emails.variables.${variable}`);
  }

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || organizationId === capturedOrgId) return;

    capturedOrgId = organizationId;
    void studentEmailTemplatesApi.load(organizationId, selectedLocale);
  });
</script>

{#snippet emailToolbarInsert()}
  <div class="ml-auto flex shrink-0 items-center gap-1 overflow-x-auto pl-2">
    <span class="ui:text-muted-foreground mr-1 text-xs">{$t('settings.emails.insert')}</span>
    {#each variables as variable (variable)}
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="h-7 px-2 text-xs whitespace-nowrap"
        onclick={() => insertVariable(variable)}
      >
        + {variableChipLabel(variable)}
      </Button>
    {/each}
    {#if dynamicLink}
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="h-7 px-2 text-xs whitespace-nowrap"
        onclick={insertDynamicLink}
      >
        + {$t('settings.emails.link_chip')}
      </Button>
    {/if}
  </div>
{/snippet}

<div class="space-y-5 px-2 pt-6">
  <UnsavedChanges {hasUnsavedChanges} />
  <header class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b pb-6">
    <div>
      <h1 class="text-lg font-semibold">{$t('settings.emails.heading')}</h1>
      <p class="ui:text-muted-foreground mt-1 text-sm">{$t('settings.emails.description')}</p>
    </div>
    <div class="ui:bg-background ml-auto flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <Globe class="ui:text-muted-foreground size-4" />
      <span class="ui:text-muted-foreground">{$t('settings.emails.sending_in')}</span>
      <span class="font-medium">{LANGUAGE[selectedLocale]}</span>
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger aria-label={$t('settings.emails.language_note')}>
            <InfoIcon class="ui:text-muted-foreground size-4" />
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom" sideOffset={4} class="max-w-xs">
            {$t('settings.emails.language_note')}
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
      <span class="ui:text-muted-foreground" aria-hidden="true">·</span>
      <a
        class="ui:text-primary text-sm font-medium"
        href={`${$currentOrgPath}/settings/customize-lms#language-settings`}
      >
        {$t('settings.emails.change')}
      </a>
    </div>
  </header>

  <UpgradeBanner>{$t('settings.emails.paid_plan_note')}</UpgradeBanner>

  <div
    class="grid min-w-0 gap-5 transition-opacity lg:grid-cols-[12rem_minmax(0,1fr)]"
    class:opacity-40={$isFreePlan}
    inert={$isFreePlan}
  >
    <div class="lg:hidden">
      <Field.Field>
        <Field.Label>{$t('settings.emails.template')}</Field.Label>
        <Select.Root
          type="single"
          value={selectedTemplate}
          onValueChange={(value) => {
            if (isStudentEmailId(value)) selectTemplate(value);
          }}
          disabled={hasUnsavedChanges}
        >
          <Select.Trigger class="w-full">{$t(`settings.emails.templates.${selectedTemplate}`)}</Select.Trigger>
          <Select.Content>
            {#each STUDENT_EMAIL_IDS as emailId (emailId)}
              <Select.Item value={emailId}>{$t(`settings.emails.templates.${emailId}`)}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>
    </div>

    <nav aria-label={$t('settings.emails.template_navigation')} class="hidden space-y-5 lg:block">
      {#each templateGroups as group (group.key)}
        <section>
          <h2 class="ui:text-muted-foreground mb-2 text-xs font-semibold uppercase">
            {$t(group.key)}
          </h2>
          <div class="space-y-1">
            {#each group.emailIds as emailIdValue (emailIdValue)}
              {@const emailId = emailIdValue as StudentEmailId}
              <Button
                type="button"
                variant={selectedTemplate === emailId ? 'secondary' : 'ghost'}
                size="sm"
                class="w-full justify-between gap-2 text-left font-normal"
                disabled={hasUnsavedChanges && selectedTemplate !== emailId}
                aria-current={selectedTemplate === emailId ? 'page' : undefined}
                onclick={() => selectTemplate(emailId)}
              >
                <span class="min-w-0 truncate">{$t(`settings.emails.templates.${emailId}`)}</span>
                {#if studentEmailTemplatesApi.isEdited(emailId)}
                  <span class="ui:text-primary shrink-0 text-xs">{$t('settings.emails.edited')}</span>
                {/if}
              </Button>
            {/each}
          </div>
        </section>
      {/each}
    </nav>

    <section class="ui:bg-background min-w-0 overflow-hidden rounded-md border">
      <header class="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div class="min-w-0">
          <h2 class="text-sm font-semibold">{$t(`settings.emails.templates.${selectedTemplate}`)}</h2>
          <p class="ui:text-muted-foreground mt-1 text-xs">
            {$t(`settings.emails.descriptions.${selectedTemplate}`)}
          </p>
        </div>
        <Tabs.Root bind:value={viewMode} class="shrink-0">
          <Tabs.List>
            <Tabs.Trigger value="edit">
              <Pencil />
              {$t('settings.emails.edit')}
            </Tabs.Trigger>
            <Tabs.Trigger value="preview">
              <Eye />
              {$t('settings.emails.preview')}
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </header>

      <div class="space-y-4 p-4">
        <Field.Field>
          <Field.Label for="student-email-subject">{$t('settings.emails.subject')}</Field.Label>
          {#if viewMode === 'edit'}
            <Input id="student-email-subject" value={editorSubject} oninput={updateSubject} />
          {:else}
            <div class="ui:bg-muted rounded-md border px-3 py-2 text-sm">{editorSubject}</div>
          {/if}
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('settings.emails.editor_heading')}</Field.Label>
          {#key `${selectedTemplate}:${selectedLocale}`}
            {@const editorTemplate = selectedTemplate}
            {@const editorLocale = selectedLocale}
            <TextEditor
              content={editorContent}
              toolbarPreset="email"
              toolbarTrailing={emailToolbarInsert}
              showToolBar={viewMode === 'edit'}
              editable={viewMode === 'edit'}
              onReady={(instance) => (editor = instance)}
              onChange={(content) => studentEmailTemplatesApi.updateContent(editorTemplate, editorLocale, content)}
              editorClass="min-h-56"
              placeholder={$t('settings.emails.editor_placeholder')}
            />
          {/key}
        </Field.Field>

        <div
          class="ui:bg-muted/50 flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed p-3"
        >
          <div>
            <p class="text-xs font-medium">{$t('settings.emails.protected_content')}</p>
            <p class="ui:text-muted-foreground mt-1 text-xs">{$t('settings.emails.protected_content_description')}</p>
          </div>
          {#if currentCopy.cta}
            <Button type="button" variant="outline" size="sm" disabled>{currentCopy.cta}</Button>
          {/if}
        </div>
      </div>

      <footer class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!hasOverride}
          onclick={() => studentEmailTemplatesApi.resetDraft(selectedTemplate, selectedLocale)}
        >
          {$t('settings.emails.reset')}
        </Button>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onclick={openTestDialog}>
            {$t('settings.emails.send_test')}
          </Button>
        </div>
      </footer>
    </section>
  </div>
</div>

<Page.SettingsActions
  hasChanges={hasUnsavedChanges}
  loading={studentEmailTemplatesApi.isSaving}
  statusLabel={$t('common.unsaved_changes.label')}
  discardLabel={$t('common.discard')}
  saveLabel={$t('common.save_changes')}
  onSave={() => studentEmailTemplatesApi.save(selectedTemplate, selectedLocale, currentCopy.subject)}
  onDiscard={() => studentEmailTemplatesApi.discard()}
/>

<Dialog.Root open={isTestDialogOpen} onOpenChange={handleTestDialogOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('settings.emails.test_dialog.title')}</Dialog.Title>
      <Dialog.Description>{$t('settings.emails.test_dialog.description')}</Dialog.Description>
    </Dialog.Header>

    <InputField
      label={$t('settings.emails.test_dialog.recipients')}
      bind:value={testRecipients}
      placeholder={$t('settings.emails.test_dialog.recipients_placeholder')}
      errorMessage={studentEmailTemplatesApi.testRecipientsError
        ? $t(studentEmailTemplatesApi.testRecipientsError)
        : ''}
    />

    <Dialog.Footer>
      <Button variant="outline" size="sm" type="button" onclick={() => handleTestDialogOpenChange(false)}>
        {$t('app.cancel')}
      </Button>
      <Button size="sm" type="button" loading={studentEmailTemplatesApi.isSendingTest} onclick={sendTest}>
        {$t('settings.emails.send_test')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
