<script lang="ts">
  import EmailTemplate from '$lib/components/Email/EmailTemplate.svelte';
  import Welcome from './welcome.svelte';

  export let orgName = '';
  export let courseName = '';
</script>

<EmailTemplate
  children={Welcome}
  props={{
    orgName,
    courseName
  }}
/>
