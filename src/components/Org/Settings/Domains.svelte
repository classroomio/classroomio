<script>
  import { goto } from '@sapper/app';
  import { Grid, Row, Column } from 'carbon-components-svelte';
  import TextField from '../../Form/TextField.svelte';
  import ComingSoon from '../../ComingSoon/index.svelte';
  import PrimaryButton from '../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../PrimaryButton/constants';
  import { currentOrg } from '../../../utils/store/org';
  import { supabase } from '../../../utils/functions/supabase';
  import { blockedSubdomain } from '../../../utils/constants/app';
  import { snackbarStore } from '../../Snackbar/store';
  import { SNACKBAR_SEVERITY } from '../../Snackbar/constants';
  import SectionTitle from '../SectionTitle.svelte';

  let siteName;
  let errors = '';
  let isLoading = false;

  async function handleChangeDomain() {
    if (blockedSubdomain.includes(siteName || '')) {
      errors = 'Sitename already exists.';
      return;
    }
    isLoading = true;

    const { data: org, error } = await supabase
      .from('organization')
      .update(
        { siteName },
        {
          returning: 'minimal', // Don't return the value after inserting
        }
      )
      .match({ id: $currentOrg.id });

    console.log('Updating organisation', org);
    if (error) {
      console.log('Error: create organisation', error);
      errors = 'Sitename already exists.';
    } else {
      $snackbarStore.open = true;
      $snackbarStore.message = 'Success';
      $snackbarStore.severity = SNACKBAR_SEVERITY.SUCCESS;
      $currentOrg.siteName = siteName;

      goto(`/org/${$currentOrg.siteName}/settings/domains`);
    }

    isLoading = false;
  }

  function setSiteName(_siteName) {
    if (!siteName) {
      siteName = _siteName;
    }
  }

  function resetErrors(_siteName) {
    if (errors) {
      errors = '';
    }
  }

  $: resetErrors(siteName);
  $: setSiteName($currentOrg.siteName);
</script>

<Grid class="border rounded border-gray-200 w-full mt-5">
  <Row class="py-7 border-bottom-c">
    <Column sm={2} md={2} lg={4} class="text-lg"
      ><SectionTitle>Add</SectionTitle></Column
    >
    <Column sm={2} md={6} lg={8}>
      <p class="text-md text-gray-500 dark:text-white mb-5">
        Add your team mates or collaborators to your organization. Start working
        together
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
          errorMessage={errors}
        />
        <PrimaryButton
          label="Change Domain"
          className="mb-6 py-4"
          variant={VARIANTS.CONTAINED}
          onClick={handleChangeDomain}
          isDisabled={isLoading}
        />
      </div>
    </Column>
  </Row>

  <Row class="py-7 border-bottom-c">
    <Column sm={2} md={2} lg={4} class="text-lg"
      ><SectionTitle>Custom domain</SectionTitle></Column
    >
    <Column sm={2} md={6} lg={8}>
      <div class="flex items-center">
        <p class="dark:text-white mr-3">Add your own domain name</p>
        <ComingSoon />
      </div>
    </Column>
  </Row>
</Grid>
