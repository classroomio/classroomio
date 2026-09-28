<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { currentOrg } from '$lib/utils/store/org';
  import { orgCertificatePresetsApi, type OrgCertificatePreset } from '$features/plugins';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Certificate } from '@cio/ui';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import { t } from '$lib/utils/functions/translations';
  import type { CertificateDesign, CertificateTemplateId } from '@cio/certificates';
  import type { ToolCategory, StudioElementId } from '../types';

  import StudioHeader from './studio-header.svelte';
  import CanvasStage from './canvas-stage.svelte';
  import InspectorPanel from './inspector-panel.svelte';

  interface Props {
    orgSlug: string;
    preset?: OrgCertificatePreset | null;
  }

  let { orgSlug, preset: initialPreset = null }: Props = $props();

  const presetId = $derived(page.url.searchParams.get('id'));
  const starterTemplateId = $derived((page.url.searchParams.get('starter') ?? 'classique') as CertificateTemplateId);
  const initialName = $derived(page.url.searchParams.get('name') ?? '');
  const initialAccentColor = $derived(page.url.searchParams.get('color') ?? '#d4af37');
  const initialSubtitle = $derived(page.url.searchParams.get('subtitle') ?? 'PROUDLY PRESENTED TO');

  let activePreset = $state<OrgCertificatePreset | null>(initialPreset);
  let isLoading = $state(Boolean(presetId && !initialPreset));
  let isSaving = $state(false);
  let isPreviewModalOpen = $state(false);
  let selectedTool = $state<ToolCategory>('borders');
  let selectedElement = $state<StudioElementId | null>(null);

  function handleSelectElement(el: StudioElementId | null) {
    selectedElement = el;
    if (!el) return;
    if (el === 'title' || el === 'recipient') selectedTool = 'typography';
    else if (el === 'course') selectedTool = 'layout';
    else if (el === 'badge') selectedTool = 'badges';
    else if (el === 'sig-left' || el === 'sig-right') selectedTool = 'signatories';
    else if (el === 'qrcode') selectedTool = 'qrcode';
    else if (el === 'border') selectedTool = 'borders';
  }

  function handleSelectTool(tool: ToolCategory) {
    selectedTool = tool;
    if (tool === 'typography' && selectedElement !== 'title' && selectedElement !== 'recipient') {
      selectedElement = 'title';
    } else if (tool === 'borders') {
      selectedElement = 'border';
    } else if (tool === 'badges') {
      selectedElement = 'badge';
    } else if (tool === 'layout') {
      selectedElement = 'course';
    } else if (tool === 'signatories') {
      selectedElement = 'sig-left';
    } else if (tool === 'qrcode') {
      selectedElement = 'qrcode';
    }
  }

  let templateName = $state('Acme Honors Gold 2026');

  // Reactive unified design state
  let design = $state<CertificateDesign>({
    rendererTemplateId: 'modular',
    templateId: 'classique',
    accentColor: '#d4af37',
    subtitle: 'PROUDLY PRESENTED TO',
    descriptionOverride:
      'For successfully mastering Fullstack Engineering and demonstrating leadership and academic rigor.',
    idFormat: 'ACM-{seq}',
    signatories: [
      { name: 'Dr. Robert Ford', role: 'Dean of Academics', enabled: true },
      { name: 'Sarah Dean', role: 'Lead Instructor', enabled: true }
    ],
    border: {
      style: 'victorian',
      width: 12,
      primaryColor: '#d4af37',
      accentColor: '#85581a'
    },
    typography: {
      titleFont: 'Bodoni Moda',
      recipientFont: 'Great Vibes',
      bodyFont: 'Cormorant Garamond',
      primaryColor: '#1a1a2e',
      letterSpacing: 0.05
    },
    background: {
      style: 'parchment',
      primaryColor: '#faf8f2',
      secondaryColor: '#f3ede0'
    },
    badge: {
      style: 'gold_seal',
      label: 'OFFICIAL SEAL',
      foilColor: '#d4af37'
    },
    qrCode: {
      enabled: true
    }
  });

  function applyPresetData(p: OrgCertificatePreset) {
    activePreset = p;
    templateName = p.name;
    const raw = (p.design as Record<string, any>) ?? {};
    design.rendererTemplateId = 'modular';
    design.templateId = raw.rendererTemplateId || raw.templateId || 'classique';
    design.accentColor = raw.accentColor || '#d4af37';
    if (raw.subtitle) design.subtitle = raw.subtitle;
    if (raw.descriptionOverride) design.descriptionOverride = raw.descriptionOverride;
    if (raw.idFormat) design.idFormat = raw.idFormat;
    if (raw.border) design.border = { ...design.border, ...raw.border };
    if (raw.typography) design.typography = { ...design.typography, ...raw.typography };
    if (raw.background) design.background = { ...design.background, ...raw.background };
    if (raw.badge) design.badge = { ...design.badge, ...raw.badge };
    if (raw.qrCode) design.qrCode = { ...design.qrCode, ...raw.qrCode };
    if (Array.isArray(raw.signatories) && raw.signatories.length >= 2) {
      design.signatories = [raw.signatories[0], raw.signatories[1]];
    }
  }

  // Zoom management
  let manualZoom = $state<number | null>(null);
  let fitZoom = $state<number>(0.65);
  let stageElement = $state<HTMLDivElement | null>(null);

  const currentZoom = $derived(manualZoom ?? fitZoom);

  function clampZoom(val: number) {
    return Math.max(0.25, Math.min(1.8, val));
  }

  function handleZoomIn() {
    manualZoom = clampZoom(currentZoom + 0.1);
  }

  function handleZoomOut() {
    manualZoom = clampZoom(currentZoom - 0.1);
  }

  function handleFit() {
    manualZoom = null;
  }

  function computeFitZoom() {
    if (!stageElement) return;
    const rect = stageElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const horizontalScale = (rect.width - 48) / 1100;
    const verticalScale = (rect.height - 48) / 780;
    fitZoom = clampZoom(Math.min(horizontalScale, verticalScale));
  }

  onMount(async () => {
    if (initialPreset) {
      applyPresetData(initialPreset);
    } else if (presetId && $currentOrg.id) {
      const fetched = await orgCertificatePresetsApi.fetchPreset($currentOrg.id, presetId);
      if (fetched) applyPresetData(fetched);
      isLoading = false;
    } else {
      if (initialName) templateName = initialName;
      if (starterTemplateId) design.templateId = starterTemplateId;
      if (initialAccentColor) {
        design.accentColor = initialAccentColor;
        if (design.border) design.border.primaryColor = initialAccentColor;
      }
      if (initialSubtitle) design.subtitle = initialSubtitle;
      isLoading = false;
    }

    if (!stageElement || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => untrack(computeFitZoom));
    observer.observe(stageElement);
    computeFitZoom();
    return () => observer.disconnect();
  });

  const previewData = $derived({
    recipientName: 'Jane Doe',
    courseName: 'Fullstack Engineering Masterclass',
    courseDescription: design.descriptionOverride,
    orgName: $currentOrg.name || 'ACME UNIVERSITY',
    orgLogoUrl: $currentOrg.avatarUrl || undefined,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    certificateId: (design.idFormat ?? 'CERT-{seq}').replace('{seq}', '2026-0042')
  });

  async function handleSave() {
    if (!$currentOrg.id) return;
    isSaving = true;

    try {
      if (activePreset?.id) {
        const updated = await orgCertificatePresetsApi.updatePreset($currentOrg.id, activePreset.id, {
          name: templateName,
          description: design.descriptionOverride,
          design: design as Record<string, unknown>
        });
        if (updated) activePreset = updated;
      } else {
        const created = await orgCertificatePresetsApi.createPreset($currentOrg.id, {
          name: templateName,
          description: design.descriptionOverride,
          design: design as Record<string, unknown>
        });
        if (created) {
          activePreset = created;
          goto(`/org/${orgSlug}/plugins/certificate-studio/editor?id=${created.id}`, { replaceState: true });
        }
      }
    } finally {
      isSaving = false;
    }
  }

  function handleBack() {
    goto(`/org/${orgSlug}/plugins/certificate-studio`);
  }
</script>

<div
  class="flex h-[calc(100dvh-3rem)] w-full flex-col overflow-hidden bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-200"
>
  {#if isLoading}
    <div class="flex h-full items-center justify-center">
      <Loader2Icon class="size-6 animate-spin text-slate-400" />
    </div>
  {:else}
    <StudioHeader
      bind:templateName
      {isSaving}
      onBack={handleBack}
      onPreview={() => (isPreviewModalOpen = true)}
      onSave={handleSave}
    />

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <CanvasStage
        {design}
        {previewData}
        zoom={currentZoom}
        {selectedTool}
        {selectedElement}
        onSelectTool={handleSelectTool}
        onSelectElement={handleSelectElement}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        bind:stageElement
      />

      <InspectorPanel
        {selectedTool}
        {selectedElement}
        onSelectTool={handleSelectTool}
        onSelectElement={handleSelectElement}
        bind:design
      />
    </div>

    <!-- Lightweight Fullscreen Preview Dialog -->
    <Dialog.Root bind:open={isPreviewModalOpen}>
      <Dialog.Content class="flex max-h-[85vh] max-w-3xl flex-col overflow-hidden p-0">
        <Dialog.Header class="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <Dialog.Title class="flex items-center gap-2 text-sm font-bold">
            <EyeIcon class="size-4 text-amber-500" />
            <span>{templateName}</span>
          </Dialog.Title>
        </Dialog.Header>
        <div
          class="flex h-[420px] w-full items-center justify-center overflow-hidden bg-slate-100 p-6 dark:bg-slate-950"
        >
          <Certificate.Preview {design} data={previewData} zoom="fit" showControls class="h-full w-full" />
        </div>
        <Dialog.Footer class="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <Button variant="outline" size="sm" onclick={() => (isPreviewModalOpen = false)}>
            {$t('certificate_studio.close') || 'Close Preview'}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  {/if}
</div>
