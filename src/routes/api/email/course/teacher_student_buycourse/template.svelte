<script lang="ts">
  import EmailTemplate from '$lib/components/Email/EmailTemplate.svelte';
  import JoinRequest from './join_request.svelte';

  export let courseName = '';
  export let studentFullname = '';
  export let studentEmail = '';
</script>

<EmailTemplate
  children={JoinRequest}
  props={{
    courseName,
    studentFullname,
    studentEmail
  }}
/>
