<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { orgCertificatePresetsApi } from '$features/plugins';
  import type { CertificateDesign, CertificateTemplateId } from '@cio/certificates';
  import type {
    ToolCategory,
    SelectedElement,
    TypographyTarget,
    CertificateStudioProps,
    OrgCertificatePreset
  } from '../types';

  import StudioHeader from './studio-header.svelte';
  import CanvasStage from './canvas-stage.svelte';
  import CanvasToolbar from './canvas-toolbar.svelte';
  import InspectorPanel from './inspector-panel.svelte';
  import PreviewModal from './preview-modal.svelte';

  let {
    orgSlug,
    preset = null,
    starterTemplateId = 'classique',
    initialName = '',
    initialAccentColor = '#d4af37',
    initialSubtitle = 'PROUDLY PRESENTED TO',
    onSaveSuccess,
    onBack
  }: CertificateStudioProps = $props();

  let selectedTool = $state<ToolCategory>('borders');
  let selectedElement = $state<SelectedElement>('border');
  let isPreviewModalOpen = $state(false);

  // Template metadata
  let templateName = $state(preset?.name || initialName || 'Acme Honors Gold 2026');
  let description = $state(preset?.description || '');

  // Design modular state
  const rawDesign = (preset?.design as Record<string, any>) ?? {};
  let layout = $state<string>(rawDesign.rendererTemplateId || rawDesign.templateId || starterTemplateId || 'classique');
  let subtitle = $state<string>(rawDesign.subtitle || initialSubtitle || 'PROUDLY PRESENTED TO');
  let descriptionOverride = $state<string>(
    rawDesign.descriptionOverride ||
      'For successfully mastering Fullstack Engineering and demonstrating leadership and academic rigor.'
  );
  let idFormat = $state<string>(rawDesign.idFormat || 'ACM-{seq}');

  // Border state
  const rawBorder = rawDesign.border ?? {};
  let borderStyle = $state<'victorian' | 'double_gold' | 'geometric' | 'minimal' | 'custom_svg'>(
    rawBorder.style || (layout === 'poster' ? 'geometric' : layout === 'minimal' ? 'minimal' : 'victorian')
  );
  let borderWidth = $state<number>(rawBorder.width ?? 12);
  let primaryColor = $state<string>(rawBorder.primaryColor || rawDesign.accentColor || initialAccentColor || '#d4af37');
  let cornerAccent = $state<string>(rawBorder.accentColor || '#85581a');
  let customSvg = $state<string>(rawBorder.customSvg || '');

  // Typography state
  const rawTypo = rawDesign.typography ?? {};
  let typographyTarget = $state<TypographyTarget>('recipient');
  let titleFont = $state<string>(rawTypo.titleFont || 'Bodoni Moda');
  let titleSize = $state<number>(rawTypo.titleSize ?? 38);
  let recipientFont = $state<string>(rawTypo.recipientFont || 'Great Vibes');
  let recipientSize = $state<number>(rawTypo.recipientSize ?? 56);
  let bodyFont = $state<string>(rawTypo.bodyFont || 'Cormorant Garamond');
  let bodySize = $state<number>(rawTypo.bodySize ?? 15);
  let textColor = $state<string>(rawTypo.primaryColor || '#1a1a2e');
  let letterSpacing = $state<number>(rawTypo.letterSpacing ?? 0.05);

  // Background state
  const rawBg = rawDesign.background ?? {};
  let bgStyle = $state<'parchment' | 'guilloche' | 'solid' | 'gradient'>(
    rawBg.style || (layout === 'noir' ? 'solid' : 'parchment')
  );
  let bgPrimary = $state<string>(rawBg.primaryColor || (layout === 'noir' ? '#0f172a' : '#faf8f2'));
  let bgSecondary = $state<string>(rawBg.secondaryColor || (layout === 'noir' ? '#1e293b' : '#f3ede0'));

  // Badge state
  const rawBadge = rawDesign.badge ?? {};
  let badgeStyle = $state<'gold_seal' | 'ribbon' | 'wax_stamp' | 'crest' | 'none'>(
    rawBadge.style || (layout === 'minimal' ? 'none' : 'gold_seal')
  );
  let badgeLabel = $state<string>(rawBadge.label || 'OFFICIAL SEAL');
  let foilColor = $state<string>(rawBadge.foilColor || primaryColor || '#d4af37');

  // QR Code state
  const rawQr = rawDesign.qrCode ?? {};
  let qrEnabled = $state<boolean>(rawQr.enabled ?? true);
  let qrPosition = $state<'bottom_right' | 'bottom_left' | 'center'>(rawQr.position || 'bottom_right');

  // Signatories state
  const rawSigs = Array.isArray(rawDesign.signatories) ? rawDesign.signatories : [];
  let sig1Name = $state<string>(rawSigs[0]?.name || 'Dr. Robert Ford');
  let sig1Role = $state<string>(rawSigs[0]?.role || 'Dean of Academics');
  let sig1Enabled = $state<boolean>(rawSigs[0]?.enabled ?? true);
  let sig1SignatureUrl = $state<string>(rawSigs[0]?.signatureUrl || '');

  let sig2Name = $state<string>(rawSigs[1]?.name || 'Sarah Dean');
  let sig2Role = $state<string>(rawSigs[1]?.role || 'Lead Instructor');
  let sig2Enabled = $state<boolean>(rawSigs[1]?.enabled ?? true);
  let sig2SignatureUrl = $state<string>(rawSigs[1]?.signatureUrl || '');

  // Canvas zoom & guides
  let manualZoom = $state<number | null>(null);
  let fitZoom = $state<number>(0.65);
  let showGrid = $state(false);
  let showRulers = $state(false);
  let stageElement = $state<HTMLDivElement | null>(null);

  const zoomPercent = $derived(Math.round((manualZoom ?? fitZoom) * 100));

  function clampZoom(val: number) {
    return Math.max(0.25, Math.min(1.8, val));
  }

  function handleZoomIn() {
    manualZoom = clampZoom((manualZoom ?? fitZoom) + 0.1);
  }

  function handleZoomOut() {
    manualZoom = clampZoom((manualZoom ?? fitZoom) - 0.1);
  }

  function handleFit() {
    manualZoom = null;
  }

  function computeFitZoom() {
    if (!stageElement) return;
    const rect = stageElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const horizontalScale = (rect.width - 48) / 1100;
    const verticalScale = (rect.height - 96) / 780;
    fitZoom = clampZoom(Math.min(horizontalScale, verticalScale));
  }

  onMount(() => {
    if (!stageElement || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => untrack(computeFitZoom));
    observer.observe(stageElement);
    computeFitZoom();
    return () => observer.disconnect();
  });

  // Compose dynamic certificate design
  const compiledDesign = $derived<CertificateDesign>({
    rendererTemplateId: 'modular',
    templateId: layout,
    accentColor: primaryColor,
    subtitle,
    descriptionOverride,
    idFormat,
    signatories: [
      { name: sig1Name, role: sig1Role, enabled: sig1Enabled, signatureUrl: sig1SignatureUrl || undefined },
      { name: sig2Name, role: sig2Role, enabled: sig2Enabled, signatureUrl: sig2SignatureUrl || undefined }
    ],
    border: {
      style: borderStyle,
      width: borderWidth,
      primaryColor,
      accentColor: cornerAccent,
      customSvg: borderStyle === 'custom_svg' ? customSvg : undefined
    },
    typography: {
      titleFont,
      recipientFont,
      bodyFont,
      primaryColor: textColor,
      letterSpacing
    },
    background: {
      style: bgStyle,
      primaryColor: bgPrimary,
      secondaryColor: bgSecondary
    },
    badge: {
      style: badgeStyle,
      label: badgeLabel,
      foilColor
    },
    qrCode: {
      enabled: qrEnabled,
      position: qrPosition
    }
  });

  const previewData = $derived({
    recipientName: 'Jane Doe',
    courseName: 'Fullstack Engineering Masterclass',
    courseDescription: descriptionOverride,
    orgName: $currentOrg.name || 'ACME UNIVERSITY OF TECHNOLOGY',
    orgLogoUrl: $currentOrg.avatarUrl || undefined,
    date: 'Sept 2026',
    certificateId: idFormat.replace('{seq}', '992011')
  });

  function selectTool(tool: ToolCategory, element?: SelectedElement) {
    selectedTool = tool;
    if (element) {
      selectedElement = element;
      return;
    }

    switch (tool) {
      case 'layout':
        selectedElement = 'layout';
        break;
      case 'borders':
        selectedElement = 'border';
        break;
      case 'typography':
        selectedElement = typographyTarget;
        break;
      case 'badges':
        selectedElement = 'badge';
        break;
      case 'qrcode':
        selectedElement = 'qrcode';
        break;
      case 'signatories':
        selectedElement = 'signatories';
        break;
      case 'background':
        selectedElement = 'background';
        break;
    }
  }

  function handleHotspotClick(element: SelectedElement) {
    selectedElement = element;
    switch (element) {
      case 'border':
        selectedTool = 'borders';
        break;
      case 'recipient':
      case 'title':
      case 'body':
        selectedTool = 'typography';
        typographyTarget = element;
        break;
      case 'badge':
        selectedTool = 'badges';
        break;
      case 'qrcode':
        selectedTool = 'qrcode';
        break;
      case 'signatories':
        selectedTool = 'signatories';
        break;
      case 'background':
        selectedTool = 'background';
        break;
      case 'layout':
        selectedTool = 'layout';
        break;
    }
  }

  async function handleSave() {
    if (!$currentOrg.id) return;
    const designPayload = {
      rendererTemplateId: 'modular',
      templateId: layout,
      accentColor: primaryColor,
      subtitle,
      descriptionOverride,
      idFormat,
      signatories: [
        { name: sig1Name, role: sig1Role, enabled: sig1Enabled, signatureUrl: sig1SignatureUrl || undefined },
        { name: sig2Name, role: sig2Role, enabled: sig2Enabled, signatureUrl: sig2SignatureUrl || undefined }
      ],
      border: {
        style: borderStyle,
        width: borderWidth,
        primaryColor,
        accentColor: cornerAccent,
        customSvg: borderStyle === 'custom_svg' ? customSvg : undefined
      },
      typography: {
        titleFont,
        titleSize,
        recipientFont,
        recipientSize,
        bodyFont,
        bodySize,
        primaryColor: textColor,
        letterSpacing
      },
      background: {
        style: bgStyle,
        primaryColor: bgPrimary,
        secondaryColor: bgSecondary
      },
      badge: {
        style: badgeStyle,
        label: badgeLabel,
        foilColor
      },
      qrCode: {
        enabled: qrEnabled,
        position: qrPosition
      }
    };

    if (preset?.id) {
      const updated = await orgCertificatePresetsApi.updatePreset($currentOrg.id, preset.id, {
        name: templateName,
        description,
        design: designPayload
      });
      if (updated && onSaveSuccess) onSaveSuccess(updated);
    } else {
      const created = await orgCertificatePresetsApi.createPreset($currentOrg.id, {
        name: templateName,
        description,
        design: designPayload
      });
      if (created) {
        if (onSaveSuccess) onSaveSuccess(created);
        await goto(`/org/${orgSlug}/plugins/certificate-studio/editor?id=${created.id}`, { replaceState: true });
      }
    }
  }

  function handleBackNavigation() {
    if (onBack) {
      onBack();
    } else {
      goto(`/org/${orgSlug}/plugins/certificate-studio`);
    }
  }
</script>

<svelte:head>
  <title>{templateName} - {$t('certificate_studio.sidebar_title')} - ClassroomIO</title>
</svelte:head>

<div class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
  <StudioHeader
    bind:templateName
    isSaving={orgCertificatePresetsApi.isSaving}
    onBack={handleBackNavigation}
    onPreview={() => (isPreviewModalOpen = true)}
    onSave={handleSave}
  />

  <!-- 2-COLUMN STUDIO LAYOUT: CANVAS WITH FIGMA FLOATING DOCK + INSPECTOR -->
  <div class="flex min-h-0 w-full min-w-0 flex-1 overflow-hidden">
    <!-- CENTER COLUMN: LIVE CANVAS & TOOLBAR -->
    <div class="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <CanvasStage
        {compiledDesign}
        {previewData}
        zoom={manualZoom ?? fitZoom}
        {showGrid}
        {showRulers}
        {selectedElement}
        {selectedTool}
        onSelectTool={selectTool}
        onHotspotClick={handleHotspotClick}
        bind:stageElement
      />

      <CanvasToolbar
        {zoomPercent}
        bind:showGrid
        bind:showRulers
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
      />
    </div>

    <!-- RIGHT COLUMN: PROPERTIES INSPECTOR -->
    <InspectorPanel
      {selectedTool}
      {selectedElement}
      bind:borderStyle
      bind:borderWidth
      bind:primaryColor
      bind:cornerAccent
      bind:customSvg
      bind:typographyTarget
      bind:titleFont
      bind:titleSize
      bind:recipientFont
      bind:recipientSize
      bind:bodyFont
      bind:bodySize
      bind:textColor
      bind:letterSpacing
      bind:badgeStyle
      bind:badgeLabel
      bind:foilColor
      bind:qrEnabled
      bind:idFormat
      bind:bgStyle
      bind:bgPrimary
      bind:bgSecondary
      bind:sig1Enabled
      bind:sig1Name
      bind:sig1Role
      bind:sig1SignatureUrl
      bind:sig2Enabled
      bind:sig2Name
      bind:sig2Role
      bind:sig2SignatureUrl
      bind:subtitle
      bind:descriptionOverride
      bind:description
    />
  </div>
</div>

<!-- PREVIEW MODAL -->
<PreviewModal bind:open={isPreviewModalOpen} {templateName} {compiledDesign} {previewData} />
