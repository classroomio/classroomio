<script lang="ts">
  import {
    CERTIFICATE_TEMPLATE_IDS,
    CERTIFICATE_TEMPLATES,
    type CertificateDocumentV1,
    type CertificateTemplateId
  } from '@cio/certificates';
  import { ZCertificateDocumentV1 } from '@cio/utils/validation/course';
  import { certificateEditorStore } from '../store/certificate-editor.store.svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { cn } from '@cio/ui/tools';
  import { PluginSlotRenderer } from '$features/plugins/components';
  import type { PluginActionEvent } from '$features/plugins/components/plugin-host-frame.svelte';
  import TemplateThumb from './template-thumb.svelte';

  interface Props {
    courseId?: string;
    value: CertificateTemplateId;
    onSelect: (id: CertificateTemplateId) => void;
    disabled?: boolean;
  }

  let { courseId = '', value, onSelect, disabled = false }: Props = $props();

  function applyDesign(rawDesign: unknown) {
    const parsed = ZCertificateDocumentV1.safeParse(rawDesign);
    if (!parsed.success) {
      snackbar.error('course.navItem.certificates.editor.save_failed');
      return;
    }

    const validDoc = parsed.data as CertificateDocumentV1;
    certificateEditorStore.setCustomDocument(validDoc);
    snackbar.success('course.navItem.certificates.editor.saved');

    const tid = validDoc.rendererTemplateId || validDoc.templateId;
    if (CERTIFICATE_TEMPLATE_IDS.includes(tid as CertificateTemplateId)) {
      onSelect(tid as CertificateTemplateId);
    }
  }

  function handlePluginAction(detail: PluginActionEvent) {
    if (detail.target === 'certificate.templates' && detail.action === 'apply') {
      const payloadData = (detail.data ?? {}) as Record<string, unknown>;
      const design = payloadData.document ?? payloadData.design ?? payloadData;
      applyDesign(design);
    }
  }
</script>

<div class="grid grid-cols-2 gap-3">
  {#each CERTIFICATE_TEMPLATES as template (template.id)}
    {@const isActive = template.id === value}
    <button
      type="button"
      class={cn(
        'group ui:border-border relative aspect-[1.4/1] overflow-hidden rounded-md border bg-white text-left transition-transform',
        'hover:-translate-y-0.5 hover:shadow-md',
        isActive && 'ui:border-primary ui:ring-primary -translate-y-0.5 shadow-md ring-2',
        disabled && 'cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-none'
      )}
      {disabled}
      aria-pressed={isActive}
      onclick={() => onSelect(template.id)}
    >
      <TemplateThumb id={template.id} />
      <span
        class={cn(
          'absolute right-0 bottom-0 left-0 px-2 py-1 text-center text-[9px] font-medium tracking-[0.18em] uppercase',
          isActive ? 'ui:bg-primary ui:text-primary-foreground' : 'ui:bg-foreground ui:text-background'
        )}
      >
        {template.label}
      </span>
    </button>
  {/each}
</div>

<p class="ui:text-muted-foreground mt-4 text-xs">
  {$t('course.navItem.certificates.editor.templates_hint')}
</p>

{#if courseId}
  <div class="ui:border-border mt-6 border-t pt-4">
    <PluginSlotRenderer
      target="certificate.templates"
      resource={{ type: 'course', id: courseId }}
      onAction={handlePluginAction}
    />
  </div>
{/if}
