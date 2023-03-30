<script context="module">
  export async function preload({ params }) {
    return params.slug;
  }
</script>

<script>
  import { goto } from '@sapper/app';
  import { Popover } from 'carbon-components-svelte';
  import CaretSortIcon from 'carbon-icons-svelte/lib/CaretSort16';
  import { profile } from '../../utils/store/user';
  import OrgSelectorItem from './SelectorItem.svelte';
  import Modal from '../Modal/index.svelte';
  import TextField from '../Form/TextField.svelte';
  import PrimaryButton from '../PrimaryButton/index.svelte';
  import { currentOrg, orgs } from '../../utils/store/org';
  import { getOrgAcronym } from '../../utils/functions/org';
  import { createNewOrg } from '../../utils/services/org';

  let open = false;
  let openAddOrg = false;
  let loading = false;
  let orgName = '';
  let siteName = '';
  let isSiteNameTouched = false;
  let errors = {};

  function handleAddOrg() {
    console.log('add org modal');
    open = false;
    openAddOrg = true;
  }

  async function handleNewOrg() {
    if (!siteName) return;

    loading = true;
    await createNewOrg(orgName, siteName, $profile.id, errors);
    openAddOrg = false;
    loading = false;
    goto(`/org/${siteName}`);
  }

  function setOrgSiteName(orgName, isTouched) {
    console.log('set org name', orgName, isTouched);
    if (!orgName || isTouched) return;

    siteName = orgName
      // @ts-ignore
      .replaceAll(' ', '-')
      .toLowerCase();
  }

  $: setOrgSiteName(orgName, isSiteNameTouched);
</script>

<div class="mt-5 relative" data-outline>
  <div
    class="flex items-center cursor-pointer"
    on:click={(e) => {
      e.stopPropagation();
      open = !open;
    }}
  >
    <p class="text-lg font-bold">{$currentOrg.name || ''}</p>
    <CaretSortIcon class="ml-2" />
  </div>
  <Popover bind:open closeOnOutsideClick align="bottom-left">
    {#each $orgs as org}
      <OrgSelectorItem
        size="sm"
        active={org.siteName === $currentOrg.siteName}
        avatarText={getOrgAcronym(org.name)}
        text={org.name}
        hasDivider={true}
        onClick={() => {
          open = false;
          goto(`/org/${org.siteName}`);
          currentOrg.set(org);
          console.log('currentOrg', $currentOrg);
        }}
      />
    {/each}
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
    <form on:submit|preventDefault={handleNewOrg} class="px-2">
      <TextField
        label="Name of Organization"
        bind:value={orgName}
        autoFocus={true}
        placeholder="e.g Pepsi Co"
        className="mb-4"
        isRequired={true}
        autoComplete={false}
        onChange={() => (isSiteNameTouched = true)}
      />
      <!-- Org Site Name -->
      <TextField
        label="Organisation Site name"
        helperMessage={`https://${siteName || ''}.classroomio.com`}
        bind:value={siteName}
        isRequired={true}
        type="text"
        placeholder="e.g edforall"
        className="mb-5 w-full"
        labelClassName="text-lg font-normal"
        errorMessage={errors.siteName}
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
