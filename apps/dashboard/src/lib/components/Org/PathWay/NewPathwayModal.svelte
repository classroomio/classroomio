<script lang="ts">
  import { page } from '$app/stores';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';

  import { goto } from '$app/navigation';

  import { createPathwayModal } from '../store';
  import { t } from '$lib/utils/functions/translations';

  let errors = {
    title: '',
    description: ''
  };
  const createPathway = () => {
    console.log('clicked create pathway');
  };
  const onClose = (url) => {
    return goto(url);
  };
  $: open = new URLSearchParams($page.url.search).get('new_pathway') === 'true';
</script>

<svelte:head>
  <title>Create new collection</title>
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
      />
    </div>
  </form>
</Modal>
