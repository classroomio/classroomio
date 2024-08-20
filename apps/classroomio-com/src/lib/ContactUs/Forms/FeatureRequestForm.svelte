<script>
  import Button from '$lib/Button/Button.svelte';
  import TextArea from '$lib/Input/TextArea.svelte';
  import TextField from '$lib/Input/TextField.svelte';
  import { isFormValid } from '$lib/utils/isFormValid';
  import { submitForm } from '$lib/utils/submitForm';
  import Sucess from './Sucess.svelte';

  let isPortalOpen = false;

  let name = '';
  let email = '';
  let title = '';
  let description = '';

  let isLoading = false;
  let errorMessage = '';
  let sent = false;

  const handleClick = async () => {
    const data = { name, email, title, description };

    if (!isFormValid(data)) {
      errorMessage = 'Please fill out all required fields.';
      return;
    }

    isLoading = true;
    const fullDescription = `${JSON.stringify(
      name
    )} would like to request for a new feature with the following details

      ${JSON.stringify(description)}

       email: ${JSON.stringify(email)}
      `;

    const mainTitle = `Request: ${title}`;

    const formData = {
      assignees: ['rotimi-best'],
      labels: ['enhancement', 'needs triage'],
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

  const togglePortal = () => {
    isPortalOpen = !isPortalOpen;
  };
</script>

{#if sent}
  <Sucess />
{:else}
  <div
    class="relative overflow-hidden mt-10 flex space-y-3 flex-col text-center items-center border border-[#D9E0F5] justify-center w-full rounded-md min-h-[300px] p-4 bg-[#F5F8FE]"
  >
    <h1 class="font-bold text-3xl">Request a feature</h1>
    <div class="absolute w-20 h-20 bg-[#0233BD] -top-14 -left-9 rotate-[50deg]" />
    {#if isPortalOpen}
      <p class="w-[70%] font-normal text-sm mb-2">
        Fill out the fields to request for your feature
      </p>
      <div class="w-full my-10 space-y-5">
        <div class="flex flex-col md:flex-row gap-10">
          <TextField label="Your Name" isRequired className="w-full" bind:value={name} />
          <TextField label="Your Email" isRequired className="w-full" bind:value={email} />
        </div>
        <TextField label="Feature Name" isRequired bind:value={title} />
        <TextArea label="Short description" isRequired bind:value={description} />
        {#if !!errorMessage}
          <p class="text-left text-sm text-red-500">{errorMessage}</p>
        {/if}
        <Button
          label="submit"
          className="px-10 md:px-32"
          onClick={handleClick}
          isDisabled={isLoading}
          {isLoading}
        />
      </div>
    {:else}
      <p class="w-[70%] font-normal text-sm">
        Would you like to request a new feature? We’d love to hear your suggestions. Click the
        button below to access our feedback portal.
      </p>
      <Button label="Visit feedback portal" className="px-10 md:px-20" onClick={togglePortal} />
    {/if}
  </div>
{/if}
