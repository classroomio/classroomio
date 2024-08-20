<script>
  import { FORM_TYPE } from '$lib/types';
  import BugForm from './BugForm.svelte';
  import FeatureRequestForm from './FeatureRequestForm.svelte';
  import FeedbackForm from './FeedbackForm.svelte';
  import HelpForm from './HelpForm.svelte';

  export let currentForm;
</script>

<div class="mx-auto w-[90%] lg:w-[60%] px-5">
  {#if currentForm === FORM_TYPE.BUG}
    <BugForm />
  {:else if currentForm === FORM_TYPE.HELP}
    <HelpForm />
  {:else if currentForm === FORM_TYPE.FEATURE}
    <FeatureRequestForm />
  {:else if currentForm === FORM_TYPE.FEEDBACK}
    <FeedbackForm />
  {/if}
</div>
