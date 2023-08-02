<script>
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';

  export let course = {};
</script>

<TextField
  className="mt-5"
  labelClassName="font-bold"
  label="Title"
  bind:value={course.title}
/>

<TextArea
  label="Description"
  bind:value={course.description}
  rows="6"
  className="mt-5"
  labelClassName="font-bold"
/>

<TextField
  className="mt-5"
  labelClassName="font-bold"
  label="Short Video"
  placeholder="www.youtube.com/watch?v=uYRq60G5XTk"
  helperMessage="Enter a link to a youtube video"
  type="text"
  bind:value={course.metadata.videoUrl}
/>
