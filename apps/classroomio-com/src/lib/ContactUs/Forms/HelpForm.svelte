<script>
  import Button from '$lib/Button/Button.svelte';
  import TextArea from '$lib/Input/TextArea.svelte';
  import TextField from '$lib/Input/TextField.svelte';
  import { isFormValid } from '$lib/utils/isFormValid';
  import Sucess from './Sucess.svelte';

  let name = '';
  let email = '';
  let title = '';
  let description = '';

  let isLoading = false;
  let errorMessage = '';
  let sent = false;

  function handleClick() {
    const data = { name, email, title, description };

    if (!isFormValid(data)) {
      errorMessage = 'Please fill out all required fields.';
      return;
    }
    isLoading = true;
    try {
      const subject = `[help] ${title}`;
      const body = description;

      // Create the mailto URL with encoded components
      const mailToUrl = `mailto:help@classroomio.com?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      // Redirect to the mailto URL
      window.location.href = mailToUrl;
    } catch (error) {
      console.log(error);
    } finally {
      isLoading = false;
    }
  }
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
      <TextField label="Subject" isRequired bind:value={title} />
      <TextArea label="Message" isRequired bind:value={description} />
      {#if !!errorMessage}
        <p class="text-left text-sm text-red-500">{errorMessage}</p>
      {/if}
      <Button
        label="Submit"
        className="px-32"
        onClick={handleClick}
        isDisabled={isLoading}
        {isLoading}
      />
    </div>
  {/if}
</div>
