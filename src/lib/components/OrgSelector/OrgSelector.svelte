<script>
  import { Popover, SkeletonText } from 'carbon-components-svelte';
  import CaretSortIcon from 'carbon-icons-svelte/lib/CaretSort.svelte';
  import OrgSelectorItem from './OrgSelectorItem.svelte';
  import Modal from '../Modal/index.svelte';
  import TextField from '../Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { currentOrg } from '$lib/utils/store/org';

  let open = false;
  let openAddOrg = false;
  let loading = false;
  let orgName = '';

  const IS_FEATURE_ENABLED = false;

  function handleAddOrg() {
    if (IS_FEATURE_ENABLED) {
      console.log('add org modal');
      open = false;
      openAddOrg = true;
    }
  }

  function createNewOrg() {}
</script>

<div class="mt-5 relative" data-outline>
  {#if $currentOrg.name}
    <button
      class="flex items-center cursor-pointer max-w-[219px]"
      on:click={(e) => {
        e.stopPropagation();
        open = !open;
      }}
    >
      <p class="dark:text-white text-lg font-bold whitespace-nowrap truncate">
        {$currentOrg.name}
      </p>
      <CaretSortIcon size={16} class="ml-2" />
    </button>
  {:else}
    <div class="w-[219px] h-[30px]">
      <SkeletonText style="width: 100%; height: 100%;" />
    </div>
  {/if}

  <Popover bind:open closeOnOutsideClick align="bottom-left">
    <OrgSelectorItem
      size="sm"
      active={true}
      avatarText={$currentOrg.shortName}
      text={$currentOrg.name}
      hasDivider={true}
      onClick={() => null}
    />
    <OrgSelectorItem
      size=""
      text=" + Add Organization"
      onClick={handleAddOrg}
      disabled={!IS_FEATURE_ENABLED}
    />
  </Popover>
</div>

{#if openAddOrg}
  <Modal
    onClose={() => (openAddOrg = false)}
    bind:open={openAddOrg}
    width="w-96"
    modalHeading="Create Organization"
  >
    <form on:submit|preventDefault={createNewOrg} class="px-2">
      <TextField
        label="Name of Organization"
        bind:value={orgName}
        autoFocus={true}
        placeholder="e.g Pepsi Co"
        className="mb-4"
        isRequired={true}
        autoComplete={false}
      />

      <div class="mt-5 flex items-center flex-row-reverse">
        <PrimaryButton
          className="px-6 py-3"
          label="Create Organization"
          type="submit"
          isLoading={loading}
        />
      </div>
    </form>
  </Modal>
{/if}
