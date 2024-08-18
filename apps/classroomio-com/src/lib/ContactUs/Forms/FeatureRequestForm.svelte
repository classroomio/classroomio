<script>
  import Button from '$lib/Button/Button.svelte';
  import TextArea from '$lib/Input/TextArea.svelte';
  import TextField from '$lib/Input/TextField.svelte';
  import { submitForm } from '$lib/utils/submitForm';

  let isPortalOpen = false;

  let data = {
    name: '',
    email: ''
  };
  let title = '';
  let description = '';
  let isLoading = false;

  const fullDescription = `My name is ${data.name} and i would like to request a feature with the following details

      ${description}

      email: ${data.email}.
      `;

  const handleClick = async () => {
    isLoading = true;

    const formData = {
      assignees: ['tunji', 'emmanuel'],
      labels: ['feature', 'triage'],
      title,
      description: fullDescription
    };

    try {
      await submitForm(formData);
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

<div
  class="relative overflow-hidden mt-10 flex space-y-3 flex-col text-center items-center border border-[#D9E0F5] justify-center w-full rounded-md min-h-[300px] p-4 bg-[#F5F8FE]"
>
  <h1 class="font-bold text-3xl">Request a feature</h1>
  <div class="absolute w-20 h-20 bg-[#0233BD] -top-14 -left-9 rotate-[50deg]" />
  {#if isPortalOpen}
    <p class="w-[70%] font-normal text-sm mb-2">Fill out the fields to request for your feature</p>
    <div class="w-full my-10 space-y-5">
      <div class="flex flex-col md:flex-row gap-10">
        <TextField label="Your Name" isRequired className="w-full" value={data.name} />
        <TextField label="Your Email" isRequired className="w-full" value={data.email} />
      </div>
      <TextField label="Feature Name" isRequired value={title} />
      <TextArea label="Short description" isRequired value={description} />

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
      Would you like to request a new feature? We’d love to hear your suggestions. Click the button
      below to access our feedback portal.
    </p>
    <Button label="Visit feedback portal" className="px-10 md:px-20" onClick={togglePortal} />
  {/if}
</div>
