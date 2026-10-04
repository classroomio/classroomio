<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Switch } from '@cio/ui/base/switch';
  import * as Select from '@cio/ui/base/select';
  import * as Field from '@cio/ui/base/field';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import AlignCenterIcon from '@lucide/svelte/icons/align-center';
  import AlignCenterVerticalIcon from '@lucide/svelte/icons/align-center-vertical';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import { t } from '$lib/utils/functions/translations';
  import type { CertificateDesign } from '@cio/certificates';
  import { FONT_OPTIONS, PALETTE_SWATCHES, type ToolCategory, type StudioElementId } from '../types';

  interface Props {
    selectedTool: ToolCategory;
    selectedElement?: StudioElementId | null;
    onSelectTool?: (tool: ToolCategory) => void;
    onSelectElement?: (element: StudioElementId | null) => void;
    design: CertificateDesign;
  }

  let {
    selectedTool = 'borders',
    selectedElement = null,
    onSelectTool = () => {},
    onSelectElement = () => {},
    design = $bindable()
  }: Props = $props();

  const ALL_ELEMENTS: {
    id: StudioElementId;
    labelKey: string;
    tool: ToolCategory;
    canHide: boolean;
  }[] = [
    {
      id: 'header',
      labelKey: 'certificate_studio.org_name',
      tool: 'typography',
      canHide: true
    },
    {
      id: 'title',
      labelKey: 'certificate_studio.certificate_title',
      tool: 'typography',
      canHide: true
    },
    {
      id: 'subtitle',
      labelKey: 'certificate_studio.presentation_line',
      tool: 'typography',
      canHide: true
    },
    {
      id: 'recipient',
      labelKey: 'certificate_studio.target_recipient',
      tool: 'typography',
      canHide: false
    },
    {
      id: 'course',
      labelKey: 'certificate_studio.course_title',
      tool: 'layout',
      canHide: false
    },
    {
      id: 'description',
      labelKey: 'certificate_studio.course_description',
      tool: 'layout',
      canHide: true
    },
    {
      id: 'date',
      labelKey: 'certificate_studio.conferment_date',
      tool: 'typography',
      canHide: true
    },
    {
      id: 'badge',
      labelKey: 'certificate_studio.element_badge',
      tool: 'badges',
      canHide: true
    },
    {
      id: 'signatories',
      labelKey: 'certificate_studio.tool_signatories',
      tool: 'signatories',
      canHide: true
    },
    {
      id: 'qrCode',
      labelKey: 'certificate_studio.qr_credential',
      tool: 'qrcode',
      canHide: true
    },
    {
      id: 'border',
      labelKey: 'certificate_studio.element_border',
      tool: 'borders',
      canHide: true
    },
    {
      id: 'background',
      labelKey: 'certificate_studio.tool_background',
      tool: 'background',
      canHide: false
    }
  ];

  // Ensure nested objects exist to avoid undefined errors
  $effect.pre(() => {
    if (!design.elements) design.elements = {};
    if (!design.copy) design.copy = {};
    if (!design.border) design.border = { style: 'victorian', width: 12, primaryColor: design.accentColor };
    if (!design.typography)
      design.typography = {
        titleFont: 'Bodoni Moda',
        recipientFont: 'Great Vibes',
        bodyFont: 'Cormorant Garamond',
        primaryColor: '#1a1a2e',
        letterSpacing: 0.05
      };
    if (!design.background)
      design.background = { style: 'parchment', primaryColor: '#faf8f2', secondaryColor: '#f3ede0' };
    if (!design.badge) design.badge = { style: 'gold_seal', foilColor: design.accentColor };
    if (!design.qrCode) design.qrCode = { enabled: true, position: 'bottom_right' };
    if (!design.signatories) {
      design.signatories = [
        { id: 'sig-1', name: 'Dr. Robert Ford', role: 'Dean of Academics', enabled: true },
        { id: 'sig-2', name: 'Sarah Dean', role: 'Lead Instructor', enabled: true }
      ];
    }
  });

  let activeTypoTarget = $state<'copy' | 'title' | 'recipient' | 'body'>('copy');

  const BORDER_OPTIONS = [
    { value: 'victorian', labelKey: 'certificate_studio.border_victorian' },
    { value: 'double_gold', labelKey: 'certificate_studio.border_double_gold' },
    { value: 'geometric', labelKey: 'certificate_studio.border_geometric' },
    { value: 'minimal', labelKey: 'certificate_studio.border_minimal' }
  ] as const;
  const BADGE_OPTIONS = [
    { value: 'gold_seal', labelKey: 'certificate_studio.badge_gold_seal' },
    { value: 'ribbon', labelKey: 'certificate_studio.badge_ribbon' },
    { value: 'wax_stamp', labelKey: 'certificate_studio.badge_wax_stamp' },
    { value: 'none', labelKey: 'certificate_studio.badge_none' }
  ] as const;
  const QR_POSITION_OPTIONS = [
    { value: 'bottom_right', labelKey: 'certificate_studio.pos_bottom_right' },
    { value: 'bottom_left', labelKey: 'certificate_studio.pos_bottom_left' },
    { value: 'center_footer', labelKey: 'certificate_studio.pos_center_footer' },
    { value: 'top_right', labelKey: 'certificate_studio.pos_top_right' }
  ] as const;
  const BACKGROUND_OPTIONS = [
    { value: 'parchment', labelKey: 'certificate_studio.bg_parchment' },
    { value: 'guilloche', labelKey: 'certificate_studio.bg_guilloche' },
    { value: 'solid', labelKey: 'certificate_studio.bg_solid' },
    { value: 'gradient', labelKey: 'certificate_studio.bg_gradient' }
  ] as const;

  const BACKGROUND_SWATCHES = [
    { label: 'Parchment', primary: '#FAF8F2', secondary: '#F3EDE0' },
    { label: 'White', primary: '#FFFFFF', secondary: '#F5F5F7' },
    { label: 'Cream', primary: '#FFFDF5', secondary: '#F7F1DF' },
    { label: 'Antique', primary: '#F5F2EB', secondary: '#EAE3D6' },
    { label: 'Alabaster', primary: '#F0F4F8', secondary: '#E1E8F0' },
    { label: 'Pearl', primary: '#F7F5F0', secondary: '#EDE7DC' },
    { label: 'Noir', primary: '#111215', secondary: '#1E2026' },
    { label: 'Midnight', primary: '#0B132B', secondary: '#1C2541' },
    { label: 'Forest', primary: '#0D2818', secondary: '#19442B' },
    { label: 'Burgundy', primary: '#2B0C14', secondary: '#471623' }
  ] as const;

  const DEFAULT_ELEMENT_RECTS: Record<StudioElementId, { x: number; y: number; width: number; height: number }> = {
    header: { x: 160, y: 45, width: 780, height: 35 },
    title: { x: 140, y: 90, width: 820, height: 95 },
    subtitle: { x: 160, y: 155, width: 780, height: 35 },
    recipient: { x: 160, y: 210, width: 780, height: 95 },
    course: { x: 160, y: 320, width: 780, height: 50 },
    description: { x: 160, y: 375, width: 780, height: 60 },
    date: { x: 350, y: 450, width: 400, height: 30 },
    badge: { x: 495, y: 580, width: 110, height: 110 },
    signatories: { x: 110, y: 575, width: 880, height: 130 },
    qrCode: { x: 915, y: 690, width: 155, height: 60 },
    border: { x: 12, y: 12, width: 1076, height: 756 },
    background: { x: 0, y: 0, width: 1100, height: 780 }
  };

  function isElementVisible(id: StudioElementId): boolean {
    if (id === 'background') return true;
    if (id === 'border') return design.elements?.border?.enabled !== false;
    if (id === 'badge') return design.elements?.badge?.enabled !== false && design.badge?.style !== 'none';
    if (id === 'qrCode') return design.elements?.qrCode?.enabled !== false && design.qrCode?.enabled !== false;
    return design.elements?.[id]?.enabled !== false;
  }

  function toggleElementVisibility(id: StudioElementId) {
    if (!design.elements) design.elements = {};
    const currentlyVisible = isElementVisible(id);
    design.elements[id] = {
      ...design.elements[id],
      enabled: !currentlyVisible
    };

    if (id === 'badge' && !currentlyVisible && design.badge?.style === 'none') {
      design.badge.style = 'gold_seal';
    }
    if (id === 'qrCode' && design.qrCode) {
      design.qrCode.enabled = !currentlyVisible;
    }

    if (!currentlyVisible) {
      onSelectElement(id);
      const match = ALL_ELEMENTS.find((e) => e.id === id);
      if (match) onSelectTool(match.tool);
    } else if (selectedElement === id) {
      onSelectElement(null);
    }
  }

  function addSignatory() {
    if (!design.signatories) design.signatories = [];
    if (design.signatories.length >= 3) return;
    design.signatories.push({
      id: `sig-${crypto.randomUUID()}`,
      name: '',
      role: '',
      enabled: true
    });
    if (!design.elements) design.elements = {};
    design.elements.signatories = { ...design.elements.signatories, enabled: true };
  }

  function removeSignatory(index: number) {
    if (!design.signatories) return;
    design.signatories.splice(index, 1);

    if (design.elements) {
      // Re-index remaining signatory element layouts
      const remainingCount = design.signatories.length;
      for (let i = index; i < remainingCount; i++) {
        const nextKey = `signatory-${i + 1}` as StudioElementId;
        const currentKey = `signatory-${i}` as StudioElementId;
        if (design.elements[nextKey]) {
          design.elements[currentKey] = design.elements[nextKey];
        } else {
          delete design.elements[currentKey];
        }
      }
      // Clean up any remaining slots beyond new count
      for (let i = remainingCount; i <= 3; i++) {
        delete design.elements[`signatory-${i}` as StudioElementId];
      }
    }

    if (selectedElement === `signatory-${index}` || selectedElement === `signatory-${design.signatories.length}`) {
      onSelectElement(null);
    }
  }

  function updateElementCoordinate(id: StudioElementId, axis: 'x' | 'y', value: string) {
    const parsedValue = Number.parseInt(value, 10);
    const defaults = DEFAULT_ELEMENT_RECTS[id];
    const current = design.elements?.[id];

    if (!design.elements) design.elements = {};
    if (Number.isNaN(parsedValue)) {
      design.elements[id] = { ...current, positionMode: 'auto', x: undefined, y: undefined };

      return;
    }

    const width = current?.width ?? defaults.width;
    const height = current?.height ?? defaults.height;
    const x = axis === 'x' ? Math.max(0, Math.min(1100 - width, parsedValue)) : (current?.x ?? defaults.x);
    const y = axis === 'y' ? Math.max(0, Math.min(780 - height, parsedValue)) : (current?.y ?? defaults.y);

    design.elements[id] = {
      ...current,
      enabled: true,
      positionMode: 'custom',
      x,
      y,
      width,
      height
    };
  }

  function updateElementDimension(id: StudioElementId, dimension: 'width' | 'height', value: string) {
    const parsedValue = Number.parseInt(value, 10);
    const defaults = DEFAULT_ELEMENT_RECTS[id] ?? { x: 100, y: 100, width: 200, height: 50 };
    const current = design.elements?.[id];

    if (!design.elements) design.elements = {};
    if (Number.isNaN(parsedValue)) {
      if (current) {
        design.elements[id] = { ...current, [dimension]: undefined };
      }
      return;
    }

    const minWidth = 40;
    const minHeight = 24;
    const x = current?.x ?? defaults.x;
    const y = current?.y ?? defaults.y;
    let width =
      dimension === 'width' ? Math.max(minWidth, Math.min(1100 - x, parsedValue)) : (current?.width ?? defaults.width);
    let height =
      dimension === 'height'
        ? Math.max(minHeight, Math.min(780 - y, parsedValue))
        : (current?.height ?? defaults.height);

    if (id === 'badge') {
      const size = Math.max(width, height);
      width = size;
      height = size;
    }

    design.elements[id] = {
      ...current,
      enabled: true,
      positionMode: 'custom',
      x,
      y,
      width,
      height
    };
  }

  function centerElementHorizontally(id: StudioElementId) {
    const defaults = DEFAULT_ELEMENT_RECTS[id];
    const current = design.elements?.[id];
    const width = current?.width ?? defaults.width;

    if (!design.elements) design.elements = {};
    design.elements[id] = {
      ...current,
      enabled: true,
      positionMode: 'custom',
      x: Math.round((1100 - width) / 2),
      y: current?.y ?? defaults.y,
      width,
      height: current?.height ?? defaults.height
    };
  }

  function centerElementVertically(id: StudioElementId) {
    const defaults = DEFAULT_ELEMENT_RECTS[id];
    const current = design.elements?.[id];
    const height = current?.height ?? defaults.height;

    if (!design.elements) design.elements = {};
    design.elements[id] = {
      ...current,
      enabled: true,
      positionMode: 'custom',
      x: current?.x ?? defaults.x,
      y: Math.round((780 - height) / 2),
      width: current?.width ?? defaults.width,
      height
    };
  }

  function handleQrEnabledChange(enabled: boolean) {
    if (!design.qrCode) design.qrCode = {};
    if (!design.elements) design.elements = {};

    design.qrCode.enabled = enabled;
    design.elements.qrCode = { ...design.elements.qrCode, enabled };
  }

  function handleQrPositionChange(value: string | undefined) {
    const position = QR_POSITION_OPTIONS.find((option) => option.value === value)?.value;
    if (!position || !design.qrCode) return;

    design.qrCode.position = position;
    if (!design.elements) design.elements = {};
    design.elements.qrCode = {
      ...design.elements.qrCode,
      positionMode: 'auto',
      x: undefined,
      y: undefined
    };
  }

  const selectedElementMeta = $derived(
    ALL_ELEMENTS.find((e) => e.id === selectedElement) ??
      (typeof selectedElement === 'string' && selectedElement.startsWith('signatory-')
        ? ALL_ELEMENTS.find((e) => e.id === 'signatories')
        : undefined)
  );
  const currentElementLayout = $derived(selectedElement ? design.elements?.[selectedElement] : undefined);
</script>

<aside
  class="flex min-h-0 w-80 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
>
  <!-- Top header -->
  <div class="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
    <div class="flex items-center justify-between">
      <h2 class="text-xs font-bold tracking-wider text-slate-400 uppercase">
        {$t('certificate_studio.inspector')}
      </h2>
      <Badge
        variant="secondary"
        class="bg-amber-100 font-medium text-amber-900 capitalize dark:bg-amber-950/60 dark:text-amber-200"
      >
        {selectedTool}
      </Badge>
    </div>
  </div>

  <!-- Elements Shelf / Layers -->
  <div class="border-b border-slate-100 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
    <div class="mb-1.5 flex items-center justify-between">
      <span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        {$t('certificate_studio.elements_on_canvas')}
      </span>
      {#if selectedElement}
        <button
          type="button"
          class="text-[10px] text-amber-600 hover:underline dark:text-amber-400"
          onclick={() => onSelectElement(null)}
        >
          {$t('certificate_studio.deselect')}
        </button>
      {/if}
    </div>

    <div class="flex flex-wrap gap-1">
      {#each ALL_ELEMENTS as item (item.id)}
        {@const visible = isElementVisible(item.id)}
        {@const isSelected =
          selectedElement === item.id ||
          (item.id === 'signatories' &&
            typeof selectedElement === 'string' &&
            selectedElement.startsWith('signatory-'))}
        <div
          class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-all {isSelected
            ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
            : visible
              ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              : 'border-dashed border-slate-300 bg-slate-100/70 text-slate-400 hover:border-amber-400 dark:border-slate-800 dark:bg-slate-900/40'}"
        >
          <button
            type="button"
            class="text-left font-medium"
            onclick={() => {
              if (!visible) toggleElementVisibility(item.id);
              if (item.id === 'signatories') {
                onSelectElement('signatory-0');
              } else {
                onSelectElement(item.id);
              }
              onSelectTool(item.tool);
            }}
          >
            {$t(item.labelKey)}
          </button>

          {#if item.canHide}
            <button
              type="button"
              class="rounded p-0.5 transition-colors hover:bg-black/10 active:scale-90"
              title={visible ? $t('certificate_studio.hide_element') : $t('certificate_studio.show_element')}
              aria-label={visible ? $t('certificate_studio.hide_element') : $t('certificate_studio.show_element')}
              onclick={(e) => {
                e.stopPropagation();
                toggleElementVisibility(item.id);
              }}
            >
              {#if visible}
                <EyeIcon class="size-3 text-slate-400 {isSelected ? 'text-white' : ''}" />
              {:else}
                <PlusIcon class="size-3 text-amber-600 dark:text-amber-400" />
              {/if}
            </button>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div class="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
    <!-- Active Element Coordinates & Alignment Widget -->
    {#if selectedElement && selectedElementMeta && selectedElement !== 'border' && selectedElement !== 'background'}
      <div
        class="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 dark:border-amber-950/80 dark:bg-amber-950/20"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="text-[10px] font-bold text-amber-900 uppercase dark:text-amber-200">
            {typeof selectedElement === 'string' && selectedElement.startsWith('signatory-')
              ? `${$t('certificate_studio.tool_signatories')} (${Number(selectedElement.split('-')[1]) + 1})`
              : $t(selectedElementMeta.labelKey)}
          </span>
          <span
            class="rounded bg-amber-200/80 px-1 py-0.5 font-mono text-[9px] text-amber-950 dark:bg-amber-900 dark:text-amber-200"
          >
            {currentElementLayout?.positionMode === 'custom'
              ? $t('certificate_studio.pos_mode_custom')
              : $t('certificate_studio.pos_mode_auto')}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <Field.Label for="certificate-element-x" class="text-[10px] font-semibold text-slate-500">
              {$t('certificate_studio.x_position')}
            </Field.Label>
            <Input
              id="certificate-element-x"
              type="number"
              placeholder={$t('certificate_studio.pos_mode_auto')}
              value={currentElementLayout?.positionMode === 'custom' ? (currentElementLayout.x ?? '') : ''}
              oninput={(event) => updateElementCoordinate(selectedElement, 'x', event.currentTarget.value)}
              class="h-7 font-mono text-xs"
            />
          </div>
          <div>
            <Field.Label for="certificate-element-y" class="text-[10px] font-semibold text-slate-500">
              {$t('certificate_studio.y_position')}
            </Field.Label>
            <Input
              id="certificate-element-y"
              type="number"
              placeholder={$t('certificate_studio.pos_mode_auto')}
              value={currentElementLayout?.positionMode === 'custom' ? (currentElementLayout.y ?? '') : ''}
              oninput={(event) => updateElementCoordinate(selectedElement, 'y', event.currentTarget.value)}
              class="h-7 font-mono text-xs"
            />
          </div>
        </div>

        <div class="mt-2 grid grid-cols-2 gap-2">
          <div>
            <Field.Label for="certificate-element-w" class="text-[10px] font-semibold text-slate-500">
              {$t('certificate_studio.width')}
            </Field.Label>
            <Input
              id="certificate-element-w"
              type="number"
              placeholder={$t('certificate_studio.pos_mode_auto')}
              value={currentElementLayout?.positionMode === 'custom' ? (currentElementLayout.width ?? '') : ''}
              oninput={(event) => {
                if (selectedElement) updateElementDimension(selectedElement, 'width', event.currentTarget.value);
              }}
              class="h-7 font-mono text-xs"
            />
          </div>
          <div>
            <Field.Label for="certificate-element-h" class="text-[10px] font-semibold text-slate-500">
              {$t('certificate_studio.height')}
            </Field.Label>
            <Input
              id="certificate-element-h"
              type="number"
              placeholder={$t('certificate_studio.pos_mode_auto')}
              value={currentElementLayout?.positionMode === 'custom' ? (currentElementLayout.height ?? '') : ''}
              oninput={(event) => {
                if (selectedElement) updateElementDimension(selectedElement, 'height', event.currentTarget.value);
              }}
              class="h-7 font-mono text-xs"
            />
          </div>
        </div>

        <div
          class="mt-2.5 flex flex-wrap items-center gap-1 border-t border-amber-200/60 pt-2 dark:border-amber-900/60"
        >
          <Button
            variant="outline"
            size="sm"
            class="h-6 gap-1 px-2 text-[10px]"
            onclick={() => {
              if (!selectedElement) return;

              centerElementHorizontally(selectedElement);
            }}
          >
            <AlignCenterIcon class="size-3" />
            <span>{$t('certificate_studio.center_horizontally')}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            class="h-6 gap-1 px-2 text-[10px]"
            onclick={() => {
              if (!selectedElement) return;

              centerElementVertically(selectedElement);
            }}
          >
            <AlignCenterVerticalIcon class="size-3" />
            <span>{$t('certificate_studio.center_vertically')}</span>
          </Button>

          {#if currentElementLayout?.positionMode === 'custom'}
            <Button
              variant="ghost"
              size="sm"
              class="h-6 gap-1 px-2 text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              onclick={() => {
                if (!selectedElement) return;
                if (!design.elements) design.elements = {};
                design.elements[selectedElement] = {
                  ...design.elements[selectedElement],
                  positionMode: 'auto',
                  x: undefined,
                  y: undefined
                };
              }}
            >
              <RotateCcwIcon class="size-3" />
              <span>{$t('certificate_studio.reset_position')}</span>
            </Button>
          {/if}

          {#if selectedElementMeta.canHide}
            <Button
              variant="ghost"
              size="sm"
              class="h-6 gap-1 px-2 text-[10px] text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
              onclick={() => toggleElementVisibility(selectedElement!)}
            >
              <Trash2Icon class="size-3" />
              <span>{$t('certificate_studio.hide_element')}</span>
            </Button>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Borders Panel -->
    {#if selectedTool === 'borders' && design.border}
      <Field.Group class="space-y-3">
        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.border_type')}</Field.Label>
          <Select.Root type="single" bind:value={design.border.style}>
            <Select.Trigger class="h-8 w-full text-xs">
              {$t(
                BORDER_OPTIONS.find((option) => option.value === design.border?.style)?.labelKey ??
                  BORDER_OPTIONS[0].labelKey
              )}
            </Select.Trigger>
            <Select.Content>
              {#each BORDER_OPTIONS as option (option.value)}
                <Select.Item value={option.value}>{$t(option.labelKey)}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </Field.Field>

        <Field.Field>
          <Field.Label class="text-xs font-semibold"
            >{$t('certificate_studio.border_width')}: {design.border.width ?? 12}px</Field.Label
          >
          <Input type="range" min="4" max="32" bind:value={design.border.width} class="w-full accent-amber-500" />
        </Field.Field>

        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.primary_color')}</Field.Label>
          <div class="flex items-center gap-2">
            <Input
              type="color"
              bind:value={design.border.primaryColor}
              class="size-7 cursor-pointer rounded-sm border-0 bg-transparent p-0"
            />
            <Input bind:value={design.border.primaryColor} class="h-7 font-mono text-xs" />
          </div>
          <div class="mt-1.5 flex flex-wrap gap-1">
            {#each PALETTE_SWATCHES as swatch}
              <button
                type="button"
                class="size-5 rounded-full border border-black/10 transition-transform hover:scale-110"
                style:background-color={swatch}
                onclick={() => {
                  if (design.border) design.border.primaryColor = swatch;
                  design.accentColor = swatch;
                }}
                aria-label={swatch}
              ></button>
            {/each}
          </div>
        </Field.Field>
      </Field.Group>

      <!-- Typography & Copy Overrides Panel -->
    {:else if selectedTool === 'typography' && design.typography}
      <Field.Group class="space-y-3">
        <div class="flex rounded-md border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-800">
          <button
            type="button"
            class="flex-1 rounded-sm py-1 text-center font-medium transition-colors {activeTypoTarget === 'copy'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-500'}"
            onclick={() => (activeTypoTarget = 'copy')}
          >
            {$t('certificate_studio.custom_copy')}
          </button>
          <button
            type="button"
            class="flex-1 rounded-sm py-1 text-center font-medium transition-colors {activeTypoTarget === 'title'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-500'}"
            onclick={() => (activeTypoTarget = 'title')}
          >
            {$t('certificate_studio.element_title')}
          </button>
          <button
            type="button"
            class="flex-1 rounded-sm py-1 text-center font-medium transition-colors {activeTypoTarget === 'recipient'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-500'}"
            onclick={() => (activeTypoTarget = 'recipient')}
          >
            {$t('certificate_studio.element_recipient')}
          </button>
          <button
            type="button"
            class="flex-1 rounded-sm py-1 text-center font-medium transition-colors {activeTypoTarget === 'body'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-500'}"
            onclick={() => (activeTypoTarget = 'body')}
          >
            {$t('certificate_studio.target_body')}
          </button>
        </div>

        {#if activeTypoTarget === 'copy'}
          <!-- Custom Copy Overrides -->
          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.org_name')}</Field.Label>
            <Input
              bind:value={design.copy!.organizationName}
              placeholder={$t('certificate_studio.org_name_placeholder')}
              class="h-8 text-xs"
            />
          </Field.Field>

          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.certificate_title')}</Field.Label>
            <Input
              bind:value={design.copy!.title}
              placeholder={$t('certificate_studio.certificate_title_placeholder')}
              class="h-8 text-xs"
            />
          </Field.Field>

          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.presentation_line')}</Field.Label>
            <Input
              bind:value={design.copy!.presentation}
              placeholder={$t('certificate_studio.presentation_line_placeholder')}
              class="h-8 text-xs"
            />
          </Field.Field>

          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.completion_label')}</Field.Label>
            <Input
              bind:value={design.copy!.completion}
              placeholder={$t('certificate_studio.completion_label_placeholder')}
              class="h-8 text-xs"
            />
          </Field.Field>

          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.date_label')}</Field.Label>
            <Input
              bind:value={design.copy!.dateLabel}
              placeholder={$t('certificate_studio.date_label_placeholder')}
              class="h-8 text-xs"
            />
          </Field.Field>
        {:else}
          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.font_family')}</Field.Label>
            <Select.Root
              type="single"
              value={activeTypoTarget === 'title'
                ? design.typography.titleFont
                : activeTypoTarget === 'recipient'
                  ? design.typography.recipientFont
                  : design.typography.bodyFont}
              onValueChange={(value) => {
                if (!value) return;

                if (activeTypoTarget === 'title') design.typography!.titleFont = value;
                else if (activeTypoTarget === 'recipient') design.typography!.recipientFont = value;
                else design.typography!.bodyFont = value;
              }}
            >
              <Select.Trigger class="h-8 w-full text-xs">
                {FONT_OPTIONS.find(
                  (font) =>
                    font.value ===
                    (activeTypoTarget === 'title'
                      ? design.typography?.titleFont
                      : activeTypoTarget === 'recipient'
                        ? design.typography?.recipientFont
                        : design.typography?.bodyFont)
                )?.label ?? FONT_OPTIONS[0].label}
              </Select.Trigger>
              <Select.Content>
                {#each FONT_OPTIONS as font (font.value)}
                  <Select.Item value={font.value}>{font.label}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </Field.Field>

          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.font_color')}</Field.Label>
            <div class="flex items-center gap-2">
              <Input
                type="color"
                bind:value={design.typography.primaryColor}
                class="size-7 cursor-pointer rounded-sm border-0 bg-transparent p-0"
              />
              <Input bind:value={design.typography.primaryColor} class="h-7 font-mono text-xs" />
            </div>
          </Field.Field>
        {/if}
      </Field.Group>

      <!-- Badges / Official Seal Panel -->
    {:else if selectedTool === 'badges' && design.badge}
      <Field.Group class="space-y-3">
        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.badge_style')}</Field.Label>
          <Select.Root type="single" bind:value={design.badge.style}>
            <Select.Trigger class="h-8 w-full text-xs">
              {$t(
                BADGE_OPTIONS.find((option) => option.value === design.badge?.style)?.labelKey ??
                  BADGE_OPTIONS[0].labelKey
              )}
            </Select.Trigger>
            <Select.Content>
              {#each BADGE_OPTIONS as option (option.value)}
                <Select.Item value={option.value}>{$t(option.labelKey)}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </Field.Field>

        {#if design.badge.style !== 'none'}
          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.badge_label')}</Field.Label>
            <Input
              bind:value={design.badge.label}
              placeholder={$t('certificate_studio.badge_label_placeholder')}
              class="h-8 text-xs"
            />
          </Field.Field>
          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.foil_color')}</Field.Label>
            <div class="flex items-center gap-2">
              <Input
                type="color"
                bind:value={design.badge.foilColor}
                class="size-7 cursor-pointer rounded-sm border-0 bg-transparent p-0"
              />
              <Input bind:value={design.badge.foilColor} class="h-7 font-mono text-xs" />
            </div>
          </Field.Field>
        {/if}
      </Field.Group>

      <!-- Signatories Manager Panel (0 to 3 items) -->
    {:else if selectedTool === 'signatories'}
      <Field.Group class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-700 dark:text-slate-300">
            {$t('certificate_studio.signatories_count', { count: (design.signatories ?? []).length, maximum: 3 })}
          </span>
          {#if (design.signatories ?? []).length < 3}
            <Button variant="outline" size="sm" class="h-7 gap-1 px-2 text-[11px]" onclick={addSignatory}>
              <PlusIcon class="size-3" />
              <span>{$t('certificate_studio.add_signatory')}</span>
            </Button>
          {/if}
        </div>

        {#if (design.signatories ?? []).length === 0}
          <div
            class="rounded-lg border border-dashed border-slate-200 p-4 text-center text-slate-400 dark:border-slate-800"
          >
            <p>{$t('certificate_studio.no_signatories')}</p>
            <Button variant="secondary" size="sm" class="mt-2 text-xs" onclick={addSignatory}>
              {$t('certificate_studio.add_first_signatory')}
            </Button>
          </div>
        {/if}

        {#each design.signatories ?? [] as sig, index (sig.id ?? index)}
          {@const isThisSignatorySelected = selectedElement === `signatory-${index}`}
          <div
            class="space-y-2 rounded-lg border p-2.5 transition-all {isThisSignatorySelected
              ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/30 dark:border-amber-700 dark:bg-amber-950/20'
              : 'border-slate-200 dark:border-slate-800'}"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold">
                  {$t('certificate_studio.signer_number', { number: index + 1 })}
                </span>
                <Switch bind:checked={sig.enabled} />
              </div>
              <button
                type="button"
                class="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                title={$t('certificate_studio.remove_signatory')}
                aria-label={$t('certificate_studio.remove_signatory')}
                onclick={() => removeSignatory(index)}
              >
                <Trash2Icon class="size-3.5" />
              </button>
            </div>
            {#if sig.enabled}
              <Input
                bind:value={sig.name}
                placeholder={$t('certificate_studio.signer_name_placeholder')}
                class="h-7 text-xs"
              />
              <Input
                bind:value={sig.role}
                placeholder={$t('certificate_studio.signer_role_placeholder')}
                class="h-7 text-xs"
              />
            {/if}
          </div>
        {/each}
      </Field.Group>

      <!-- QR Code Credential Panel -->
    {:else if selectedTool === 'qrcode' && design.qrCode}
      <Field.Group class="space-y-3">
        <Field.Field
          orientation="horizontal"
          class="items-center justify-between rounded-lg border border-slate-200 p-2.5 dark:border-slate-800"
        >
          <Field.Label class="cursor-pointer text-xs font-semibold">{$t('certificate_studio.qr_toggle')}</Field.Label>
          <Switch checked={design.qrCode.enabled} onCheckedChange={handleQrEnabledChange} />
        </Field.Field>

        {#if design.qrCode.enabled}
          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.qr_position')}</Field.Label>
            <Select.Root type="single" value={design.qrCode.position} onValueChange={handleQrPositionChange}>
              <Select.Trigger class="h-8 w-full text-xs">
                {$t(
                  QR_POSITION_OPTIONS.find((option) => option.value === design.qrCode?.position)?.labelKey ??
                    QR_POSITION_OPTIONS[0].labelKey
                )}
              </Select.Trigger>
              <Select.Content>
                {#each QR_POSITION_OPTIONS as option (option.value)}
                  <Select.Item value={option.value}>{$t(option.labelKey)}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </Field.Field>

          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.verified_label')}</Field.Label>
            <Input
              bind:value={design.copy!.verifiedCredentialLabel}
              placeholder={$t('certificate_studio.verified_label_placeholder')}
              class="h-8 text-xs"
            />
          </Field.Field>

          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.field_id_format')}</Field.Label>
            <Input
              bind:value={design.idFormat}
              placeholder={$t('certificate_studio.field_id_format_placeholder', { values: { seq: '{seq}' } })}
              class="h-8 font-mono text-xs"
            />
          </Field.Field>
        {/if}
      </Field.Group>

      <!-- Background Panel -->
    {:else if selectedTool === 'background' && design.background}
      <Field.Group class="space-y-4">
        <!-- Quick Preset Swatches -->
        <div>
          <Field.Label class="mb-1.5 block text-xs font-semibold">
            {$t('certificate_studio.bg_presets')}
          </Field.Label>
          <div class="grid grid-cols-5 gap-1.5">
            {#each BACKGROUND_SWATCHES as swatch (swatch.label)}
              {@const isSelected = design.background.primaryColor?.toLowerCase() === swatch.primary.toLowerCase()}
              <button
                type="button"
                class="group flex flex-col items-center gap-1 rounded-md p-1 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 {isSelected
                  ? 'bg-amber-50 ring-1 ring-amber-500/50 dark:bg-amber-950/40'
                  : ''}"
                title={swatch.label}
                aria-label={swatch.label}
                onclick={() => {
                  if (!design.background) design.background = {};
                  design.background.primaryColor = swatch.primary;
                  design.background.secondaryColor = swatch.secondary;
                }}
              >
                <span
                  class="size-6 rounded-full border border-slate-300 shadow-xs transition-transform group-hover:scale-110 dark:border-slate-700 {isSelected
                    ? 'border-2 border-amber-500 ring-2 ring-amber-500/30'
                    : ''}"
                  style:background-color={swatch.primary}
                ></span>
                <span class="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                  {swatch.label}
                </span>
              </button>
            {/each}
          </div>
        </div>

        <Field.Separator />

        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.background_style')}</Field.Label>
          <Select.Root type="single" bind:value={design.background.style}>
            <Select.Trigger class="h-8 w-full text-xs">
              {$t(
                BACKGROUND_OPTIONS.find((option) => option.value === design.background?.style)?.labelKey ??
                  BACKGROUND_OPTIONS[0].labelKey
              )}
            </Select.Trigger>
            <Select.Content>
              {#each BACKGROUND_OPTIONS as option (option.value)}
                <Select.Item value={option.value}>{$t(option.labelKey)}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </Field.Field>

        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.bg_primary')}</Field.Label>
          <div class="flex items-center gap-2">
            <Input
              type="color"
              bind:value={design.background.primaryColor}
              class="size-7 cursor-pointer rounded-sm border-0 bg-transparent p-0"
            />
            <Input bind:value={design.background.primaryColor} class="h-7 font-mono text-xs" />
          </div>
        </Field.Field>

        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.bg_secondary')}</Field.Label>
          <div class="flex items-center gap-2">
            <Input
              type="color"
              bind:value={design.background.secondaryColor}
              class="size-7 cursor-pointer rounded-sm border-0 bg-transparent p-0"
            />
            <Input bind:value={design.background.secondaryColor} class="h-7 font-mono text-xs" />
          </div>
        </Field.Field>
      </Field.Group>

      <!-- Default / Layout Panel -->
    {:else}
      <Field.Group class="space-y-4">
        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.field_subtitle')}</Field.Label>
          <Input bind:value={design.subtitle} class="h-8 text-xs" />
        </Field.Field>

        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.field_description')}</Field.Label>
          <Textarea bind:value={design.descriptionOverride} rows={3} class="text-xs" />
        </Field.Field>
      </Field.Group>
    {/if}
  </div>
</aside>
