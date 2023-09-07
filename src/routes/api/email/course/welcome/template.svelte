<script lang="ts">
  import EmailTemplate from '$lib/components/Email/EmailTemplate.svelte';
  import Welcome from './welcome.svelte';

  export let name = '';
  export let orgName = '';
  export let inviteLink = '';
  export let courseName = '';
</script>

<EmailTemplate
  children={Welcome}
  props={{
    name,
    orgName,
    inviteLink,
    courseName
  }}
/>
