<script lang="ts">
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import type { DomainRequestData, DomainRequestStatus } from '$features/org/utils/types';
  import isValidDomain from 'is-valid-domain';
  import { goto } from '$app/navigation';
  import { onMount, untrack } from 'svelte';

  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { orgApi } from '$features/org/api/org.svelte';
  import { blockedSubdomain } from '$lib/utils/constants/app';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { updateOrgSiteNameValidation } from '$lib/utils/functions/validator';
  import { sanitizeDomain, sendDomainRequest } from '$lib/utils/functions/domain';
  import { BRAND_ROOT_DOMAIN, TENANT_ROOT_DOMAIN } from '@cio/utils/constants';

  import { Badge } from '@cio/ui/base/badge';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Spinner } from '@cio/ui/base/spinner';

  import { Button } from '@cio/ui/base/button';
  import { CopyButton } from '@cio/ui/base/copy-button';
  import { Textarea } from '@cio/ui/base/textarea';
  import { DomainInput } from '@cio/ui/custom/domain-input';
  import { ComingSoon, UpgradeBanner, UploadImage, VisitOrgSiteButton } from '$features/ui';
  import * as Field from '@cio/ui/base/field';
  import { getResolvedUploadLimits } from '$lib/utils/config/upload-limits-context';

  let siteName = $derived($currentOrg.siteName);
  let customDomain = $state('');
  let customCode = $state('');
  let favicon = $state<string | File | undefined>();
  let hasFaviconChanges = $state(false);
  let isFaviconLoading = $state(false);
  let isLoading = $state(false);
  let isCustomDomainLoading = $state(false);
  let isRefreshing = $state(false);
  let domainSetup = $state<DomainRequestData | null>(null);
  let domainApex = $state<string | null>(null);

  const isDomainValid = $derived(isValidDomain(sanitizeDomain(customDomain), { subdomain: true }));
  const currentDomainStatus = $derived<DomainRequestStatus | null>(
    domainSetup?.status ??
      ($currentOrg.customDomain ? ($currentOrg.isCustomDomainVerified ? 'verified' : 'pending_verification') : null)
  );

  async function refreshDomainApex(hostname: string | null | undefined) {
    if (!hostname) {
      domainApex = null;
      return;
    }
    const { parse } = await import('tldts/dist/es6/index.js');
    domainApex = parse(hostname).domain ?? null;
  }

  function stripZone(recordName: string): string {
    if (!domainApex) return recordName;

    const suffix = '.' + domainApex;
    if (recordName === domainApex) return '@';
    if (recordName.endsWith(suffix)) return recordName.slice(0, -suffix.length);

    return recordName;
  }

  type Error = {
    siteName: string;
    customDomain: string;
  };

  let errors: Error = $state({
    siteName: '',
    customDomain: ''
  });

  const uploadLimits = getResolvedUploadLimits();
  const faviconMaxFileSizeMb = uploadLimits.landingImageMb;

  async function handleSaveFavicon() {
    if (!hasFaviconChanges) {
      return;
    }

    isFaviconLoading = true;

    await orgApi.update($currentOrg.id, {
      favicon: favicon ?? null
    });

    if (orgApi.success) {
      favicon = undefined;
      hasFaviconChanges = false;
      snackbar.success('components.settings.domains.custom_favicon_saved');
    }

    isFaviconLoading = false;
  }

  async function handleRemoveFavicon() {
    isFaviconLoading = true;

    await orgApi.update($currentOrg.id, {
      favicon: null
    });

    if (orgApi.success) {
      $currentOrg.favicon = '';
      favicon = undefined;
      hasFaviconChanges = false;
      snackbar.success('components.settings.domains.custom_favicon_saved');
    }

    isFaviconLoading = false;
  }

  async function handleSaveSiteName() {
    errors = updateOrgSiteNameValidation(siteName) as Error;

    if (Object.values(errors).length) {
      isLoading = false;
      return;
    }

    if (blockedSubdomain.includes(siteName || '')) {
      errors.siteName = 'Sitename already exists.';
      return;
    }

    isLoading = true;

    await orgApi.update($currentOrg.id, {
      siteName: siteName!
    });

    if (orgApi.success) {
      $currentOrg.siteName = siteName;
      goto(`/org/${$currentOrg.siteName}/settings/domains`);
    } else if (orgApi.errors.general) {
      errors.siteName = orgApi.errors.general;
    } else {
      errors.siteName = $t('add_org.sitename');
    }

    isLoading = false;
  }

  function applyDomainSetup(data: DomainRequestData) {
    const wasVerified = $currentOrg.isCustomDomainVerified;
    domainSetup = data;

    if (data.status === 'removed') {
      $currentOrg.customDomain = '';
      $currentOrg.isCustomDomainVerified = false;
      domainApex = null;
      return;
    }

    $currentOrg.customDomain = data.hostname;
    $currentOrg.isCustomDomainVerified = data.verified;
    customDomain = '';
    void refreshDomainApex(data.hostname);

    if (data.verified && !wasVerified) {
      snackbar.success('components.settings.domains.verified_snackbar');
    }
  }

  function getDomainStatusLabel(status: DomainRequestStatus | null) {
    switch (status) {
      case 'verified':
        return $t('components.settings.domains.status_verified');
      case 'pending_dns':
        return $t('components.settings.domains.status_pending_dns');
      case 'pending_verification':
        return $t('components.settings.domains.status_pending_verification');
      case 'reconnect_required':
        return $t('components.settings.domains.status_reconnect_required');
      case 'error':
        return $t('components.settings.domains.status_error');
      case 'removed':
        return $t('components.settings.domains.status_removed');
      default:
        return '';
    }
  }

  function getDomainStatusClass(status: DomainRequestStatus | null) {
    switch (status) {
      case 'verified':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900';
      case 'pending_dns':
      case 'pending_verification':
        return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900';
      case 'reconnect_required':
      case 'error':
        return 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900';
      case 'removed':
        return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800';
      default:
        return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900';
    }
  }

  function getDomainStatusDescription(status: DomainRequestStatus | null) {
    switch (status) {
      case 'verified':
        return $t('components.settings.domains.verified_description');
      case 'pending_dns':
        return $t('components.settings.domains.pending_dns_description');
      case 'pending_verification':
        return $t('components.settings.domains.pending_verification_description');
      case 'reconnect_required':
        return $t('components.settings.domains.reconnect_description');
      case 'error':
        return $t('components.settings.domains.error_description');
      default:
        return $t('components.settings.domains.dns_description');
    }
  }

  async function handleSaveCustomDomain() {
    if (!isDomainValid) return;

    if ($isFreePlan) {
      errors.customDomain = 'Custom domains are only available on paid plans';
      return;
    }

    const sanitizedDomain = sanitizeDomain(customDomain);

    if (sanitizedDomain.includes(BRAND_ROOT_DOMAIN) || sanitizedDomain.includes(TENANT_ROOT_DOMAIN)) {
      errors.customDomain = $t('components.settings.domains.custom_domain_not_classroomio');
      return;
    }

    isCustomDomainLoading = true;

    try {
      const response = await sendDomainRequest('connect', sanitizedDomain);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to connect domain');
      }

      applyDomainSetup(response.data);
    } catch (error) {
      console.log('Error: connecting domain', error);
      snackbar.error(error instanceof Error ? error.message : String(error));
    } finally {
      isCustomDomainLoading = false;
    }
  }

  async function handleReconnectCustomDomain() {
    if (!$currentOrg.customDomain) return;

    isCustomDomainLoading = true;

    try {
      const response = await sendDomainRequest('connect', $currentOrg.customDomain);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to reconnect domain');
      }

      applyDomainSetup(response.data);
    } catch (error) {
      console.log('Error: reconnecting domain', error);
      snackbar.error(error instanceof Error ? error.message : String(error));
    } finally {
      isCustomDomainLoading = false;
    }
  }

  async function handleRemoveCustomDomain() {
    if (!$currentOrg.customDomain) return;

    isCustomDomainLoading = true;

    try {
      const response = await sendDomainRequest('remove', $currentOrg.customDomain);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to remove domain');
      }

      applyDomainSetup(response.data);
    } catch (error) {
      console.log('Error: removing domain', error);
      snackbar.error(error instanceof Error ? error.message : String(error));
    } finally {
      isCustomDomainLoading = false;
    }
  }

  async function handleRefreshCustomDomain(silent = false) {
    if (!$currentOrg.customDomain) return;

    isRefreshing = true;

    try {
      const response = await sendDomainRequest('refresh', $currentOrg.customDomain);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to refresh domain');
      }

      applyDomainSetup(response.data);
    } catch (error) {
      console.log('Error: refreshing domain', error);
      if (!silent) {
        snackbar.error(error instanceof Error ? error.message : String(error));
      }
    } finally {
      isRefreshing = false;
    }
  }

  function resetErrors(_siteName: string | null, _customDomain: string | null) {
    untrack(() => {
      if (errors.siteName) {
        errors.siteName = '';
      }

      if (errors.customDomain) {
        errors.customDomain = '';
      }
    });
  }

  const DOMAIN_POLL_INTERVAL_MS = 15000;

  onMount(() => {
    if ($currentOrg.customDomain) {
      void refreshDomainApex($currentOrg.customDomain);
      void handleRefreshCustomDomain(true);
    }
  });

  $effect(() => {
    resetErrors(siteName, customDomain);
  });

  $effect(() => {
    const shouldPoll =
      Boolean($currentOrg.customDomain) && currentDomainStatus !== null && currentDomainStatus !== 'verified';

    if (!shouldPoll) return;

    const interval = window.setInterval(() => {
      if (isRefreshing || isCustomDomainLoading || document.hidden) return;
      void handleRefreshCustomDomain(true);
    }, DOMAIN_POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  });
</script>

<Field.Group class="w-full max-w-md! px-2">
  <Field.Set>
    <Field.Legend>{$t('components.settings.domains.add')}</Field.Legend>
    <Field.Description class="">{$t('settings.organization.organization_profile.custom_domain.body')}</Field.Description
    >

    <Field.Field>
      <Field.Label>URL</Field.Label>
      <DomainInput
        value={siteName ?? ''}
        onchange={(e) => (siteName = (e.target as HTMLInputElement)?.value ?? '')}
        placeholder="myschool"
        prefix="https://"
        suffix=".{TENANT_ROOT_DOMAIN}"
      />
      {#if errors.siteName}
        <Field.Error>{errors.siteName}</Field.Error>
      {/if}
    </Field.Field>

    <Field.Field orientation="horizontal">
      <Button variant="outline" onclick={handleSaveSiteName} disabled={isLoading}>
        {$t('components.settings.domains.update')}
      </Button>
      <VisitOrgSiteButton forceSubdomain />
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('components.settings.domains.custom')}</Field.Legend>
    <UpgradeBanner>{$t('upgrade.domain')}</UpgradeBanner>

    <Field.Group>
      {#if $currentOrg.customDomain}
        <Field.Field>
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <p class="text-md flex items-center gap-2 font-medium">
                {$currentOrg.customDomain}
                <Button
                  variant="outline"
                  size="icon-sm"
                  onclick={() => {
                    window.open(`https://${$currentOrg.customDomain}`, '_blank');
                  }}
                >
                  <ArrowUpRightIcon size={16} />
                </Button>
              </p>
              <div
                class={`mt-1 h-2 w-2 rounded-full ${
                  currentDomainStatus === 'verified'
                    ? 'bg-green-400'
                    : currentDomainStatus === 'reconnect_required' || currentDomainStatus === 'error'
                      ? 'bg-red-400'
                      : 'bg-yellow-400'
                }`}
              ></div>
            </div>

            <Badge variant="default" class={`px-3 text-xs ${getDomainStatusClass(currentDomainStatus)}`}>
              {getDomainStatusLabel(currentDomainStatus)}
            </Badge>

            <IconButton onclick={handleRemoveCustomDomain} loading={isCustomDomainLoading}>
              {#if isCustomDomainLoading}
                <Spinner class="ui:text-muted-foreground size-4" />
              {:else}
                <TrashIcon size={16} />
              {/if}
            </IconButton>
          </div>
        </Field.Field>

        <Field.Description>{getDomainStatusDescription(currentDomainStatus)}</Field.Description>

        {#if domainSetup?.validationErrors?.length}
          <Field.Field>
            <div
              class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-900 dark:bg-red-950/40"
            >
              <AlertTriangleIcon class="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
              <div class="min-w-0 flex-1">
                <p class="font-medium text-red-900 dark:text-red-200">
                  {$t('components.settings.domains.validation_errors_heading')}
                </p>
                <ul class="mt-1 space-y-1 text-red-800 dark:text-red-300">
                  {#each domainSetup.validationErrors as message, i (i)}
                    <li>{message}</li>
                  {/each}
                </ul>
              </div>
            </div>
          </Field.Field>
        {/if}

        {#if currentDomainStatus === 'pending_verification'}
          <Field.Field>
            <div
              class="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/40"
            >
              <ShieldCheckIcon class="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
              <div class="min-w-0 flex-1">
                <p class="font-medium text-amber-900 dark:text-amber-200">
                  {$t('components.settings.domains.ssl_pending_heading')}
                </p>
                <p class="mt-1 text-amber-800 dark:text-amber-300">
                  {$t('components.settings.domains.ssl_pending_body')}
                </p>
              </div>
            </div>
          </Field.Field>
        {/if}

        {#if currentDomainStatus !== 'verified' && domainSetup?.dnsRecords?.length}
          <Field.Field>
            <div class="ui:bg-card overflow-hidden rounded-lg border">
              {#each domainSetup.dnsRecords as record, i (record.name + i)}
                {@const fields = [
                  { label: $t('components.settings.domains.dns_name'), value: stripZone(record.name) },
                  { label: $t('components.settings.domains.dns_value'), value: record.value }
                ]}
                <div class={'p-4 ' + (i > 0 ? 'border-t' : '')}>
                  <div class="mb-3 flex items-center gap-2">
                    <span
                      class={'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold tracking-wide ' +
                        (record.type === 'CNAME'
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900'
                          : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700')}
                    >
                      {record.type}
                    </span>
                    <span class="ui:text-muted-foreground text-xs">
                      Record {i + 1} of {domainSetup.dnsRecords.length}
                    </span>

                    <span
                      class={'ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ' +
                        (record.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900'
                          : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900')}
                      aria-label={record.status === 'active'
                        ? $t('components.settings.domains.record_active')
                        : $t('components.settings.domains.record_pending')}
                    >
                      {#if record.status === 'active'}
                        <CheckIcon class="size-3" />
                        <span>{$t('components.settings.domains.record_active')}</span>
                      {:else}
                        <ClockIcon class="size-3" />
                        <span>{$t('components.settings.domains.record_pending')}...</span>
                      {/if}
                    </span>
                  </div>

                  <div class="flex flex-wrap gap-x-6 gap-y-3">
                    {#each fields as field (field.label)}
                      <div class="min-w-[240px] flex-1">
                        <div class="ui:text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                          {field.label}
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="min-w-0 flex-1 truncate font-mono text-sm" title={field.value}
                            >{field.value}</span
                          >
                          <CopyButton
                            text={field.value}
                            variant="outline"
                            size="icon-sm"
                            aria-label={'Copy ' + field.label}
                            class="shrink-0"
                          />
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </Field.Field>
        {:else if currentDomainStatus !== 'verified'}
          <Field.Field>
            <div class="ui:text-muted-foreground rounded-md border px-4 py-3 text-sm">
              {$t('components.settings.domains.reconnect_hint')}
            </div>
          </Field.Field>
        {/if}

        <Field.Field orientation="horizontal">
          {#if currentDomainStatus === 'reconnect_required'}
            <Button
              class="flex items-center gap-2 py-2"
              onclick={handleReconnectCustomDomain}
              loading={isCustomDomainLoading}
            >
              {$t('components.settings.domains.reconnect')}
            </Button>
          {:else if currentDomainStatus !== 'verified'}
            <Button
              variant="outline"
              class="flex items-center gap-2 py-2"
              onclick={() => handleRefreshCustomDomain()}
              loading={isRefreshing}
            >
              {#if !isRefreshing}
                <RotateCcwIcon size={16} />
              {/if}
              {$t('components.settings.domains.refresh')}
            </Button>
            <Button
              variant="destructive"
              class="flex items-center gap-2 py-2"
              onclick={handleRemoveCustomDomain}
              loading={isCustomDomainLoading}
            >
              {#if !isCustomDomainLoading}
                <TrashIcon size={16} />
              {/if}
              {$t('components.settings.domains.remove')}
            </Button>
          {/if}
        </Field.Field>
      {:else}
        <Field.Field>
          <Field.Label class="font-bold">{$t('components.settings.domains.your_domain')}</Field.Label>
          <DomainInput bind:value={customDomain} placeholder="yourwebsite.com" suffix="" disabled={$isFreePlan} />
          {#if errors.customDomain}
            <Field.Error>{errors.customDomain}</Field.Error>
          {/if}
        </Field.Field>

        <Field.Field orientation="horizontal">
          <Button
            onclick={$isFreePlan ? () => {} : handleSaveCustomDomain}
            loading={isCustomDomainLoading}
            disabled={isLoading || !isDomainValid}
          >
            {$t('components.settings.domains.save')}
          </Button>
        </Field.Field>
      {/if}
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('components.settings.domains.custom_favicon')}</Field.Legend>
    <Field.Description>{$t('components.settings.domains.custom_favicon_description')}</Field.Description>
    <Field.Field>
      <UploadImage
        shape="rounded-md"
        bind:avatar={favicon}
        src={$currentOrg.favicon || $currentOrg.avatarUrl || '/logo-512.png'}
        widthHeight="w-16 h-16 lg:w-24 lg:h-24"
        flexDirection="flex-row"
        maxFileSizeInMb={faviconMaxFileSizeMb}
        change={() => {
          hasFaviconChanges = true;
        }}
      />
    </Field.Field>
    <Field.Field orientation="horizontal">
      <Button onclick={handleSaveFavicon} loading={isFaviconLoading} disabled={!hasFaviconChanges}>
        {$t('components.settings.domains.custom_favicon_save')}
      </Button>
      {#if $currentOrg.favicon}
        <Button variant="secondary" onclick={handleRemoveFavicon} loading={isFaviconLoading}>
          {$t('components.settings.domains.custom_favicon_remove')}
        </Button>
      {/if}
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('components.settings.domains.custom_code')}</Field.Legend>
    <ComingSoon />
    <Field.Field>
      <Textarea
        bind:value={customCode}
        placeholder="e.g <link rel='stylesheet' href='https://example.com/style.css' />"
        class="w-4/5"
        rows={7}
        disabled={true}
      />
    </Field.Field>
  </Field.Set>
</Field.Group>
