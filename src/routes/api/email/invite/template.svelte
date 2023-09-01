<script lang="ts">
  import EmailTemplate from '$lib/components/Email/EmailTemplate.svelte';
  import Invitation from './invitation.svelte';

  export let orgName = '';
  export let inviteLink = '';
</script>

<EmailTemplate
  children={Invitation}
  props={{
    orgName,
    inviteLink
  }}
/>
