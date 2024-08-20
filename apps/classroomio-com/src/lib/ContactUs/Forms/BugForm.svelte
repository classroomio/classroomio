<script>
  import Button from '$lib/Button/Button.svelte';
  import TextArea from '$lib/Input/TextArea.svelte';
  import TextField from '$lib/Input/TextField.svelte';
  import UploadWidget from '$lib/UploadWidget/UploadWidget.svelte';
  import { isFormValid } from '$lib/utils/isFormValid';
  import { submitForm } from '$lib/utils/submitForm';
  import Sucess from './Sucess.svelte';

  let name = '';
  let email = '';
  let embeddedLink = '';
  let imageURL = '';
  let recordingLink = '';
  let title = '';
  let description = '';

  let isLoading = false;
  let errorMessage = '';
  let sent = false;

  const handleClick = async () => {
    const data = { name, email, title, description, imageURL, embeddedLink, recordingLink };

    if (!isFormValid(data)) {
      errorMessage = 'Please fill out all required fields.';
      return;
    }
    isLoading = true;
    const fullDescription = `${JSON.stringify(name)} is reporting a bug with the following details

      recording: ${JSON.stringify(recordingLink)}
      embeddedLink: ${JSON.stringify(embeddedLink)}
      email: ${JSON.stringify(email)}.

      ${JSON.stringify(description)}
      `;

    const mainTitle = `bug: ${title}`;
    const formData = {
      assignees: ['rotimi-best'],
      labels: ['bug'],
      title: mainTitle,
      description: fullDescription
    };
    try {
      await submitForm(formData);
      sent = true;
    } catch (error) {
      console.log(error);
    } finally {
      isLoading = false;
    }
  };
</script>

<div>
  {#if sent}
    <Sucess />
  {:else}
    <div class="w-full my-10 space-y-5">
      <div class="flex flex-col md:flex-row gap-10">
        <TextField label="Your Name" isRequired className="w-full" bind:value={name} />
        <TextField label="Your Email" isRequired className="w-full" bind:value={email} />
      </div>
      <TextField label="The bug in short" isRequired bind:value={title} />
      <TextArea label="Describe the bug in detail" isRequired bind:value={description} />
      <TextField
        label="Add a Link to the page your widget is embedded on"
        isRequired
        bind:value={embeddedLink}
      />
      <UploadWidget label="Add a screenshot of the bug or incident" bind:imageURL />
      <TextField
        label="Add a link to a screen recording (will help us investigate faster)"
        isRequired
        bind:value={recordingLink}
      />
      {#if !!errorMessage}
        <p class="text-left text-sm text-red-500">{errorMessage}</p>
      {/if}
      <Button
        label="submit"
        className="px-32"
        onClick={handleClick}
        isDisabled={isLoading}
        {isLoading}
      />
    </div>
  {/if}
</div>
