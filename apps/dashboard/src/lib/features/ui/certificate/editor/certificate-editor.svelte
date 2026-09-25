<script lang="ts">
  import {
    CERTIFICATE_TEMPLATES,
    type CertificateDesign,
    type CertificateRenderData,
    type CertificateTemplateId
  } from '@cio/certificates';
  import { Certificate } from '@cio/ui';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import LayersIcon from '@lucide/svelte/icons/layers';
  import TypeIcon from '@lucide/svelte/icons/type';
  import PaletteIcon from '@lucide/svelte/icons/palette';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { CERTIFICATE_PREVIEW_SEQ, formatCertificateId } from '@cio/utils/functions';

  import CertificateEditorHeader from './certificate-editor-header.svelte';
  import TemplatesPanel from './panels/templates-panel.svelte';
  import ContentPanel from './panels/content-panel.svelte';
  import ColorsPanel from './panels/colors-panel.svelte';
  import ExportPanel from './panels/export-panel.svelte';
  import {
    ParameterizedCertificateEditorStore,
    type CertificateEditorPanel
  } from './store/certificate-editor-store.svelte';

  interface Props {
    title: string;
    description: string;
    backHref: string;
    initialDesign: CertificateDesign;
    onSave: (design: CertificateDesign) => Promise<boolean>;
    isFreePlan: boolean;
    sampleData?: Partial<CertificateRenderData>;
    onDownloadPdf?: () => Promise<void>;
    onDownloadPng?: () => Promise<void>;
    onPrint?: () => Promise<void>;
  }

  let {
    title,
    description,
    backHref,
    initialDesign,
    onSave,
    isFreePlan,
    sampleData,
    onDownloadPdf,
    onDownloadPng,
    onPrint
  }: Props = $props();

  const store = new ParameterizedCertificateEditorStore();

  $effect.pre(() => {
    store.init(initialDesign, onSave);
  });

  const activeTemplateMeta = $derived(
    CERTIFICATE_TEMPLATES.find((tpl) => tpl.id === store.draft.templateId) ?? CERTIFICATE_TEMPLATES[0]
  );

  const previewDesign = $derived(store.toDesign());

  const sampleRenderData = $derived({
    recipientName: sampleData?.recipientName || $profile.fullname || $t('certificate.editor.sample_recipient'),
    courseName: title || $t('certificate.editor.sample_course'),
    courseDescription: store.draft.descriptionOverride || description || $t('certificate.editor.sample_description'),
    orgName: $currentOrg.name || $t('certificate.editor.sample_org'),
    orgLogoUrl: $currentOrg.avatarUrl || undefined,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' }),
    certificateId: formatCertificateId(store.draft.idFormat || undefined, CERTIFICATE_PREVIEW_SEQ, new Date()),
    ...sampleData
  });

  function navVariant(panel: CertificateEditorPanel) {
    return store.activePanel === panel ? ('default' as const) : ('ghost' as const);
  }

  function setActive(panel: CertificateEditorPanel) {
    store.activePanel = panel;
  }
</script>

<div class="ui:bg-background ui:text-foreground flex h-dvh flex-col">
  <CertificateEditorHeader
    {title}
    {backHref}
    templateLabel={activeTemplateMeta.label}
    isDirty={store.isDirty}
    isSaving={store.isSaving}
    isSignatureUploading={store.isSignatureUploading}
    {isFreePlan}
    onSave={() => store.save()}
    onDiscard={() => store.reset()}
  />

  <div class="flex min-h-0 flex-1">
    <nav
      class="ui:border-border ui:bg-secondary flex w-14 shrink-0 flex-col items-center gap-1.5 border-r py-3"
      aria-label={$t('certificate.editor.sections')}
    >
      <IconButton
        type="button"
        variant={navVariant('templates')}
        tooltip={$t('certificate.editor.panel_templates')}
        tooltipSide="right"
        aria-label={$t('certificate.editor.panel_templates')}
        aria-current={store.activePanel === 'templates' ? 'page' : undefined}
        onclick={() => setActive('templates')}
      >
        <LayersIcon class="size-4" />
      </IconButton>
      <IconButton
        type="button"
        variant={navVariant('content')}
        tooltip={$t('certificate.editor.panel_content')}
        tooltipSide="right"
        aria-label={$t('certificate.editor.panel_content')}
        aria-current={store.activePanel === 'content' ? 'page' : undefined}
        onclick={() => setActive('content')}
      >
        <TypeIcon class="size-4" />
      </IconButton>
      <IconButton
        type="button"
        variant={navVariant('colors')}
        tooltip={$t('certificate.editor.panel_colors')}
        tooltipSide="right"
        aria-label={$t('certificate.editor.panel_colors')}
        aria-current={store.activePanel === 'colors' ? 'page' : undefined}
        onclick={() => setActive('colors')}
      >
        <PaletteIcon class="size-4" />
      </IconButton>
      <IconButton
        type="button"
        variant={navVariant('export')}
        tooltip={$t('certificate.editor.panel_export')}
        tooltipSide="right"
        aria-label={$t('certificate.editor.panel_export')}
        aria-current={store.activePanel === 'export' ? 'page' : undefined}
        onclick={() => setActive('export')}
      >
        <DownloadIcon class="size-4" />
      </IconButton>
    </nav>

    <aside class="ui:border-border ui:bg-card flex w-[min(100%,380px)] shrink-0 flex-col border-r">
      <div class="ui:border-border border-b px-5 py-4">
        {#if store.activePanel === 'templates'}
          <h2 class="text-sm font-semibold">{$t('certificate.editor.panel_templates')}</h2>
          <p class="ui:text-muted-foreground mt-1 text-xs">
            {$t('certificate.editor.panel_templates_subtitle')}
          </p>
        {:else if store.activePanel === 'content'}
          <h2 class="text-sm font-semibold">{$t('certificate.editor.panel_content')}</h2>
          <p class="ui:text-muted-foreground mt-1 text-xs">
            {$t('certificate.editor.panel_content_subtitle')}
          </p>
        {:else if store.activePanel === 'colors'}
          <h2 class="text-sm font-semibold">{$t('certificate.editor.panel_colors')}</h2>
          <p class="ui:text-muted-foreground mt-1 text-xs">
            {$t('certificate.editor.panel_colors_subtitle')}
          </p>
        {:else if store.activePanel === 'export'}
          <h2 class="text-sm font-semibold">{$t('certificate.editor.panel_export')}</h2>
          <p class="ui:text-muted-foreground mt-1 text-xs">
            {$t('certificate.editor.panel_export_subtitle')}
          </p>
        {/if}
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {#if store.activePanel === 'templates'}
          <TemplatesPanel
            value={store.draft.templateId}
            disabled={isFreePlan}
            onSelect={(id: CertificateTemplateId) => store.setTemplate(id)}
          />
        {:else if store.activePanel === 'content'}
          <ContentPanel {store} disabled={isFreePlan} />
        {:else if store.activePanel === 'colors'}
          <ColorsPanel
            value={store.draft.accentColor}
            disabled={isFreePlan}
            onSelect={(color) => store.setAccent(color)}
          />
        {:else if store.activePanel === 'export'}
          <ExportPanel disabled={isFreePlan} {onDownloadPdf} {onDownloadPng} {onPrint} />
        {/if}
      </div>
    </aside>

    <section
      class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-zinc-100 bg-[radial-gradient(circle,#d4d4d8_1px,transparent_1px)] [background-size:18px_18px] dark:bg-zinc-950 dark:bg-[radial-gradient(circle,rgba(113,113,122,0.4)_1px,transparent_1px)]"
      aria-label={$t('certificate.editor.preview')}
    >
      <div class="flex min-h-0 flex-1 items-center justify-center p-6 sm:p-10 lg:p-14">
        <Certificate.Preview design={previewDesign} data={sampleRenderData} showControls />
      </div>
    </section>
  </div>
</div>
