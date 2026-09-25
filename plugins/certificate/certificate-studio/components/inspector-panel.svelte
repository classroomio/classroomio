<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { t } from '$lib/utils/functions/translations';
  import type { ToolCategory, SelectedElement, TypographyTarget } from '../types';
  import BorderInspector from './inspectors/border-inspector.svelte';
  import TypographyInspector from './inspectors/typography-inspector.svelte';
  import BadgesInspector from './inspectors/badges-inspector.svelte';
  import QrcodeInspector from './inspectors/qrcode-inspector.svelte';
  import BackgroundInspector from './inspectors/background-inspector.svelte';
  import SignatoriesInspector from './inspectors/signatories-inspector.svelte';
  import LayoutInspector from './inspectors/layout-inspector.svelte';

  interface Props {
    selectedTool: ToolCategory;
    selectedElement: SelectedElement;
    // Border state
    borderStyle: 'victorian' | 'double_gold' | 'geometric' | 'minimal' | 'custom_svg';
    borderWidth: number;
    primaryColor: string;
    cornerAccent: string;
    customSvg: string;
    // Typography state
    typographyTarget: TypographyTarget;
    titleFont: string;
    titleSize: number;
    recipientFont: string;
    recipientSize: number;
    bodyFont: string;
    bodySize: number;
    textColor: string;
    letterSpacing: number;
    // Badge state
    badgeStyle: 'gold_seal' | 'ribbon' | 'wax_stamp' | 'crest' | 'none';
    badgeLabel: string;
    foilColor: string;
    // QR Code state
    qrEnabled: boolean;
    idFormat: string;
    // Background state
    bgStyle: 'parchment' | 'guilloche' | 'solid' | 'gradient';
    bgPrimary: string;
    bgSecondary: string;
    // Signatories state
    sig1Enabled: boolean;
    sig1Name: string;
    sig1Role: string;
    sig1SignatureUrl: string;
    sig2Enabled: boolean;
    sig2Name: string;
    sig2Role: string;
    sig2SignatureUrl: string;
    // Layout state
    subtitle: string;
    descriptionOverride: string;
    description: string;
  }

  let {
    selectedTool,
    selectedElement,
    borderStyle = $bindable('victorian'),
    borderWidth = $bindable(12),
    primaryColor = $bindable('#d4af37'),
    cornerAccent = $bindable('#85581a'),
    customSvg = $bindable(''),
    typographyTarget = $bindable('recipient'),
    titleFont = $bindable('Bodoni Moda'),
    titleSize = $bindable(38),
    recipientFont = $bindable('Great Vibes'),
    recipientSize = $bindable(56),
    bodyFont = $bindable('Cormorant Garamond'),
    bodySize = $bindable(15),
    textColor = $bindable('#1a1a2e'),
    letterSpacing = $bindable(0.05),
    badgeStyle = $bindable('gold_seal'),
    badgeLabel = $bindable('OFFICIAL SEAL'),
    foilColor = $bindable('#d4af37'),
    qrEnabled = $bindable(true),
    idFormat = $bindable('ACM-{seq}'),
    bgStyle = $bindable('parchment'),
    bgPrimary = $bindable('#faf8f2'),
    bgSecondary = $bindable('#f3ede0'),
    sig1Enabled = $bindable(true),
    sig1Name = $bindable('Dr. Robert Ford'),
    sig1Role = $bindable('Dean of Academics'),
    sig1SignatureUrl = $bindable(''),
    sig2Enabled = $bindable(true),
    sig2Name = $bindable('Sarah Dean'),
    sig2Role = $bindable('Lead Instructor'),
    sig2SignatureUrl = $bindable(''),
    subtitle = $bindable('PROUDLY PRESENTED TO'),
    descriptionOverride = $bindable(''),
    description = $bindable('')
  }: Props = $props();

  const isBorderActive = $derived(selectedElement === 'border' || selectedTool === 'borders');
  const isTypographyActive = $derived(
    selectedElement === 'recipient' ||
      selectedElement === 'title' ||
      selectedElement === 'body' ||
      selectedTool === 'typography'
  );
  const isBadgeActive = $derived(selectedElement === 'badge' || selectedTool === 'badges');
  const isQrActive = $derived(selectedElement === 'qrcode' || selectedTool === 'qrcode');
  const isBgActive = $derived(selectedElement === 'background' || selectedTool === 'background');
  const isSignatoriesActive = $derived(selectedElement === 'signatories' || selectedTool === 'signatories');
</script>

<aside
  class="flex min-h-0 w-64 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
>
  <div class="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
    <h2 class="text-xs font-bold tracking-wider text-slate-400 uppercase">
      {$t('certificate_studio.inspector')}
    </h2>
    <div class="mt-1 flex items-center gap-1.5">
      <span class="text-xs font-semibold text-slate-600 dark:text-slate-400">Selected:</span>
      <Badge
        variant="secondary"
        class="bg-amber-100 font-medium text-amber-900 capitalize dark:bg-amber-950/60 dark:text-amber-200"
      >
        [{selectedElement}]
      </Badge>
    </div>
  </div>

  <div class="flex-1 space-y-5 overflow-y-auto p-4 text-xs">
    {#if isBorderActive}
      <BorderInspector bind:borderStyle bind:borderWidth bind:primaryColor bind:cornerAccent bind:customSvg />
    {:else if isTypographyActive}
      <TypographyInspector
        bind:typographyTarget
        bind:titleFont
        bind:titleSize
        bind:recipientFont
        bind:recipientSize
        bind:bodyFont
        bind:bodySize
        bind:textColor
        bind:letterSpacing
      />
    {:else if isBadgeActive}
      <BadgesInspector bind:badgeStyle bind:badgeLabel bind:foilColor />
    {:else if isQrActive}
      <QrcodeInspector bind:qrEnabled bind:idFormat />
    {:else if isBgActive}
      <BackgroundInspector bind:bgStyle bind:bgPrimary bind:bgSecondary />
    {:else if isSignatoriesActive}
      <SignatoriesInspector
        bind:sig1Enabled
        bind:sig1Name
        bind:sig1Role
        bind:sig1SignatureUrl
        bind:sig2Enabled
        bind:sig2Name
        bind:sig2Role
        bind:sig2SignatureUrl
      />
    {:else}
      <LayoutInspector bind:subtitle bind:descriptionOverride bind:description />
    {/if}
  </div>
</aside>
