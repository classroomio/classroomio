<script lang="ts">
  import { CERTIFICATE_TEMPLATES, type CertificateTemplateId } from '@cio/certificates';
  import { Certificate } from '@cio/ui';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import LayersIcon from '@lucide/svelte/icons/layers';
  import TypeIcon from '@lucide/svelte/icons/type';
  import PaletteIcon from '@lucide/svelte/icons/palette';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import { t } from '$lib/utils/functions/translations';

  import { courseApi } from '$features/course/api';
  import { currentOrg } from '$lib/utils/store/org';
  import { isFreePlan } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { UnsavedChanges } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import CertificateEditorHeader from './certificate-editor-header.svelte';
  import TemplatesPanel from './panels/templates-panel.svelte';
  import ContentPanel from './panels/content-panel.svelte';
  import ColorsPanel from './panels/colors-panel.svelte';
  import ExportPanel from './panels/export-panel.svelte';
  import { certificateEditorStore, type CertificateEditorPanel } from './store/certificate-editor.store.svelte';

  let { courseId }: { courseId: string } = $props();

  const store = certificateEditorStore;

  $effect(() => {
    if (!courseApi.course?.id || courseApi.course.id !== courseId) return;
    store.syncFromCourse(courseId);
  });

  const courseTitle = $derived(courseApi.course?.title ?? '');

  const activeTemplateMeta = $derived(
    CERTIFICATE_TEMPLATES.find((tpl) => tpl.id === store.draft.templateId) ?? CERTIFICATE_TEMPLATES[0]
  );

  const previewDesign = $derived(store.toDesign());

  let editorPreviewStatus = $state<'valid' | 'expired' | 'revoked'>('valid');

  const sampleRenderData = $derived({
    recipientName: $profile.fullname || $t('course.navItem.certificates.editor.sample_recipient'),
    courseName: courseTitle || $t('course.navItem.certificates.editor.sample_course'),
    courseDescription:
      store.draft.descriptionOverride ||
      courseApi.course?.description ||
      $t('course.navItem.certificates.editor.sample_description'),
    orgName: $currentOrg.name || $t('course.navItem.certificates.editor.sample_org'),
    orgLogoUrl: $currentOrg.avatarUrl || undefined,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' }),
    certificateId: (store.draft.idFormat || 'N° {seq}').replace('{seq}', '0247'),
    verifyCode: '7KQM-4XH2',
    verifyUrl: 'https://classroomio.com/verify?code=7KQM-4XH2'
  });

  function navVariant(panel: CertificateEditorPanel) {
    return store.activePanel === panel ? ('default' as const) : ('ghost' as const);
  }

  function setActive(panel: CertificateEditorPanel) {
    store.activePanel = panel;
  }

  function focusField(targetId: string, attempts = 5) {
    const el = (document.getElementById(targetId) ||
      document.querySelector(`[name="${targetId}"]`)) as HTMLElement | null;
    if (el) {
      el.focus();
      if ((el as HTMLInputElement).select) (el as HTMLInputElement).select();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (attempts > 0) {
      setTimeout(() => focusField(targetId, attempts - 1), 50);
    }
  }

  function handleCertEdit(key: string, fixed?: string) {
    if (key === 'fixed') {
      const messages: Record<string, string> = {
        org: t.get('course.navItem.certificates.editor.toast_org'),
        title: t.get('course.navItem.certificates.editor.toast_title'),
        recipient: t.get('course.navItem.certificates.editor.toast_recipient'),
        verify: t.get('course.navItem.certificates.editor.toast_verify')
      };
      const msg = (fixed && messages[fixed]) || t.get('course.navItem.certificates.editor.toast_generic');
      snackbar.info(msg);
      return;
    }

    let targetId: string | null = null;
    if (key === 'subtitle') targetId = 'field-subtitle';
    else if (key === 'description') targetId = 'field-description';
    else if (key === 'idFormat') targetId = 'field-idFormat';
    else if (key.startsWith('sig:')) {
      const idx = Number(key.split(':')[1]);
      if (!isNaN(idx)) {
        targetId = `field-sig-${idx}-name`;
        if (!store.draft.signatories[idx]?.enabled) {
          store.draft.signatories[idx].enabled = true;
        }
      }
    }

    store.activePanel = 'content';

    if (!targetId) return;

    focusField(targetId);
  }

  function handleBackgroundClick() {
    store.activePanel = 'colors';
  }
</script>

{#if courseApi.course?.id === courseId}
  <UnsavedChanges hasUnsavedChanges={store.isDirty} onAbandon={() => store.reset()} />
  <div class="ui:bg-background ui:text-foreground flex h-dvh flex-col">
    <CertificateEditorHeader
      {courseId}
      {courseTitle}
      templateLabel={activeTemplateMeta.label}
      isDirty={store.isDirty}
      isSaving={store.isSaving}
      isSignatureUploading={store.isSignatureUploading}
      isFreePlan={$isFreePlan}
      onSave={() => store.save()}
      onDiscard={() => store.reset()}
    />

    <div class="flex min-h-0 flex-1">
      <nav
        class="ui:border-border ui:bg-secondary flex w-14 shrink-0 flex-col items-center gap-1.5 border-r py-3"
        aria-label={$t('course.navItem.certificates.editor.sections')}
      >
        <IconButton
          type="button"
          variant={navVariant('templates')}
          tooltip={$t('course.navItem.certificates.editor.panel_templates')}
          tooltipSide="right"
          aria-label={$t('course.navItem.certificates.editor.panel_templates')}
          aria-current={store.activePanel === 'templates' ? 'page' : undefined}
          onclick={() => setActive('templates')}
        >
          <LayersIcon class="size-4" />
        </IconButton>
        <IconButton
          type="button"
          variant={navVariant('content')}
          tooltip={$t('course.navItem.certificates.editor.panel_content')}
          tooltipSide="right"
          aria-label={$t('course.navItem.certificates.editor.panel_content')}
          aria-current={store.activePanel === 'content' ? 'page' : undefined}
          onclick={() => setActive('content')}
        >
          <TypeIcon class="size-4" />
        </IconButton>
        <IconButton
          type="button"
          variant={navVariant('colors')}
          tooltip={$t('course.navItem.certificates.editor.panel_colors')}
          tooltipSide="right"
          aria-label={$t('course.navItem.certificates.editor.panel_colors')}
          aria-current={store.activePanel === 'colors' ? 'page' : undefined}
          onclick={() => setActive('colors')}
        >
          <PaletteIcon class="size-4" />
        </IconButton>
        <IconButton
          type="button"
          variant={navVariant('export')}
          tooltip={$t('course.navItem.certificates.editor.panel_export')}
          tooltipSide="right"
          aria-label={$t('course.navItem.certificates.editor.panel_export')}
          aria-current={store.activePanel === 'export' ? 'page' : undefined}
          onclick={() => setActive('export')}
        >
          <DownloadIcon class="size-4" />
        </IconButton>
      </nav>

      <aside class="ui:border-border ui:bg-card flex w-[min(100%,380px)] shrink-0 flex-col border-r">
        <div class="ui:border-border border-b px-5 py-4">
          {#if store.activePanel === 'templates'}
            <h2 class="text-sm font-semibold">{$t('course.navItem.certificates.editor.panel_templates')}</h2>
            <p class="ui:text-muted-foreground mt-1 text-xs">
              {$t('course.navItem.certificates.editor.panel_templates_subtitle')}
            </p>
          {:else if store.activePanel === 'content'}
            <h2 class="text-sm font-semibold">{$t('course.navItem.certificates.editor.panel_content')}</h2>
            <p class="ui:text-muted-foreground mt-1 text-xs">
              {$t('course.navItem.certificates.editor.panel_content_subtitle')}
            </p>
          {:else if store.activePanel === 'colors'}
            <h2 class="text-sm font-semibold">{$t('course.navItem.certificates.editor.panel_colors')}</h2>
            <p class="ui:text-muted-foreground mt-1 text-xs">
              {$t('course.navItem.certificates.editor.panel_colors_subtitle')}
            </p>
          {:else}
            <h2 class="text-sm font-semibold">{$t('course.navItem.certificates.editor.panel_export')}</h2>
            <p class="ui:text-muted-foreground mt-1 text-xs">
              {$t('course.navItem.certificates.editor.panel_export_subtitle')}
            </p>
          {/if}
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {#if store.activePanel === 'templates'}
            <TemplatesPanel
              value={store.draft.templateId}
              disabled={$isFreePlan}
              onSelect={(id: CertificateTemplateId) => store.setTemplate(id)}
            />
          {:else if store.activePanel === 'content'}
            <ContentPanel disabled={$isFreePlan} />
          {:else if store.activePanel === 'colors'}
            <ColorsPanel
              value={store.draft.accentColor}
              disabled={$isFreePlan}
              onSelect={(color) => store.setAccent(color)}
            />
          {:else}
            <ExportPanel {courseId} {courseTitle} disabled={$isFreePlan} />
          {/if}
        </div>
      </aside>

      <section
        class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-zinc-100 bg-[radial-gradient(circle,#d4d4d8_1px,transparent_1px)] [background-size:18px_18px] dark:bg-zinc-950 dark:bg-[radial-gradient(circle,rgba(113,113,122,0.4)_1px,transparent_1px)]"
        aria-label={$t('course.navItem.certificates.editor.preview')}
      >
        <div
          class="bg-card text-muted-foreground pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full border px-3 py-1 text-xs shadow-md"
        >
          {$t('course.navItem.certificates.editor.click_to_edit')}
        </div>
        <div class="flex min-h-0 flex-1 items-center justify-center p-6 sm:p-10 lg:p-14">
          <div
            class="relative w-full max-w-[900px]"
            style:opacity={editorPreviewStatus === 'revoked' ? '0.55' : editorPreviewStatus === 'expired' ? '0.8' : '1'}
            style:filter={editorPreviewStatus === 'revoked' ? 'grayscale(1)' : 'none'}
          >
            <Certificate.Preview
              design={previewDesign}
              data={sampleRenderData}
              showControls
              onEdit={handleCertEdit}
              onBackgroundClick={handleBackgroundClick}
            />
            {#if editorPreviewStatus === 'revoked'}
              <div class="pointer-events-none absolute inset-0 grid place-items-center">
                <span
                  class="border-destructive text-destructive rotate-[-12deg] rounded-lg border-[5px] bg-white/70 px-6 py-2 text-2xl font-extrabold tracking-widest uppercase opacity-80 backdrop-blur-sm"
                  >{$t('course.navItem.people.certificate_drawer.status_revoked')}</span
                >
              </div>
            {:else if editorPreviewStatus === 'expired'}
              <div class="pointer-events-none absolute inset-0 grid place-items-center">
                <span
                  class="rotate-[-12deg] rounded-lg border-[5px] border-amber-600 bg-white/70 px-6 py-2 text-2xl font-extrabold tracking-widest text-amber-600 opacity-80 backdrop-blur-sm"
                  >{$t('course.navItem.people.certificate_drawer.status_expired')}</span
                >
              </div>
            {/if}
          </div>
        </div>
        <div
          class="ui:border-border ui:bg-card absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border p-1 shadow-md"
          role="group"
          aria-label="Preview as"
        >
          <span class="text-muted-foreground px-2 text-xs">{$t('course.navItem.certificates.editor.preview_as')}</span>
          <button
            type="button"
            class="h-7 rounded-full px-3 text-xs {editorPreviewStatus === 'valid'
              ? 'ui:bg-primary ui:text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'}"
            onclick={() => (editorPreviewStatus = 'valid')}
            >{$t('course.navItem.people.certificate_drawer.status_valid')}</button
          >
          <button
            type="button"
            class="h-7 rounded-full px-3 text-xs {editorPreviewStatus === 'expired'
              ? 'ui:bg-primary ui:text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'}"
            onclick={() => (editorPreviewStatus = 'expired')}
            >{$t('course.navItem.people.certificate_drawer.status_expired')}</button
          >
          <button
            type="button"
            class="h-7 rounded-full px-3 text-xs {editorPreviewStatus === 'revoked'
              ? 'ui:bg-primary ui:text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'}"
            onclick={() => (editorPreviewStatus = 'revoked')}
            >{$t('course.navItem.people.certificate_drawer.status_revoked')}</button
          >
        </div>
      </section>
    </div>
  </div>
{/if}
