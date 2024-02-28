<script lang="ts">
  import { goto } from '$app/navigation';
  import { Grid, Row, Column } from 'carbon-components-svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import ComingSoon from '$lib/components/ComingSoon/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { currentOrg } from '$lib/utils/store/org';
  import { supabase } from '$lib/utils/functions/supabase';
  import { blockedSubdomain } from '$lib/utils/constants/app';
  import { snackbar } from '$lib/components/Snackbar/store';
  import SectionTitle from '../SectionTitle.svelte';
  import VisitOrgSiteButton from '$lib/components/Buttons/VisitOrgSite.svelte';
  import { updateOrgSiteNameValidation } from '$lib/utils/functions/validator';

  type Error = {
    siteName: string;
  };

  let siteName = '';
  let errors: Error = {
    siteName: ''
  };
  let isLoading = false;

  async function handleChangeDomain() {
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

    const { data: org, error } = await supabase
      .from('organization')
      .update({ siteName })
      .match({ id: $currentOrg.id });

    console.log('Updating organisation', org);
    if (error) {
      console.log('Error: create organisation', error);
      errors.siteName = 'Sitename already exists.';
    } else {
      snackbar.success();
      $currentOrg.siteName = siteName;

      goto(`/org/${$currentOrg.siteName}/settings/domains`);
    }

    isLoading = false;
  }

  function setSiteName(_siteName: string) {
    if (!siteName) {
      siteName = _siteName;
    }
  }

  function resetErrors(_siteName: string) {
    if (errors.siteName) {
      errors.siteName = '';
    }
  }

  $: resetErrors(siteName);
  $: setSiteName($currentOrg.siteName);
</script>

<Grid class="border rounded border-gray-200 w-full mt-5">
  <Row class="py-7 border-bottom-c">
    <Column sm={2} md={2} lg={4} class="text-lg"><SectionTitle>Add</SectionTitle></Column>
    <Column sm={2} md={6} lg={8}>
      <p class="text-md text-gray-500 dark:text-white mb-5">
        Add your team mates or collaborators to your organization. Start working together
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
        <div class="flex items-center mb-6">
          <PrimaryButton
            label="Update Domain"
            className="py-4"
            variant={VARIANTS.OUTLINED}
            onClick={handleChangeDomain}
            isDisabled={isLoading}
          />

          <VisitOrgSiteButton />
        </div>
      </div>
    </Column>
  </Row>

  <Row class="py-7 border-bottom-c">
    <Column sm={2} md={2} lg={4} class="text-lg"><SectionTitle>Custom domain</SectionTitle></Column>
    <Column sm={2} md={6} lg={8}>
      <div class="flex items-center">
        <p class="dark:text-white mr-3">Add your own domain name</p>
        <ComingSoon />
      </div>
    </Column>
  </Row>
</Grid>
