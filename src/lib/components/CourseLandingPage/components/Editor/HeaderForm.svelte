<script lang="ts">
  import { settings } from '$lib/components/Course/components/Settings/store';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { updateCourse } from '$lib/utils/services/courses';
  import { landingPage } from '../../store';

  export let course = {};
  let fileInput;
  let imageBuffer;
  let avatar;

  const uploadImage = async (image: File) => {
    if (image) {
      const filename = `landingpage/${Date.now()}` + image.name;
      const { data } = await supabase.storage.from('avatars').upload(filename, image, {
        cacheControl: '3600',
        upsert: false
      });

      if (data) {
        const { data: response } = await supabase.storage.from('avatars').getPublicUrl(filename);

        $landingPage.imageUrl = response.publicUrl;
        $settings.image = $landingPage.imageUrl;

        await updateCourse(course.id, avatar, {
          logo: $settings.image
        });

        course.logo = $settings.image;

        $landingPage.uploadingImage = false;
      }
    }
  };

  const onFileSelected = () => {
    $landingPage.uploadingImage = true;
    const image = fileInput.files[0];
    if (image) {
      let reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onload = (e) => {
        imageBuffer = image;
        uploadImage(image);
      };
    }
  };
</script>

<TextField className="mt-5" labelClassName="font-bold" label="Title" bind:value={course.title} />

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
<div>
  <PrimaryButton
    variant={VARIANTS.LINK}
    label="Replace Banner image"
    className="-ml-6"
    onClick={() => fileInput.click()}
  />
  <input
    type="file"
    accept=".jpg, .jpeg, .png"
    style="display: none;"
    bind:this={fileInput}
    on:change={onFileSelected}
  />
</div>
