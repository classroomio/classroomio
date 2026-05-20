<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import Copy from '@lucide/svelte/icons/copy';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
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
  import { copyToClipboard } from '$lib/utils/functions/formatYoutubeVideo';
  import { updateOrgSiteNameValidation } from '$lib/utils/functions/validator';
  import { sanitizeDomain, sendDomainRequest } from '$lib/utils/functions/domain';
  import { BRAND_ROOT_DOMAIN, TENANT_ROOT_DOMAIN } from '@cio/utils/constants';

  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Textarea } from '@cio/ui/base/textarea';
  import { DomainInput } from '@cio/ui/custom/domain-input';
  import { ComingSoon, UpgradeBanner, UploadImage, VisitOrgSiteButton } from '$features/ui';
  import * as Field from '@cio/ui/base/field';

  let siteName = $derived($currentOrg.siteName);
  let customDomain = $state('');
  let customCode = $state('');
  let favicon = $state('');
  let isLoading = $state(false);
  let isCustomDomainLoading = $state(false);
  let isRefreshing = $state(false);
  let domainSetup = $state<DomainRequestData | null>(null);

  const isDomainValid = $derived(isValidDomain(sanitizeDomain(customDomain), { subdomain: true }));
  const currentDomainStatus = $derived<DomainRequestStatus | null>(
    domainSetup?.status ??
      ($currentOrg.customDomain ? ($currentOrg.isCustomDomainVerified ? 'verified' : 'pending_verification') : null)
  );

  type Error = {
    siteName: string;
    customDomain: string;
  };

  let errors: Error = $state({
    siteName: '',
    customDomain: ''
  });

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
    domainSetup = data;

    if (data.status === 'removed') {
      $currentOrg.customDomain = '';
      $currentOrg.isCustomDomainVerified = false;
      return;
    }

    $currentOrg.customDomain = data.hostname;
    $currentOrg.isCustomDomainVerified = data.verified;
    customDomain = '';
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
        return 'bg-green-500 text-white';
      case 'pending_dns':
      case 'pending_verification':
        return 'bg-yellow-500 text-white';
      case 'reconnect_required':
      case 'error':
        return 'bg-red-500 text-white';
      case 'removed':
        return 'bg-slate-500 text-white';
      default:
        return 'bg-yellow-500 text-white';
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
    const { parse } = await import('tldts/dist/es6/index.js');
    const details = parse(sanitizedDomain);

    if (!details.subdomain) {
      errors.customDomain = $t('components.settings.domains.custom_domain_error');
      return;
    }

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

  onMount(() => {
    if ($currentOrg.customDomain) {
      void handleRefreshCustomDomain(true);
    }
  });

  $effect(() => {
    resetErrors(siteName, customDomain);
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
      <VisitOrgSiteButton />
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
                <Button variant="outline" size="icon-sm" onclick={() => goto(`https://${$currentOrg.customDomain}`)}>
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
          </div>
        </Field.Field>

        <Field.Description>{getDomainStatusDescription(currentDomainStatus)}</Field.Description>

        {#if domainSetup?.dnsRecords?.length}
          <Field.Field>
            <div class="space-y-3 rounded-md border px-4 py-3">
              {#each domainSetup.dnsRecords as record (record.name)}
                <div class="grid gap-3 sm:grid-cols-[80px,1fr,1fr] sm:items-center">
                  <div>
                    <Field.Label class="font-light">{$t('components.settings.domains.dns_type')}</Field.Label>
                    <p>{record.type}</p>
                  </div>

                  <div class="min-w-0">
                    <Field.Label class="font-light">{$t('components.settings.domains.dns_name')}</Field.Label>
                    <div class="flex items-center gap-2">
                      <p class="truncate">{record.name}</p>
                      <Button variant="ghost" size="icon-sm" onclick={() => copyToClipboard(record.name)}>
                        <Copy />
                      </Button>
                    </div>
                  </div>

                  <div class="min-w-0">
                    <Field.Label class="font-light">{$t('components.settings.domains.dns_value')}</Field.Label>
                    <div class="flex items-center gap-2">
                      <p class="truncate">{record.value}</p>
                      <Button variant="ghost" size="icon-sm" onclick={() => copyToClipboard(record.value)}>
                        <Copy />
                      </Button>
                    </div>
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
              variant="outline"
              class="flex items-center gap-2 py-2"
              onclick={handleReconnectCustomDomain}
              loading={isCustomDomainLoading}
            >
              {$t('components.settings.domains.reconnect')}
            </Button>
          {:else}
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
          {/if}

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
        </Field.Field>
      {:else}
        <Field.Field>
          <Field.Label class="font-bold">{$t('components.settings.domains.your_domain')}</Field.Label>
          <DomainInput bind:value={customDomain} placeholder="courses.yourwebsite" disabled={$isFreePlan} />
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
    <ComingSoon />
    <Field.Field>
      <UploadImage
        shape="rounded-md"
        bind:avatar={favicon}
        src={$currentOrg.favicon ?? '/logo-512.png'}
        widthHeight="w-16 h-16 lg:w-24 lg:h-24"
        flexDirection="flex-row"
        isDisabled={true}
      />
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
