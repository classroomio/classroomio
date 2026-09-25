<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { currentOrg } from '$lib/utils/store/org';
  import { orgCertificatePresetsApi, type OrgCertificatePreset } from '$features/plugins';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import type { CertificateTemplateId } from '@cio/certificates';
  import CertificateStudioBuilder from './certificate-studio-builder.svelte';

  let { orgSlug }: { orgSlug: string } = $props();

  const presetId = $derived(page.url.searchParams.get('id'));
  const starterTemplateId = $derived((page.url.searchParams.get('starter') ?? 'classique') as CertificateTemplateId);
  const initialName = $derived(page.url.searchParams.get('name') ?? '');
  const initialAccentColor = $derived(page.url.searchParams.get('color') ?? '#d4af37');
  const initialSubtitle = $derived(page.url.searchParams.get('subtitle') ?? 'PROUDLY PRESENTED TO');

  let preset = $state<OrgCertificatePreset | null>(null);
  let isLoading = $state(Boolean(presetId));

  onMount(async () => {
    if (!presetId || !$currentOrg.id) {
      isLoading = false;
      return;
    }

    preset = await orgCertificatePresetsApi.fetchPreset($currentOrg.id, presetId);
    isLoading = false;
  });
</script>

<div class="min-h-0 w-full overflow-hidden bg-slate-100 dark:bg-slate-950" style:height="calc(100dvh - 3rem)">
  {#if isLoading}
    <div class="flex h-full items-center justify-center">
      <Loader2Icon class="size-6 animate-spin text-slate-400" />
    </div>
  {:else}
    <CertificateStudioBuilder
      {orgSlug}
      {preset}
      {starterTemplateId}
      {initialName}
      {initialAccentColor}
      {initialSubtitle}
    />
  {/if}
</div>
