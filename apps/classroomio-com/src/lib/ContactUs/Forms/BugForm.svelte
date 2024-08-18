<script>
  import Button from '$lib/Button/Button.svelte';
  import TextArea from '$lib/Input/TextArea.svelte';
  import TextField from '$lib/Input/TextField.svelte';
  import UploadWidget from '$lib/UploadWidget/UploadWidget.svelte';
  import { submitForm } from '$lib/utils/submitForm';

  let data = {
    name: '',
    email: '',
    embeddedLink: '',
    imageURL: '',
    recordingLink: ''
  };
  let title = '';
  let description = '';
  let isLoading = false;

  const fullDescription = `${data.name} is reporting a bug with the following details
      Screenshot:${data.imageURL}
      recording: ${data.recordingLink}
      embeddedLink: ${data.embeddedLink}
      email: ${data.email}.

      ${description}
      `;

  const handleClick = async () => {
    isLoading = true;

    const formData = {
      assignees: ['tunji', 'emmanuel'],
      labels: ['bug'],
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
</script>

<div class="w-full my-10 space-y-5">
  <div class="flex flex-col md:flex-row gap-10">
    <TextField label="Your Name" isRequired className="w-full" value={data.name} />
    <TextField label="Your Email" isRequired className="w-full" value={data.email} />
  </div>
  <TextField label="The bug in short" isRequired value={title} />
  <TextArea label="Describe the bug in detail" isRequired value={description} />
  <TextField
    label="Add a Link to the page your widget is embedded on"
    isRequired
    value={data.embeddedLink}
  />
  <UploadWidget label="Add a screenshot of the bug or incident" bind:imageURL={data.imageURL} />
  <TextField
    label="Add a link to a screen recording (will help us investigate faster)"
    isRequired
    value={data.recordingLink}
  />
  <Button
    label="submit"
    className="px-32"
    onClick={handleClick}
    isDisabled={isLoading}
    {isLoading}
  />
</div>
