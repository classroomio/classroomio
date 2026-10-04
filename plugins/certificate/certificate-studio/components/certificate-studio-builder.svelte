<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { currentOrg } from '$lib/utils/store/org';
  import { orgCertificatePresetsApi, type OrgCertificatePreset } from '$features/plugins';
  import { UnsavedChanges } from '$features/ui';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Certificate } from '@cio/ui';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import { t } from '$lib/utils/functions/translations';
  import {
    resolveCertificateDesign,
    type CertificateDesign,
    type CertificateTemplateId,
    type StoredCertificateDesign
  } from '@cio/certificates';
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
  const initialSubtitle = $derived(page.url.searchParams.get('subtitle') ?? '');

  let activePreset = $state<OrgCertificatePreset | null>(untrack(() => initialPreset));
  let isLoading = $state(untrack(() => Boolean(presetId && !initialPreset)));
  let isSaving = $state(false);
  let isPreviewModalOpen = $state(false);
  let selectedTool = $state<ToolCategory>('borders');
  let selectedElement = $state<StudioElementId | null>(null);
  let savedSnapshot = $state('');
  let hasUnsavedChanges = $state(false);

  function handleSelectElement(el: StudioElementId | null) {
    selectedElement = el;
    if (!el) return;
    if (['header', 'title', 'subtitle', 'recipient', 'date'].includes(el)) {
      selectedTool = 'typography';
    } else if (el === 'course' || el === 'description') {
      selectedTool = 'layout';
    } else if (el === 'badge') {
      selectedTool = 'badges';
    } else if (el === 'signatories') {
      selectedTool = 'signatories';
    } else if (el === 'qrCode') {
      selectedTool = 'qrcode';
    } else if (el === 'border') {
      selectedTool = 'borders';
    }
  }

  function handleSelectTool(tool: ToolCategory) {
    selectedTool = tool;
    if (
      tool === 'typography' &&
      !['header', 'title', 'subtitle', 'recipient', 'date'].includes(selectedElement ?? '')
    ) {
      selectedElement = 'title';
    } else if (tool === 'borders') {
      selectedElement = 'border';
    } else if (tool === 'badges') {
      selectedElement = 'badge';
    } else if (tool === 'layout') {
      selectedElement = 'course';
    } else if (tool === 'signatories') {
      selectedElement = 'signatory-0';
    } else if (tool === 'qrcode') {
      selectedElement = 'qrCode';
    } else if (tool === 'background') {
      selectedElement = 'background';
    }
  }

  let templateName = $state('');

  // Reactive unified design state
  let design = $state<CertificateDesign>({
    rendererTemplateId: 'modular',
    templateId: 'classique',
    accentColor: '#d4af37',
    subtitle: '',
    descriptionOverride: undefined,
    idFormat: 'CERT-{seq}',
    signatories: [
      { id: 'sig-1', name: 'Course Facilitator', role: 'Facilitator', enabled: true },
      { id: 'sig-2', name: 'Organization Lead', role: 'Director', enabled: true }
    ],
    elements: {},
    copy: {},
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
      foilColor: '#d4af37'
    },
    qrCode: {
      enabled: true,
      position: 'bottom_right'
    }
  });

  const currentSnapshot = $derived(JSON.stringify({ templateName, design }));

  $effect(() => {
    hasUnsavedChanges = savedSnapshot !== '' && currentSnapshot !== savedSnapshot;
  });

  function applyPresetData(p: OrgCertificatePreset) {
    activePreset = p;
    templateName = p.name;
    const resolved = resolveCertificateDesign({
      design: p.design as StoredCertificateDesign,
      theme: p.design?.templateId
    });
    const signatories =
      resolved.signatories && resolved.signatories.length > 0
        ? resolved.signatories
        : [
            { id: 'sig-1', name: 'Course Facilitator', role: 'Facilitator', enabled: true },
            { id: 'sig-2', name: 'Organization Lead', role: 'Director', enabled: true }
          ];
    design = {
      ...resolved,
      signatories,
      rendererTemplateId: 'modular',
      sourcePresetId: p.id,
      elements: resolved.elements ?? {},
      copy: resolved.copy ?? {},
      border: resolved.border ?? {
        style: 'victorian',
        width: 12,
        primaryColor: resolved.accentColor,
        accentColor: '#85581a'
      },
      typography: resolved.typography ?? {
        titleFont: 'Bodoni Moda',
        recipientFont: 'Great Vibes',
        bodyFont: 'Cormorant Garamond',
        primaryColor: '#1a1a2e',
        letterSpacing: 0.05
      },
      background: resolved.background ?? {
        style: 'parchment',
        primaryColor: '#faf8f2',
        secondaryColor: '#f3ede0'
      },
      badge: resolved.badge ?? {
        style: 'gold_seal',
        foilColor: resolved.accentColor
      },
      qrCode: resolved.qrCode ?? {
        enabled: true,
        position: 'bottom_right'
      }
    };
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

  onMount(() => {
    let isDisposed = false;
    let resizeObserver: ResizeObserver | null = null;

    async function initializeStudio() {
      if (initialPreset) {
        applyPresetData(initialPreset);
      } else if (presetId && $currentOrg.id) {
        const fetched = await orgCertificatePresetsApi.fetchPreset($currentOrg.id, presetId);
        if (isDisposed) return;

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

      if (isDisposed) return;

      savedSnapshot = currentSnapshot;

      if (!stageElement || typeof ResizeObserver === 'undefined') return;
      resizeObserver = new ResizeObserver(() => untrack(computeFitZoom));
      resizeObserver.observe(stageElement);
      computeFitZoom();
    }

    void initializeStudio();

    return () => {
      isDisposed = true;
      resizeObserver?.disconnect();
    };
  });

  const previewData = $derived({
    recipientName: 'Jane Doe',
    courseName: 'Fullstack Engineering Masterclass',
    courseDescription:
      design.descriptionOverride ??
      'For successfully mastering Fullstack Engineering and demonstrating leadership and academic rigor.',
    orgName: $currentOrg.name || 'ACME UNIVERSITY',
    orgLogoUrl: $currentOrg.avatarUrl || undefined,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    certificateId: (design.idFormat ?? 'CERT-{seq}').replace('{seq}', '2026-0042')
  });

  async function handleSave() {
    if (!$currentOrg.id || !templateName.trim()) return;
    isSaving = true;
    const normalizedTemplateName = templateName.trim();

    // Clean up any orphaned signatory element layouts beyond current signatories count
    if (design.elements) {
      const activeCount = (design.signatories ?? []).length;
      for (let i = activeCount; i <= 3; i++) {
        delete design.elements[`signatory-${i}` as StudioElementId];
      }
    }

    try {
      if (activePreset?.id) {
        const updated = await orgCertificatePresetsApi.updatePreset($currentOrg.id, activePreset.id, {
          name: normalizedTemplateName,
          description: design.descriptionOverride,
          design: design as Record<string, unknown>
        });
        if (updated) {
          applyPresetData(updated);
          savedSnapshot = currentSnapshot;
          hasUnsavedChanges = false;
        }
      } else {
        const created = await orgCertificatePresetsApi.createPreset($currentOrg.id, {
          name: normalizedTemplateName,
          description: design.descriptionOverride,
          design: design as Record<string, unknown>
        });
        if (created) {
          applyPresetData(created);
          savedSnapshot = currentSnapshot;
          hasUnsavedChanges = false;
          await goto(`/org/${orgSlug}/plugins/certificate-studio/editor?id=${created.id}`, { replaceState: true });
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

<UnsavedChanges bind:hasUnsavedChanges />

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
      saveDisabled={!templateName.trim()}
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
            {$t('certificate_studio.close')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  {/if}
</div>
