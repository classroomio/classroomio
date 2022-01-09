<script>
  import TextField from '../../../Form/TextField.svelte';
  import EditContent from '../../../EditContent/index.svelte';
  import { landingPageStore } from '../../store';
</script>

<TextField
  label="Company name"
  bind:value={$landingPageStore.aboutUs.companyName}
  className="mt-3 font-bold"
/>
<TextField
  label="Company Logo URL"
  bind:value={$landingPageStore.aboutUs.logoUrl}
  className="mt-3 font-bold"
/>

<p class="mt-3 font-bold">Description</p>
<EditContent bind:value={$landingPageStore.aboutUs.description} />
