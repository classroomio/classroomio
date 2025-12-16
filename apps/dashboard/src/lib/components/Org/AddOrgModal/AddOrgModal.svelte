<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';

  import Modal from '$lib/components/Modal/index.svelte';
  import { Input } from '@cio/ui/base/input';
  import { DomainInput } from '@cio/ui/custom/domain-input';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { generateSitename } from '$lib/utils/functions/org';
  import { newOrgModal } from '../store';
  import { t } from '$lib/utils/functions/translations';
  import { orgApi } from '$features/org/api/org.svelte';

  let orgName = $state('');
  let siteName = $derived(generateSitename(orgName));

  function resetForm() {
    orgName = '';
    siteName = '';
    orgApi.errors = {};
  }

  async function createNewOrg() {
    await orgApi.create({ name: orgName, siteName });

    if (orgApi.success) {
      $newOrgModal.open = false;
      resetForm();
    }
  }
</script>

<Modal
  onClose={() => ($newOrgModal.open = false)}
  bind:open={$newOrgModal.open}
  width="w-96"
  modalHeading={$t('add_org.create_org')}
>
  <form onsubmit={preventDefault(createNewOrg)} class="px-2">
    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('add_org.name')}</Field.Label>
        <Input bind:value={orgName} placeholder="e.g Pepsi Co" autofocus />
        {#if orgApi.errors.name || orgApi.errors.orgName}
          <Field.Error>{orgApi.errors.name || orgApi.errors.orgName}</Field.Error>
        {/if}
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('add_org.org_sitename')}</Field.Label>
        <DomainInput bind:value={siteName} placeholder="myschool" prefix="https://" suffix=".classroomio.com" />
        {#if orgApi.errors.siteName || orgApi.errors.general}
          <Field.Error>{orgApi.errors.siteName || orgApi.errors.general}</Field.Error>
        {/if}
      </Field.Field>

      <Field.Field orientation="horizontal">
        <Button type="submit" loading={orgApi.isLoading} class="ml-auto">
          {$t('add_org.create')}
        </Button>
      </Field.Field>
    </Field.Group>
  </form>
</Modal>
