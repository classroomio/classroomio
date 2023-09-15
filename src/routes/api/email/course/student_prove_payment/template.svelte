<script lang="ts">
  import EmailTemplate from '$lib/components/Email/EmailTemplate.svelte';
  import ProvePayment from './prove_payment.svelte';

  export let courseName = '';
  export let studentFullname = '';
  export let orgName = '';
  export let teacherEmail = '';
</script>

<EmailTemplate
  children={ProvePayment}
  props={{
    courseName,
    studentFullname,
    orgName,
    teacherEmail
  }}
/>
