<script lang="ts">
  import { page } from '$app/stores';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import { goto } from '$app/navigation';
  import { createPathwayModal } from '../store';
  import { t } from '$lib/utils/functions/translations';
  import { validateForm } from '$lib/components/Courses/functions';
  import { supabase } from '$lib/utils/functions/supabase';
  import { currentOrg } from '$lib/utils/store/org';
  import { pathways } from './store';
  import { profile } from '$lib/utils/store/user';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { ROLE } from '$lib/utils/constants/roles';
  import { addPathwayGroupMember } from '$lib/utils/services/pathways';

  let errors = {
    title: '',
    description: ''
  };
  let isLoading = false;

  const createPathway = async () => {
    try {
      isLoading = true;
      const { hasError, fieldErrors } = validateForm($createPathwayModal);

      errors = fieldErrors;
      if (hasError) return;

      const { title, description } = $createPathwayModal;
      // 1. Create group
      const { data: newGroup } = await supabase
        .from('group')
        .insert({ name: title, description, organization_id: $currentOrg.id })
        .select();

      console.log(`newGroup`, newGroup);

      if (!newGroup) return;

      const { id: group_id } = newGroup[0];

      // 2. Create pathway with group_id
      const { data: newPathwayData } = await supabase
        .from('pathway')
        .insert({
          title,
          description,
          group_id
        })
        .select();
      console.log(`newPathway data`, newPathwayData);

      if (!newPathwayData) return;

      const newPathway = newPathwayData[0];
      pathways.update((_pathways) => [..._pathways, newPathway]);

      capturePosthogEvent('pathway_created', {
        pathway_id: newPathway.id,
        pathway_title: newPathway.title,
        pathway_description: newPathway.description,
        organization_id: $currentOrg.id,
        organization_name: $currentOrg.name,
        user_id: $profile.id,
        user_email: $profile.email
      });

      // 3. Add group members
      const { data } = await addPathwayGroupMember({
        profile_id: $profile.id,
        email: $profile.email,
        group_id,
        role_id: ROLE.TUTOR
      });

      // onClose(`/pathways/${newPathway.id}`);
      onClose($page.url.pathname);
      snackbar.success('Pathway created succesfully');
    } catch (error) {
      snackbar.error('error creating pathway');
    } finally {
      isLoading = false;
    }
  };
  const onClose = (url) => {
    return goto(url);
  };
  $: open = new URLSearchParams($page.url.search).get('new_pathway') === 'true';
</script>

<svelte:head>
  <title>Create new Pathway</title>
</svelte:head>

<Modal
  onClose={() => onClose($page.url.pathname)}
  bind:open
  width="w-4/5 md:w-2/5 md:min-w-[600px]"
  modalHeading={$t('pathway.new_pathway_modal.heading')}
>
  <form on:submit|preventDefault={createPathway}>
    <div class="flex items-end space-x-2 mb-4">
      <TextField
        label={$t('pathway.new_pathway_modal.pathway_name')}
        bind:value={$createPathwayModal.title}
        placeholder={$t('pathway.new_pathway_modal.pathway_name_placeholder')}
        className="w-full "
        labelClassName="text-sm font-normal"
        isRequired={true}
        errorMessage={errors.title}
        autoComplete={false}
      />
    </div>

    <TextArea
      label={$t('pathway.new_pathway_modal.short_description')}
      bind:value={$createPathwayModal.description}
      rows={4}
      placeholder={$t('pathway.new_pathway_modal.short_description_placeholder')}
      className="mb-4"
      isRequired={true}
      errorMessage={errors.description}
      labelClassName="text-sm font-normal"
      isAIEnabled={true}
      initAIPrompt="Write a 30 word description for a learning collection titled: {$createPathwayModal.title}"
    />

    <div class="mt-5">
      <PrimaryButton
        className="px-6 py-3 font-normal"
        label={$t('pathway.new_pathway_modal.button')}
        type="submit"
        isDisabled={isLoading}
        {isLoading}
      />
    </div>
  </form>
</Modal>
