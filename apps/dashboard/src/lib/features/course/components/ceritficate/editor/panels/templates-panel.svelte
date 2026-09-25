<script lang="ts">
  import { CERTIFICATE_TEMPLATES, type CertificateTemplateId } from '@cio/certificates';
  import { t } from '$lib/utils/functions/translations';
  import { cn } from '@cio/ui/tools';
  import TemplateThumb from './template-thumb.svelte';
  import { orgCapabilitiesApi, orgCertificatePresetsApi } from '$features/plugins';
  import { currentOrg } from '$lib/utils/store/org';
  import { certificateEditorStore } from '../store/certificate-editor.store.svelte';

  interface Props {
    value: CertificateTemplateId;
    onSelect: (id: CertificateTemplateId) => void;
    disabled?: boolean;
  }

  let { value, onSelect, disabled = false }: Props = $props();

  const isStudioEnabled = $derived(orgCapabilitiesApi.isEnabled('certificate_studio', $currentOrg.id));

  const orgPresets = $derived($currentOrg.id ? orgCertificatePresetsApi.getPresets($currentOrg.id) : []);

  $effect(() => {
    if (isStudioEnabled && $currentOrg.id && orgPresets.length === 0) {
      void orgCertificatePresetsApi.fetchPresets($currentOrg.id);
    }
  });

  function handleSelectPreset(preset: (typeof orgPresets)[number]) {
    certificateEditorStore.applyPreset(preset);
  }
</script>

{#if isStudioEnabled && orgPresets.length > 0}
  <div class="mb-4 space-y-2">
    <span class="text-xs font-semibold tracking-wider text-slate-500 uppercase">
      {$t('certificate_studio.org_presets')}
    </span>
    <div class="grid grid-cols-2 gap-3">
      {#each orgPresets as orgTemplate (orgTemplate.id)}
        {@const isActive = certificateEditorStore.draft.sourcePresetId === orgTemplate.id}
        {@const design = (orgTemplate.design as Record<string, any>) ?? {}}
        {@const accentColor = design.accentColor ?? '#D97706'}
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
          onclick={() => handleSelectPreset(orgTemplate)}
        >
          <div
            class="flex h-full w-full flex-col justify-between p-2.5 text-white"
            style:background="linear-gradient(135deg, {accentColor}ee 0%, {accentColor} 100%)"
          >
            <span class="truncate text-[9px] font-medium tracking-wide uppercase opacity-80">
              {design.subtitle ?? 'Certificate'}
            </span>
            <div class="line-clamp-2 text-xs leading-tight font-bold drop-shadow-xs">
              {orgTemplate.name}
            </div>
          </div>
          <span
            class={cn(
              'absolute right-0 bottom-0 left-0 px-2 py-1 text-center text-[9px] font-medium tracking-[0.18em] uppercase',
              isActive ? 'ui:bg-primary ui:text-primary-foreground' : 'ui:bg-foreground ui:text-background'
            )}
          >
            {orgTemplate.name}
          </span>
        </button>
      {/each}
    </div>
  </div>
  <div class="mb-2">
    <span class="text-xs font-semibold tracking-wider text-slate-500 uppercase">
      {$t('certificate_studio.default_renderers')}
    </span>
  </div>
{/if}

<div class="grid grid-cols-2 gap-3">
  {#each CERTIFICATE_TEMPLATES as template (template.id)}
    {@const isActive = !certificateEditorStore.draft.sourcePresetId && template.id === value}

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
