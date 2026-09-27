<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Switch } from '@cio/ui/base/switch';
  import * as Field from '@cio/ui/base/field';
  import { t } from '$lib/utils/functions/translations';
  import type { CertificateDesign } from '@cio/certificates';
  import { FONT_OPTIONS, PALETTE_SWATCHES, type ToolCategory } from '../types';

  interface Props {
    selectedTool: ToolCategory;
    design: CertificateDesign;
  }

  let { selectedTool = 'borders', design = $bindable() }: Props = $props();

  // Ensure nested objects exist to avoid undefined errors
  $effect.pre(() => {
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
    if (!design.badge) design.badge = { style: 'gold_seal', label: 'OFFICIAL SEAL', foilColor: design.accentColor };
    if (!design.qrCode) design.qrCode = { enabled: true };
    if (!design.signatories) {
      design.signatories = [
        { name: 'Dr. Robert Ford', role: 'Dean of Academics', enabled: true },
        { name: 'Sarah Dean', role: 'Lead Instructor', enabled: true }
      ];
    }
  });

  let activeTypoTarget = $state<'title' | 'recipient' | 'body'>('recipient');
</script>

<aside
  class="flex min-h-0 w-72 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
>
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

  <div class="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
    {#if selectedTool === 'borders' && design.border}
      <Field.Group class="space-y-3">
        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.border_type')}</Field.Label>
          <select
            bind:value={design.border.style}
            class="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="victorian">{$t('certificate_studio.border_victorian')}</option>
            <option value="double_gold">{$t('certificate_studio.border_double_gold')}</option>
            <option value="geometric">{$t('certificate_studio.border_geometric')}</option>
            <option value="minimal">{$t('certificate_studio.border_minimal')}</option>
          </select>
        </Field.Field>

        <Field.Field>
          <Field.Label class="text-xs font-semibold"
            >{$t('certificate_studio.border_width')}: {design.border.width ?? 12}px</Field.Label
          >
          <input type="range" min="4" max="32" bind:value={design.border.width} class="w-full accent-amber-500" />
        </Field.Field>

        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.primary_color')}</Field.Label>
          <div class="flex items-center gap-2">
            <input
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
    {:else if selectedTool === 'typography' && design.typography}
      <Field.Group class="space-y-3">
        <div class="flex rounded-md border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-800">
          <button
            type="button"
            class="flex-1 rounded-sm py-1 text-center font-medium transition-colors {activeTypoTarget === 'title'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-500'}"
            onclick={() => (activeTypoTarget = 'title')}
          >
            Title
          </button>
          <button
            type="button"
            class="flex-1 rounded-sm py-1 text-center font-medium transition-colors {activeTypoTarget === 'recipient'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-500'}"
            onclick={() => (activeTypoTarget = 'recipient')}
          >
            Recipient
          </button>
          <button
            type="button"
            class="flex-1 rounded-sm py-1 text-center font-medium transition-colors {activeTypoTarget === 'body'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-500'}"
            onclick={() => (activeTypoTarget = 'body')}
          >
            Body
          </button>
        </div>

        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.font_family')}</Field.Label>
          <select
            value={activeTypoTarget === 'title'
              ? design.typography.titleFont
              : activeTypoTarget === 'recipient'
                ? design.typography.recipientFont
                : design.typography.bodyFont}
            onchange={(e) => {
              const val = e.currentTarget.value;
              if (activeTypoTarget === 'title') design.typography!.titleFont = val;
              else if (activeTypoTarget === 'recipient') design.typography!.recipientFont = val;
              else design.typography!.bodyFont = val;
            }}
            class="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {#each FONT_OPTIONS as font}
              <option value={font.value}>{font.label}</option>
            {/each}
          </select>
        </Field.Field>

        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.font_color')}</Field.Label>
          <div class="flex items-center gap-2">
            <input
              type="color"
              bind:value={design.typography.primaryColor}
              class="size-7 cursor-pointer rounded-sm border-0 bg-transparent p-0"
            />
            <Input bind:value={design.typography.primaryColor} class="h-7 font-mono text-xs" />
          </div>
        </Field.Field>
      </Field.Group>
    {:else if selectedTool === 'badges' && design.badge}
      <Field.Group class="space-y-3">
        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.badge_style')}</Field.Label>
          <select
            bind:value={design.badge.style}
            class="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="gold_seal">{$t('certificate_studio.badge_gold_seal')}</option>
            <option value="ribbon">{$t('certificate_studio.badge_ribbon')}</option>
            <option value="wax_stamp">{$t('certificate_studio.badge_wax_stamp')}</option>
            <option value="none">{$t('certificate_studio.badge_none')}</option>
          </select>
        </Field.Field>

        {#if design.badge.style !== 'none'}
          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.badge_label')}</Field.Label>
            <Input bind:value={design.badge.label} placeholder="e.g. OFFICIAL SEAL" class="h-8 text-xs" />
          </Field.Field>
          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.foil_color')}</Field.Label>
            <div class="flex items-center gap-2">
              <input
                type="color"
                bind:value={design.badge.foilColor}
                class="size-7 cursor-pointer rounded-sm border-0 bg-transparent p-0"
              />
              <Input bind:value={design.badge.foilColor} class="h-7 font-mono text-xs" />
            </div>
          </Field.Field>
        {/if}
      </Field.Group>
    {:else if selectedTool === 'qrcode' && design.qrCode}
      <Field.Group class="space-y-3">
        <Field.Field
          orientation="horizontal"
          class="items-center justify-between rounded-lg border border-slate-200 p-2.5 dark:border-slate-800"
        >
          <Field.Label class="cursor-pointer text-xs font-semibold">{$t('certificate_studio.qr_toggle')}</Field.Label>
          <Switch bind:checked={design.qrCode.enabled} />
        </Field.Field>

        {#if design.qrCode.enabled}
          <Field.Field>
            <Field.Label class="text-xs font-semibold">{$t('certificate_studio.field_id_format')}</Field.Label>
            <Input bind:value={design.idFormat} placeholder="e.g. ACM-{'{seq}'}" class="h-8 font-mono text-xs" />
          </Field.Field>
        {/if}
      </Field.Group>
    {:else if selectedTool === 'background' && design.background}
      <Field.Group class="space-y-3">
        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.background_style')}</Field.Label>
          <select
            bind:value={design.background.style}
            class="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="parchment">{$t('certificate_studio.bg_parchment')}</option>
            <option value="guilloche">{$t('certificate_studio.bg_guilloche')}</option>
            <option value="solid">{$t('certificate_studio.bg_solid')}</option>
            <option value="gradient">{$t('certificate_studio.bg_gradient')}</option>
          </select>
        </Field.Field>

        <Field.Field>
          <Field.Label class="text-xs font-semibold">{$t('certificate_studio.bg_primary')}</Field.Label>
          <div class="flex items-center gap-2">
            <input
              type="color"
              bind:value={design.background.primaryColor}
              class="size-7 cursor-pointer rounded-sm border-0 bg-transparent p-0"
            />
            <Input bind:value={design.background.primaryColor} class="h-7 font-mono text-xs" />
          </div>
        </Field.Field>
      </Field.Group>
    {:else if selectedTool === 'signatories' && design.signatories}
      <Field.Group class="space-y-4">
        {#each [0, 1] as sigIndex}
          <div class="space-y-2 rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
            <div class="flex items-center justify-between">
              <span class="font-semibold">Signatory {sigIndex + 1}</span>
              <Switch bind:checked={design.signatories[sigIndex].enabled} />
            </div>
            {#if design.signatories[sigIndex].enabled}
              <Input bind:value={design.signatories[sigIndex].name} placeholder="Name" class="h-7 text-xs" />
              <Input bind:value={design.signatories[sigIndex].role} placeholder="Title / Role" class="h-7 text-xs" />
            {/if}
          </div>
        {/each}
      </Field.Group>
    {:else}
      <Field.Group class="space-y-3">
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
