<script lang="ts">
  import { preventDefault } from 'svelte/legacy';

  import Modal from '$lib/components/Modal/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { profile } from '$lib/utils/store/user';
  import { generateSitename } from '$lib/utils/functions/org';
  import { getOrganizations } from '$lib/utils/services/org';
  import { blockedSubdomain } from '$lib/utils/constants/app';
  import { newOrgModal } from '../store';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { createOrgValidation } from '$lib/utils/functions/validator';
  import { goto } from '$app/navigation';
  import { t } from '$lib/utils/functions/translations';

  type Error = {
    orgName: string;
    siteName: string;
  };
  let loading = $state(false);
  let orgName = $state('');
  let siteName = $state('');

  let errors: Error = $state({
    orgName: '',
    siteName: ''
  });

  function resetForm() {
    orgName = '';
    siteName = '';
    loading = false;

    errors = {
      orgName: '',
      siteName: ''
    };
  }

  async function createNewOrg() {
    errors = createOrgValidation({
      orgName,
      siteName
    }) as Error;

    if (Object.values(errors).length) {
      loading = false;
      return;
    }
    // Validate if domain is among our seculeded subdomains
    if (blockedSubdomain.includes(siteName || '')) {
      errors.siteName = 'Sitename already exists.';
      loading = false;
      return;
    }

    const { data: org, error } = await supabase
      .from('organization')
      .insert({
        name: orgName,
        siteName: siteName
      })
      .select();
    console.log('Create organisation', org);

    if (error) {
      console.log('Error: create organisation', error);
      errors.siteName = 'Sitename already exists.';
      loading = false;
      return;
    }

    if (Array.isArray(org) && org.length) {
      const orgData = org[0];
      const { data, error } = await supabase
        .from('organizationmember')
        .insert({
          organization_id: orgData.id,
          profile_id: $profile.id,
          role_id: 1
        })
        .select();

      console.log('Create organisation member', data);

      if (error) {
        console.log('Error: create organisation member', error);
        errors.siteName = $t('add_org.error_organization');

        // Delete organization so it can be recreated.
        await supabase.from('organization').delete().match({ siteName });
        loading = false;
        return;
      }

      snackbar.success();
      await getOrganizations($profile.id);
      goto(`/org/${siteName}`);
      $newOrgModal.open = false;

      resetForm();
    }
  }

  $effect(() => {
    siteName = generateSitename(orgName);
  });
</script>

<Modal
  onClose={() => ($newOrgModal.open = false)}
  bind:open={$newOrgModal.open}
  width="w-96"
  modalHeading={$t('add_org.create_org')}
>
  <form onsubmit={preventDefault(createNewOrg)} class="px-2">
    <TextField
      label={$t('add_org.name')}
      bind:value={orgName}
      autoFocus={true}
      placeholder="e.g Pepsi Co"
      className="mb-4"
      isRequired={true}
      errorMessage={errors.orgName}
      autoComplete={false}
    />
    <!-- Org Site Name -->
    <TextField
      label={$t('add_org.org_sitename')}
      helperMessage={`https://${siteName || ''}.classroomio.com`}
      bind:value={siteName}
      name="sitename"
      type="text"
      placeholder="e.g edforall"
      className="mb-5 w-full"
      labelClassName="text-lg font-normal"
      errorMessage={errors.siteName}
      isRequired={true}
    />

    <div class="mt-5 flex flex-row-reverse items-center">
      <PrimaryButton
        className="px-6 py-3"
        label={$t('add_org.create')}
        type="submit"
        isLoading={loading}
      />
    </div>
  </form>
</Modal>
