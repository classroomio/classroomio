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
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { blockedSubdomain } from '$lib/utils/constants/app';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { copyToClipboard } from '$lib/utils/functions/formatYoutubeVideo';
  import { updateOrgSiteNameValidation } from '$lib/utils/functions/validator';
  import { sanitizeDomain, sendDomainRequest } from '$lib/utils/functions/domain';

  import { Row, Grid, Column } from './Layout';
  import SectionTitle from '../SectionTitle.svelte';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import { IconButton } from '$lib/components/IconButton';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import ComingSoon from '$lib/components/ComingSoon/index.svelte';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import VisitOrgSiteButton from '$lib/components/Buttons/VisitOrgSite.svelte';

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

    const { data: org, error } = await supabase.from('organization').update({ siteName }).match({ id: $currentOrg.id });

    console.log('Updating organisation', org);
    if (error) {
      console.log('Error: create organisation', error);
      errors.siteName = $t('add_org.sitename');
    } else {
      snackbar.success();
      $currentOrg.siteName = siteName;

      goto(`/org/${$currentOrg.siteName}/settings/domains`);
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
    const { error } = await supabase
      .from('organization')
      .update({ customDomain: sanitizedDomain })
      .match({ id: $currentOrg.id });

    if (error) {
      console.log('Error: create organisation', error);
      errors.customDomain = error.message;
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
    snackbar.success('components.settings.domains.custom_domain_success');
    $currentOrg.customDomain = sanitizedDomain;

    isCustomDomainLoading = false;
  }

  async function handleRemoveCustomDomain() {
    if (!$currentOrg.customDomain) return;

    isCustomDomainLoading = true;
    const { error } = await supabase
      .from('organization')
      .update({ customDomain: null, isCustomDomainVerified: false })
      .match({ id: $currentOrg.id });

    if (error) {
      console.log('Error: updating organisation', error);
      snackbar.error(error.message);
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

    snackbar.success();

    $currentOrg.customDomain = undefined;
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
        $currentOrg.isCustomDomainVerified = true;

        await supabase.from('organization').update({ isCustomDomainVerified: true }).match({ id: $currentOrg.id });
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

<Grid class="mt-5 w-full rounded border border-gray-200 dark:border-neutral-600">
  <Row class="border-bottom-c py-7">
    <Column sm={4} md={4} lg={4} class="text-lg">
      <SectionTitle>{$t('components.settings.domains.add')}</SectionTitle>
    </Column>

    <Column sm={8} md={8} lg={8} class="space-y-2">
      <p class="text-md mb-5 text-gray-500 dark:text-white">
        {$t('settings.organization.organization_profile.custom_domain.body')}
      </p>

      <div>
        <!-- Org Site Name -->
        <TextField
          label="URL"
          helperMessage={`https://${siteName || ''}.classroomio.com`}
          bind:value={siteName}
          type="text"
          placeholder="e.g traversymedia"
          className="mb-5 w-full"
          labelClassName=""
          errorMessage={errors.siteName}
        />
        <div class="mb-6 flex items-center">
          <PrimaryButton
            label={$t('components.settings.domains.update')}
            className="py-2"
            variant={VARIANTS.OUTLINED}
            onClick={handleSaveSiteName}
            isDisabled={isLoading}
          />

          <VisitOrgSiteButton />
        </div>
      </div>
    </Column>
  </Row>

  <Row class="py-7">
    <UpgradeBanner className="mb-5">{$t('upgrade.domain')}</UpgradeBanner>
    <Column sm={4} md={4} lg={4} class="text-lg">
      <SectionTitle>
        {$t('components.settings.domains.custom')}
      </SectionTitle>
    </Column>

    <Column sm={8} md={8} lg={8} class="space-y-2">
      <div class="border-bottom-c pb-10">
        <!-- DNS Configuration -->
        {#if $currentOrg.customDomain}
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <p class="text-md flex items-center gap-2 font-medium">
                {$currentOrg.customDomain}

                <IconButton contained={true} size="small" onClick={() => goto(`https://${$currentOrg.customDomain}`)}>
                  <ArrowUpRightIcon size={16} />
                </IconButton>
              </p>

              <div
                class="mt-1 h-2 w-2 rounded-full bg-{$currentOrg.isCustomDomainVerified ? 'green' : 'yellow'}-400"
              ></div>
            </div>
            {#if $currentOrg.isCustomDomainVerified}
              <TextChip value="Verified" className="bg-green-500 text-white text-xs px-3" size="sm" />
            {:else}
              <TextChip value="Pending verification" className="bg-yellow-500 text-white text-xs px-3" size="sm" />
            {/if}
          </div>

          <div class="mb-4 text-sm text-gray-500">
            {$t('components.settings.domains.dns_description')}
          </div>

          <div class="mb-4 flex items-center gap-10 rounded-md border px-4 py-2">
            <div class="flex h-[72px] flex-col justify-evenly">
              <p class="text-sm font-light">{$t('components.settings.domains.dns_type')}</p>
              <p class="flex h-[40px] items-center">CNAME</p>
            </div>

            <div class="flex h-[72px] flex-col justify-evenly">
              <p class="text-sm font-light">{$t('components.settings.domains.dns_name')}</p>
              <p class="flex h-[40px] items-center">
                {getSubdomain()}
              </p>
            </div>

            <div class="flex h-[72px] flex-col justify-evenly">
              <p class="text-sm font-light">{$t('components.settings.domains.dns_value')}</p>
              <p class=" flex items-center gap-1">
                cname.vercel-dns.com
                <IconButton onClick={() => copyToClipboard('cname.vercel-dns.com')}>
                  <p>cname.vercel-dns.com</p>

                  <Copy />
                </IconButton>
              </p>
            </div>
          </div>

          <div class="mt-5 flex items-center justify-between">
            <PrimaryButton
              className="py-2 flex items-center gap-2"
              onClick={handleRefreshCustomDomain}
              isLoading={isRefreshing}
              variant={VARIANTS.OUTLINED}
            >
              {#if !isRefreshing}
                <RotateCcwIcon size={16} />
              {/if}
              {$t('components.settings.domains.refresh')}
            </PrimaryButton>

            <PrimaryButton
              className="py-2 flex items-center gap-2"
              onClick={handleRemoveCustomDomain}
              isLoading={isCustomDomainLoading}
              variant={VARIANTS.CONTAINED_DANGER}
            >
              {#if !isCustomDomainLoading}
                <TrashIcon size={16} />
              {/if}
              {$t('components.settings.domains.remove')}
            </PrimaryButton>
          </div>
        {:else}
          <!-- Add Custom Domain -->
          <div class="mb-4 flex items-center gap-5">
            <p class="font-bold">{$t('components.settings.domains.your_domain')}</p>
          </div>
          <TextField
            bind:value={customDomain}
            type="text"
            placeholder="courses.yourwebsite.com"
            helperMessage="https://{customDomain || 'course.yourwebsite.com'}"
            errorMessage={errors.customDomain}
            className="w-4/5"
            isDisabled={$isFreePlan}
          />

          <div class="mt-5 flex items-center">
            <PrimaryButton
              label={$t('components.settings.domains.save')}
              className="py-2"
              onClick={$isFreePlan ? () => {} : handleSaveCustomDomain}
              isLoading={isCustomDomainLoading}
              isDisabled={isLoading || !isDomainValid}
            />
          </div>
        {/if}
      </div>

      <div class="border-bottom-c py-10">
        <div class="mb-4 flex items-center gap-5">
          <p class="font-bold">{$t('components.settings.domains.custom_favicon')}</p>
          <ComingSoon />
        </div>

        <div class="flex items-center">
          <UploadImage
            shape="rounded-md"
            bind:avatar={favicon}
            src={$currentOrg.favicon ?? '/logo-512.png'}
            widthHeight="w-16 h-16 lg:w-24 lg:h-24"
            flexDirection="flex-row"
            isDisabled={true}
          />
        </div>
      </div>

      <div class="py-10">
        <div class="mb-4 flex items-center gap-5">
          <p class="font-bold">{$t('components.settings.domains.custom_code')}</p>
          <ComingSoon />
        </div>

        <TextArea
          bind:value={customCode}
          placeholder="e.g <link rel='stylesheet' href='https://example.com/style.css' />"
          className="w-4/5"
          rows={7}
          disabled={true}
        />
      </div>
      <!-- <div class="flex items-center">
        <p class="dark:text-white mr-3">
          {$t('components.settings.domains.domain')}
        </p>

        <ComingSoon />
      </div> -->
    </Column>
  </Row>
</Grid>
