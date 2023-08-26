<script lang="ts">
  import EmailTemplate from '$lib/components/Email/EmailTemplate.svelte';
  import Welcome from './welcome.svelte';

  export let name = '';
</script>

<EmailTemplate
  children={Welcome}
  props={{
    name
  }}
/>
