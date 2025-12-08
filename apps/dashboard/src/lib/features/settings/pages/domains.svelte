<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import Copy from '@lucide/svelte/icons/copy';
  import isValidDomain from 'is-valid-domain';
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import { parse } from 'tldts';

  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { orgApi } from '$lib/features/org/api/org.svelte';
  import { blockedSubdomain } from '$lib/utils/constants/app';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { copyToClipboard } from '$lib/utils/functions/formatYoutubeVideo';
  import { updateOrgSiteNameValidation } from '$lib/utils/functions/validator';
  import { sanitizeDomain, sendDomainRequest } from '$lib/utils/functions/domain';

  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Textarea } from '@cio/ui/base/textarea';
  import { DomainInput } from '@cio/ui/custom/domain-input';
  import { ComingSoon, UpgradeBanner } from '$lib/features/ui';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import VisitOrgSiteButton from '$lib/components/Buttons/VisitOrgSite.svelte';
  import * as Field from '@cio/ui/base/field';

  let siteName = $derived($currentOrg.siteName);
  let customDomain = $state('');
  let customCode = $state('');
  let favicon = $state('');
  let isLoading = $state(false);
  let isCustomDomainLoading = $state(false);
  let isRefreshing = $state(false);

  const isDomainValid = $derived(isValidDomain(sanitizeDomain(customDomain), { subdomain: true }));

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
      siteName
    });

    if (orgApi.success) {
      $currentOrg.siteName = siteName;
      goto(`/org/${$currentOrg.siteName}/settings/domains`);
    } else {
      if (orgApi.errors.general) {
        errors.siteName = orgApi.errors.general;
      } else {
        errors.siteName = $t('add_org.sitename');
      }
    }

    isLoading = false;
  }

  async function handleSaveCustomDomain() {
    if (!isDomainValid) return;

    const sanitizedDomain = sanitizeDomain(customDomain);

    const details = parse(sanitizedDomain);
    if (!details.subdomain) {
      errors.customDomain = $t('components.settings.domains.custom_domain_error');
      return;
    }

    if (sanitizedDomain.includes('classroomio.com')) {
      errors.customDomain = $t('components.settings.domains.custom_domain_not_classroomio');
      return;
    }

    isCustomDomainLoading = true;

    await orgApi.update($currentOrg.id, {
      customDomain: sanitizedDomain
    });

    if (!orgApi.success) {
      errors.customDomain = orgApi.errors.general || 'Failed to update custom domain';
      isCustomDomainLoading = false;
      return;
    }

    try {
      const response = await sendDomainRequest('add_domain', sanitizedDomain);
      const data = await response.json();
      console.log('added domain to vercel', data);
    } catch (error) {
      console.log('Error: adding domain to vercel', error);
      snackbar.error(error as string);
      isCustomDomainLoading = false;
      return;
    }

    $currentOrg.customDomain = sanitizedDomain;
    isCustomDomainLoading = false;
  }

  async function handleRemoveCustomDomain() {
    if (!$currentOrg.customDomain) return;

    isCustomDomainLoading = true;

    await orgApi.update($currentOrg.id, {
      customDomain: null,
      isCustomDomainVerified: false
    });

    if (!orgApi.success) {
      snackbar.error(orgApi.errors.general || 'Failed to remove custom domain');
      isCustomDomainLoading = false;
      return;
    }

    try {
      const response = await sendDomainRequest('remove_domain', $currentOrg.customDomain);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      console.log('removed domain from vercel', data);
    } catch (error) {
      console.log('Error: removing domain from vercel', error);
      snackbar.error(error as string);
      isCustomDomainLoading = false;
      return;
    }

    $currentOrg.customDomain = '';
    $currentOrg.isCustomDomainVerified = false;
    isCustomDomainLoading = false;
  }

  async function handleRefreshCustomDomain() {
    isRefreshing = true;

    try {
      const response = await sendDomainRequest('verify_domain', $currentOrg.customDomain || '');
      const data = await response.json();

      console.log('data', data);
      if (data.verified && !$currentOrg.isCustomDomainVerified) {
        await orgApi.update($currentOrg.id, {
          isCustomDomainVerified: true
        });

        if (orgApi.success) {
          $currentOrg.isCustomDomainVerified = true;
        }
      }
    } catch (error) {
      console.log('Error: refreshing domain', error);
      snackbar.error(error as string);
    }

    isRefreshing = false;
  }

  function resetErrors(_siteName: string, _customDomain: string) {
    untrack(() => {
      if (errors.siteName) {
        errors.siteName = '';
      }
      if (errors.customDomain) {
        errors.customDomain = '';
      }
    });
  }

  function getSubdomain() {
    const details = parse($currentOrg.customDomain || '');
    return details.subdomain;
  }

  $effect(() => {
    resetErrors(siteName, customDomain);
  });
</script>

<Field.Group class="max-w-md! w-full px-2">
  <Field.Set>
    <Field.Legend>{$t('components.settings.domains.add')}</Field.Legend>
    <Field.Description class="">{$t('settings.organization.organization_profile.custom_domain.body')}</Field.Description
    >

    <Field.Field>
      <Field.Label>URL</Field.Label>
      <DomainInput bind:value={siteName} placeholder="myschool" prefix="https://" suffix=".classroomio.com" />
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
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <p class="text-md flex items-center gap-2 font-medium">
                {$currentOrg.customDomain}
                <Button variant="outline" size="icon-sm" onclick={() => goto(`https://${$currentOrg.customDomain}`)}>
                  <ArrowUpRightIcon size={16} />
                </Button>
              </p>
              <div
                class="mt-1 h-2 w-2 rounded-full bg-{$currentOrg.isCustomDomainVerified ? 'green' : 'yellow'}-400"
              ></div>
            </div>
            {#if $currentOrg.isCustomDomainVerified}
              <Badge variant="default" class="bg-green-500 px-3 text-xs text-white">Verified</Badge>
            {:else}
              <Badge variant="default" class="bg-yellow-500 px-3 text-xs text-white">Pending verification</Badge>
            {/if}
          </div>
        </Field.Field>

        <Field.Description>{$t('components.settings.domains.dns_description')}</Field.Description>

        <Field.Field>
          <div class="flex items-center gap-10 rounded-md border px-4 py-2">
            <div class="flex h-[72px] flex-col justify-evenly">
              <Field.Label class="font-light">{$t('components.settings.domains.dns_type')}</Field.Label>
              <p class="flex h-[40px] items-center">CNAME</p>
            </div>
            <div class="flex h-[72px] flex-col justify-evenly">
              <Field.Label class="font-light">{$t('components.settings.domains.dns_name')}</Field.Label>
              <p class="flex h-[40px] items-center">
                {getSubdomain()}
              </p>
            </div>
            <div class="flex h-[72px] flex-col justify-evenly">
              <Field.Label class="font-light">{$t('components.settings.domains.dns_value')}</Field.Label>
              <p class=" flex items-center gap-1">
                cname.vercel-dns.com
                <Button variant="ghost" size="icon-sm" onclick={() => copyToClipboard('cname.vercel-dns.com')}>
                  <p>cname.vercel-dns.com</p>
                  <Copy />
                </Button>
              </p>
            </div>
          </div>
        </Field.Field>

        <Field.Field orientation="horizontal">
          <Button
            variant="outline"
            class="flex items-center gap-2 py-2"
            onclick={handleRefreshCustomDomain}
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
