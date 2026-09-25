<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import * as Card from '@cio/ui/base/card';
  import { Certificate } from '@cio/ui';
  import AwardIcon from '@lucide/svelte/icons/award';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import CompassIcon from '@lucide/svelte/icons/compass';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { orgCertificatePresetsApi, type OrgCertificatePreset } from '$features/plugins';
  import TemplateBrowserDialog, { type StarterTemplate } from './template-browser-dialog.svelte';
  import { resolveCertificateDesign } from '@cio/certificates';

  interface Props {
    orgSlug: string;
  }

  let { orgSlug }: Props = $props();

  let isCatalogOpen = $state(false);
  let cloningId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);

  onMount(() => {
    if ($currentOrg.id) {
      void orgCertificatePresetsApi.fetchPresets($currentOrg.id);
    }
  });

  const presets = $derived($currentOrg.id ? orgCertificatePresetsApi.getPresets($currentOrg.id) : []);

  function getStyleLabel(rendererId: string): string {
    switch (rendererId) {
      case 'classique':
        return 'Victorian';
      case 'poster':
        return 'Art Deco';
      case 'minimal':
        return 'Minimalist';
      case 'noir':
        return 'Executive Noir';
      case 'brutalist':
        return 'Raw Modern';
      default:
        return rendererId.charAt(0).toUpperCase() + rendererId.slice(1);
    }
  }

  function getPreviewData(preset: OrgCertificatePreset) {
    const design = (preset.design as Record<string, any>) ?? {};
    return {
      recipientName: 'Jane Doe',
      courseName: 'Sample Course Title',
      courseDescription: design.descriptionOverride || 'For successfully demonstrating leadership and academic rigor.',
      orgName: $currentOrg.name || 'Academy',
      orgLogoUrl: $currentOrg.avatarUrl || undefined,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      certificateId: (design.idFormat ?? 'CERT-{seq}').replace('{seq}', '001')
    };
  }

  function handleCreate() {
    goto(`/org/${orgSlug}/plugins/certificate-studio/editor`);
  }

  function handleSelectStarterTemplate(starter: StarterTemplate) {
    isCatalogOpen = false;
    const params = new URLSearchParams({
      starter: starter.id,
      name: starter.name,
      color: starter.accentColor,
      subtitle: starter.subtitle
    });
    goto(`/org/${orgSlug}/plugins/certificate-studio/editor?${params.toString()}`);
  }

  function handleEdit(preset: OrgCertificatePreset) {
    goto(`/org/${orgSlug}/plugins/certificate-studio/editor?id=${preset.id}`);
  }

  async function handleClone(preset: OrgCertificatePreset) {
    if (!$currentOrg.id) return;
    cloningId = preset.id;
    try {
      await orgCertificatePresetsApi.clonePreset($currentOrg.id, preset);
    } finally {
      cloningId = null;
    }
  }

  async function handleDelete(presetId: string) {
    if (!$currentOrg.id) return;
    if (confirm($t('certificate_studio.delete_confirm'))) {
      deletingId = presetId;
      try {
        await orgCertificatePresetsApi.deletePreset($currentOrg.id, presetId);
      } finally {
        deletingId = null;
      }
    }
  }
</script>

<svelte:head>
  <title>{$t('certificate_studio.page_title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title class="mt-1 flex items-center gap-2 text-2xl font-bold">
        <AwardIcon class="size-6 text-amber-500" />
        {$t('certificate_studio.page_title')}
      </Page.Title>
      <Page.Subtitle>{$t('certificate_studio.page_subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <div class="flex flex-wrap items-center gap-2.5">
        <Button variant="outline" size="sm" onclick={() => (isCatalogOpen = true)} class="gap-1.5">
          <CompassIcon class="size-4 text-amber-600 dark:text-amber-400" />
          {$t('certificate_studio.browse')}
        </Button>
        <Button size="sm" onclick={handleCreate} class="gap-1.5">
          <PlusIcon class="size-4" />
          {$t('certificate_studio.create')}
        </Button>
      </div>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <div class="space-y-6">
        {#if orgCertificatePresetsApi.isLoading && presets.length === 0}
          <div class="flex h-56 items-center justify-center">
            <Loader2Icon class="size-6 animate-spin text-slate-400" />
          </div>
        {:else if presets.length === 0}
          <div
            class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/30"
          >
            <div
              class="mb-4 flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-950/50"
            >
              <AwardIcon class="size-6" />
            </div>
            <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {$t('certificate_studio.empty_title')}
            </h3>
            <p class="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              {$t('certificate_studio.empty_desc')}
            </p>
            <div class="mt-5 flex items-center gap-2">
              <Button size="sm" variant="outline" onclick={() => (isCatalogOpen = true)} class="gap-1.5">
                <CompassIcon class="size-4 text-amber-600 dark:text-amber-400" />
                {$t('certificate_studio.browse')}
              </Button>
              <Button size="sm" onclick={handleCreate} class="gap-1.5">
                <PlusIcon class="size-4" />
                {$t('certificate_studio.create')}
              </Button>
            </div>
          </div>
        {:else}
          <div class="flex items-center justify-between">
            <h2 class="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              ORG TEMPLATES ({presets.length})
            </h2>
          </div>

          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {#each presets as preset (preset.id)}
              {@const rawDesign = (preset.design as Record<string, any>) ?? {}}
              {@const renderer = rawDesign.rendererTemplateId || rawDesign.templateId || 'classique'}
              {@const resolvedDesign = resolveCertificateDesign({ design: rawDesign })}
              {@const accentColor = resolvedDesign.accentColor ?? '#d4af37'}

              <Card.Root
                class="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div
                  class="relative aspect-[1.4/1] w-full overflow-hidden border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
                >
                  <Certificate.Preview
                    design={resolvedDesign}
                    data={getPreviewData(preset)}
                    zoom="fit"
                    showControls={false}
                    class="pointer-events-none h-full w-full"
                  />
                  <div class="absolute top-2.5 right-2.5">
                    <Badge
                      variant="secondary"
                      class="bg-white/90 font-mono text-[10px] uppercase shadow-xs backdrop-blur-xs dark:bg-slate-900/90"
                    >
                      {renderer}
                    </Badge>
                  </div>
                </div>

                <Card.Content class="space-y-1.5 p-4">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                      <h3 class="truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={preset.name}>
                        {preset.name}
                      </h3>
                      <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Style: {getStyleLabel(renderer)}
                      </p>
                    </div>
                    <span
                      class="mt-1 size-3 shrink-0 rounded-full border border-black/10"
                      style:background-color={accentColor}
                      title={accentColor}
                    ></span>
                  </div>

                  {#if preset.description}
                    <p class="line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {preset.description}
                    </p>
                  {/if}
                </Card.Content>

                <Card.Footer
                  class="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div class="flex items-center gap-2">
                    <Button variant="outline" size="sm" class="h-8 gap-1 text-xs" onclick={() => handleEdit(preset)}>
                      <PencilIcon class="size-3.5" />
                      <span>{$t('certificate_studio.edit_preset')}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-8 gap-1 text-xs"
                      disabled={cloningId === preset.id}
                      onclick={() => handleClone(preset)}
                    >
                      {#if cloningId === preset.id}
                        <Loader2Icon class="size-3.5 animate-spin" />
                      {:else}
                        <CopyIcon class="size-3.5" />
                      {/if}
                      <span>{$t('certificate_studio.clone_preset')}</span>
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    class="size-8 p-0 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                    disabled={deletingId === preset.id}
                    onclick={() => handleDelete(preset.id)}
                    title={$t('certificate_studio.delete_preset')}
                  >
                    {#if deletingId === preset.id}
                      <Loader2Icon class="size-3.5 animate-spin" />
                    {:else}
                      <Trash2Icon class="size-3.5" />
                    {/if}
                  </Button>
                </Card.Footer>
              </Card.Root>
            {/each}
          </div>
        {/if}
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>

<TemplateBrowserDialog
  open={isCatalogOpen}
  onClose={() => (isCatalogOpen = false)}
  onSelectTemplate={handleSelectStarterTemplate}
/>
