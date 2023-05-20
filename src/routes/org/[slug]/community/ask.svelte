<script>
  import { goto } from '@sapper/app';
  import ArrowLeft24 from 'carbon-icons-svelte/lib/ArrowLeft24';
  import TextEditor from '../../../../components/TextEditor/index.svelte';
  import { currentOrgPath, currentOrg } from '../../../../utils/store/org';
  import PrimaryButton from '../../../../components/PrimaryButton/index.svelte';
  import { askCommunityValidation } from '../../../../utils/functions/validator';
  import { supabase } from '../../../../utils/functions/supabase';
  import { SNACKBAR_SEVERITY } from '../../../../components/Snackbar/constants';
  import { snackbarStore } from '../../../../components/Snackbar/store';
  import generateSlug from '../../../../utils/functions/generateSlug';

  let errors = {};
  let fields = {
    title: '',
    body: '',
  };

  async function handleSave() {
    errors = askCommunityValidation(fields);
    console.log('handleSave errors', errors);

    if (Object.keys(errors).length) {
      return;
    }

    const { data: question, error } = await supabase
      .from('community_question')
      .insert({
        ...fields,
        organization_id: $currentOrg.id,
        author_id: $currentOrg.memberId,
        votes: 0,
        slug: generateSlug(fields.title),
      });

    if (error) {
      console.error('Error: asking question', error);
      $snackbarStore.open = true;
      $snackbarStore.message = 'Error - Please try again later';
      $snackbarStore.severity = SNACKBAR_SEVERITY.ERROR;
    } else {
      console.log('Success: asking question', question);
      $snackbarStore.open = true;
      $snackbarStore.message = 'Success';
      $snackbarStore.severity = SNACKBAR_SEVERITY.SUCCESS;

      goto(`${$currentOrgPath}/community/${question[0].slug}`);
    }
  }
</script>

<svelte:head>
  <title>Ask the Community - ClassroomIO</title>
</svelte:head>

<section class="w-full max-w-3xl mx-auto">
  <div class="p-5">
    <a
      class="text-gray-500 dark:text-gray-200 text-md flex items-center"
      href={`${$currentOrgPath}/community`}
    >
      <ArrowLeft24 class="carbon-icon" /> Go Back
    </a>
    <div class="flex items-center justify-between">
      <h1 class="dark:text-white text-3xl font-bold">Ask the community</h1>
      <PrimaryButton label="Publish" onClick={handleSave} />
    </div>
  </div>

  <div class="mb-3 p-2">
    <input
      class="title rounded-lg border border-1 border-gray p-2 w-full focus:outline-none"
      error="false"
      autocomplete="off"
      placeholder="Title"
      aria-label="Title"
      aria-describedby="title-input-validation"
      type="text"
      name="discussion_title"
      id="discussion_title"
      bind:value={fields.title}
    />
    {#if errors.title}
      <p class="dark:text-white text-red-500 text-sm">
        {errors.title}
      </p>
    {/if}
  </div>

  <TextEditor
    onChange={(v) => (fields.body = v)}
    placeholder="Ask the community any question you might have"
    errorMessage={errors.body}
  />
</section>
