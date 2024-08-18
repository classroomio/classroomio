<script>
  import Button from '$lib/Button/Button.svelte';
  import TextArea from '$lib/Input/TextArea.svelte';
  import TextField from '$lib/Input/TextField.svelte';
</script>

<div class="w-full my-10 space-y-5">
  <div class="flex flex-col md:flex-row gap-10">
    <TextField label="Your Name" isRequired className="w-full" />
    <TextField label="Your Email" isRequired className="w-full" />
  </div>
  <TextField label="Subject" isRequired />
  <TextArea label="Message" isRequired />

  <Button label="submit" className="px-32" />
</div>
