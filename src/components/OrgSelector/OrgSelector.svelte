<script context="module">
  export async function preload({ params }) {
    return params.slug;
  }
</script>

<script>
  import { Popover } from 'carbon-components-svelte';
  import CaretSortIcon from 'carbon-icons-svelte/lib/CaretSort16';
  import OrgSelectorItem from './OrgSelectorItem.svelte';
  import Modal from '../Modal/index.svelte';
  import TextField from '../Form/TextField.svelte';
  import PrimaryButton from '../PrimaryButton/index.svelte';

  let open = false;
  let openAddOrg = false;
  let loading = false;
  let orgName = '';

  function handleAddOrg() {
    console.log('add org modal');
    open = false;
    openAddOrg = true;
  }

  function createNewOrg() {}
</script>

<div class="mt-5 relative" data-outline>
  <div
    class="flex items-center cursor-pointer"
    on:click={(e) => {
      e.stopPropagation();
      open = !open;
    }}
  >
    <p class="text-lg font-bold">DigDippa</p>
    <CaretSortIcon class="ml-2" />
  </div>
  <Popover bind:open closeOnOutsideClick align="bottom-left">
    <OrgSelectorItem
      size="sm"
      active={false}
      avatarText="DA"
      text="DigDippa"
      hasDivider={true}
    />
    <OrgSelectorItem
      size="sm"
      active={true}
      avatarText="PA"
      text="Pepsi Co"
      hasDivider={true}
    />
    <OrgSelectorItem text=" + Add Organization" onClick={handleAddOrg} />
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
