<script>
  import TextArea from '$lib/Input/TextArea.svelte';
  import TextField from '$lib/Input/TextField.svelte';
  import UploadWidget from '$lib/UploadWidget/UploadWidget.svelte';
</script>

<div class="w-full my-10 space-y-5">
  <div class="flex flex-row gap-10">
    <TextField label="Your Name" isRequired className="w-full" />
    <TextField label="Your Email" isRequired className="w-full" />
  </div>
  <TextField label="The bug in short" isRequired />
  <TextArea label="Describe the bug in detail" isRequired />
  <TextField label="Add a Link to the page your widget is embedded on" isRequired />
  <UploadWidget label="Add a screenshot of the bug or incident" />
  <TextField
    label="Add a link to a screen recording (will help us investigate faster)"
    isRequired
  />
  <div class="w-full flex items-center justify-center pt-5">
    <button class="bg-[#0233BD] text-white font-medium text-sm px-32 py-4"> Submit </button>
  </div>
</div>
