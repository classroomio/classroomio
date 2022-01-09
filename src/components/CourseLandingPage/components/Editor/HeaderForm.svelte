<script>
  import TextArea from '../../../Form/TextArea.svelte';
  import TextField from '../../../Form/TextField.svelte';
  import { landingPageStore } from '../../store';
</script>

<TextArea
  label="Title"
  bind:value={$landingPageStore.header.title}
  rows="3"
  className="mt-3 font-bold"
  bgColor="bg-white"
/>
<TextArea
  label="Description"
  bind:value={$landingPageStore.header.description}
  rows="6"
  className="mt-3 font-bold"
  bgColor="bg-white"
/>

<TextField
  className="mt-3 font-bold"
  label="Currency"
  bind:value={$landingPageStore.header.currency}
/>

<TextField
  className="mt-3 font-bold"
  label="Cost"
  bind:value={$landingPageStore.header.cost}
/>

<TextField
  label="Button Label"
  className="mt-3 font-bold"
  bind:value={$landingPageStore.header.buttonLabel}
/>
