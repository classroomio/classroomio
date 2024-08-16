<script>
  import TextArea from '$lib/Input/TextArea.svelte';
  import TextField from '$lib/Input/TextField.svelte';
</script>

<div class="w-full my-10 space-y-5">
  <div class="flex flex-row gap-10">
    <TextField label="Your Name" isRequired className="w-full" />
    <TextField label="Your Email" isRequired className="w-full" />
  </div>
  <TextField label="Subject" isRequired />
  <TextArea label="Message" isRequired />

  <div class="w-full flex items-center justify-center pt-5">
    <button class="bg-[#0233BD] text-white font-medium text-sm px-32 py-4"> Submit </button>
  </div>
</div>
