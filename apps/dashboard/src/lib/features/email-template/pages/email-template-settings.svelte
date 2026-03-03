<script lang="ts">
  import { onMount } from 'svelte';

  import { Spinner } from '@cio/ui/base/spinner';
  import * as Select from '@cio/ui/base/select';
  import { EMAIL_TEMPLATE_LOCALES, type TEmailTemplateId, type TEmailTemplateLocale } from '@cio/utils/constants';

  import { t } from '$lib/utils/functions/translations';
  import { emailTemplateApi } from '../api/email-template.svelte';
  import { sortCatalogByLabel } from '../utils/email-template-utils';
  import EmailTemplateEditor from '../components/email-template-editor.svelte';
  import EmailTemplateList from '../components/email-template-list.svelte';
  import EmailTemplatePreview from '../components/email-template-preview.svelte';

  let isInitializing = $state(true);
  const sortedCatalog = $derived(sortCatalogByLabel(emailTemplateApi.catalog));

  async function handleSelectTemplate(emailId: TEmailTemplateId) {
    await emailTemplateApi.selectTemplate(emailId, emailTemplateApi.selectedLocale);
    await emailTemplateApi.previewSelectedTemplate();
  }

  async function handleLocaleChange(value: string) {
    if (!EMAIL_TEMPLATE_LOCALES.includes(value as TEmailTemplateLocale)) {
      return;
    }

    emailTemplateApi.selectedLocale = value as TEmailTemplateLocale;
    if (!emailTemplateApi.selectedEmailId) {
      return;
    }

    await emailTemplateApi.selectTemplate(emailTemplateApi.selectedEmailId, emailTemplateApi.selectedLocale);
    await emailTemplateApi.previewSelectedTemplate();
  }

  onMount(async () => {
    await emailTemplateApi.loadTemplates();

    const firstTemplateId = (emailTemplateApi.selectedEmailId ||
      sortedCatalog[0]?.id ||
      null) as TEmailTemplateId | null;
    if (firstTemplateId) {
      await handleSelectTemplate(firstTemplateId);
    }

    isInitializing = false;
  });
</script>

{#if isInitializing}
  <div class="flex items-center gap-2 px-2 py-6">
    <Spinner class="size-5!" />
    <span class="ui:text-muted-foreground text-sm">{$t('settings.email_templates.loading')}</span>
  </div>
{:else if sortedCatalog.length === 0}
  <div class="ui:text-muted-foreground rounded-md border border-dashed p-6 text-sm">
    {$t('settings.email_templates.empty_state')}
  </div>
{:else}
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3 px-2">
      <p class="ui:text-muted-foreground text-sm">{$t('settings.email_templates.description')}</p>

      <div class="w-40">
        <Select.Root type="single" bind:value={emailTemplateApi.selectedLocale} onValueChange={handleLocaleChange}>
          <Select.Trigger>
            <span>{emailTemplateApi.selectedLocale.toUpperCase()}</span>
          </Select.Trigger>
          <Select.Content>
            {#each EMAIL_TEMPLATE_LOCALES as locale (locale)}
              <Select.Item value={locale}>{locale.toUpperCase()}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <EmailTemplateList
        catalog={sortedCatalog}
        templates={emailTemplateApi.templates}
        selectedEmailId={emailTemplateApi.selectedEmailId}
        locale={emailTemplateApi.selectedLocale}
        onSelect={handleSelectTemplate}
      />

      <div class="space-y-4 rounded-md border p-4">
        <EmailTemplateEditor
          emailId={emailTemplateApi.selectedEmailId}
          locale={emailTemplateApi.selectedLocale}
          detail={emailTemplateApi.detail}
          bind:draft={emailTemplateApi.draft}
          errors={emailTemplateApi.errors}
          isSaving={emailTemplateApi.isLoading}
          isPreviewLoading={emailTemplateApi.isPreviewLoading}
          onPreview={() => emailTemplateApi.previewSelectedTemplate()}
          onSave={() => emailTemplateApi.saveSelectedTemplate()}
          onReset={() => emailTemplateApi.resetSelectedTemplate()}
        />

        <EmailTemplatePreview html={emailTemplateApi.previewHtml} isLoading={emailTemplateApi.isPreviewLoading} />
      </div>
    </div>
  </div>
{/if}
