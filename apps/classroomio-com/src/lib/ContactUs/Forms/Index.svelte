<script>
  import { FORM_TYPE } from '$lib/types';
  import BugForm from './BugForm.svelte';
  import FeatureRequestForm from './FeatureRequestForm.svelte';
  import FeedbackForm from './FeedbackForm.svelte';
  import HelpForm from './HelpForm.svelte';

  export let currentForm;
</script>

<div class="mx-auto w-[60%] px-5">
  {#if currentForm === FORM_TYPE.bug}
    <BugForm />
  {:else if currentForm === FORM_TYPE.help}
    <HelpForm />
  {:else if currentForm === FORM_TYPE.feature}
    <FeatureRequestForm />
  {:else if currentForm === FORM_TYPE.feedback}
    <FeedbackForm />
  {/if}
</div>
