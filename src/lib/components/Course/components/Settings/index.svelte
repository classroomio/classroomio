<script lang="ts">
  import { goto } from '$app/navigation';
  import { Grid, Row, Column, Toggle } from 'carbon-components-svelte';

  import SectionTitle from '$lib/components/Org/SectionTitle.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import DragAndDrop from './DragAndDrop.svelte';

  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { settings } from './store';
  import { course } from '$lib/components/Course/store';
  import { updateCourse, deleteCourse } from '$lib/utils/services/courses';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { supabase } from '$lib/utils/functions/supabase';
  import { Loading } from 'carbon-components-svelte';
  import { isObject } from '$lib/utils/functions/isObject';
  import { lessons } from '../Lesson/store/lessons';
  import { currentOrg } from '$lib/utils/store/org';
  import { snackbar } from '$lib/components/Snackbar/store';

  let uploadingImage = false;
  let isSaving = false;
  let fileInput;
  let isLoading = false;
  let isDeleting = false;
  let errors = {};
  let avatar;
  let imagebuffer;

  // FILE UPLOAD
  const uploadImage = async (image: File) => {
    if (image) {
      const filename = `bannerimage/${Date.now()}` + image.name;
      const { data } = await supabase.storage.from('avatars').upload(filename, image, {
        cacheControl: '3600',
        upsert: false
      });

      if (data) {
        const { data: response } = await supabase.storage.from('avatars').getPublicUrl(filename);

        $settings.image = response.publicUrl;

        uploadingImage = false;
      }
    }
  };

  const onFileSelected = () => {
    uploadingImage = true;
    const image = fileInput.files[0];
    if (image) {
      let reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onload = (e) => {
        imagebuffer = image;
        uploadImage(image);
      };
    }
  };

  function getLessonOrder(id) {
    const index = $lessons.findIndex((lesson) => lesson.id === id);
    if (index < 9) {
      return '0' + (index + 1);
    } else {
      return index + 1;
    }
  }

  const downloadCourse = async () => {
    isLoading = true;
    try {
      const lessonsList = $lessons.map((lesson) => ({
        lessonTitle: lesson.title,
        lessonNumber: getLessonOrder(lesson.id),
        lessonNote: lesson.note,
        slideUrl: lesson.slide_url || '',
        video: lesson.videos || ''
      }));
      const response = await fetch('https://classroomio-server.fly.dev/downloadCourse', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseTitle: $course.title,
          orgName: $currentOrg.name,
          orgTheme: $currentOrg.theme || '',
          lessons: lessonsList
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.blob();
      const file = new Blob([data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);

      let a = document.createElement('a');
      document.body.append(a);
      a.download = $course.title + ' - ' + 'Course ';
      a.href = fileURL;
      a.click();
      a.remove();

      snackbar.success('Download Complete');
    } catch (error) {
      snackbar.error("Something's not right - Please try later");
    }
    isLoading = false;
  };

  const deleteBannerImage = () => {
    $course.logo = '';
  };

  async function handleDeleteCourse() {
    isDeleting = true;
    try {
      await deleteCourse($course.id);
      isDeleting = false;
      goto($currentOrgPath + '/courses');
    } catch (error) {
      snackbar.error('Something went wrong - Please try later');
      isDeleting = false;
    }
  }

  const handleSave = async () => {
    if (!$settings.course_title) {
      errors.title = 'title cannot be empty';
      return;
    }
    if (!$settings.course_description) {
      errors.description = 'description cannot be empty';
      return;
    }
    isSaving = true;
    try {
      const {
        course_title,
        course_description,
        image,
        tabs,
        grading,
        lesson_download,
        is_published
      } = $settings;
      await updateCourse($course.id, avatar, {
        title: course_title,
        description: course_description,
        logo: image,
        is_published,
        metadata: {
          ...(isObject($course.metadata) ? $course.metadata : {}),
          lessonTabsOrder: tabs,
          grading: grading,
          lessonDownload: lesson_download
        }
      });

      $course.title = course_title;
      $course.description = course_description;
      $course.logo = image;
      $course.is_published = is_published;
      $course.metadata = {
        ...(isObject($course.metadata) ? $course.metadata : {}),
        lessonTabsOrder: tabs,
        grading: grading,
        lessonDownload: lesson_download
      };
      snackbar.success('Saved successfully');
    } catch (error) {
      snackbar.error();
    }

    isSaving = false;
  };

  function setDefault(course) {
    console.log('course.is_published', course.is_published);
    if (course && Object.keys(course).length) {
      $settings = {
        course_title: course.title,
        course_description: course.description,
        image: course.logo,
        tabs: course.metadata.lessonTabsOrder || $settings.tabs,
        grading: course.metadata.grading,
        lesson_download: course.metadata.lessonDownload,
        is_published: course.is_published
      };
    }
  }

  $: $settings.course_description = $course.description;
  $: $settings.course_title = $course.title;
  $: setDefault($course);
</script>

<Grid class="border-c rounded border-gray-200">
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>Banner Image</SectionTitle>
      <p>
        This optional image will show up on your welcome page. If you include one, it should be at
        least 280 x 200"
      </p>
      <span class="flex items-center justify-start">
        <PrimaryButton
          variant={VARIANTS.LINK}
          label="Replace Banner image"
          className="-ml-6"
          onClick={() => fileInput.click()}
        />
        <PrimaryButton
          variant={VARIANTS.CONTAINED_DANGER}
          label="Delete"
          onClick={deleteBannerImage}
        />
      </span>
    </Column>

    <Column sm={8} md={8} lg={6}>
      <div class="w-fit relative">
        <input
          type="file"
          accept=".jpg, .jpeg, .png"
          style="display: none;"
          bind:this={fileInput}
          on:change={onFileSelected}
        />
        <img
          style="min-width:280px; min-height:200px"
          alt="About us"
          src={$settings.image ? $settings.image : '/images/classroomio-course-img-template.jpg'}
          class="mt-2 md:mt-0 rounded-md w-full relative"
        />
        {#if uploadingImage}
          <Loading withOverlay={true} small class="absolute top-0 w-[280px]" />
        {/if}
      </div>
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>Update course details</SectionTitle>
    </Column>

    <Column sm={8} md={8} lg={8}>
      <TextField
        label="Course title"
        placeholder="Write the course title here"
        className="w-full mb-5"
        bind:value={$settings.course_title}
        errorMessage={errors.title}
      />
      <TextArea
        label="Course description"
        placeholder="Write your course description here"
        className="w-full mb-5"
        bind:value={$settings.course_description}
        errorMessage={errors.description}
      />
    </Column>
  </Row>
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>Grading</SectionTitle>
      <p>Make grading reports available for lessons</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <Toggle size="sm" bind:toggled={$settings.grading}>
        <span slot="labelA" style="color: gray">Disable</span>
        <span slot="labelB" style="color: gray">Enable</span>
      </Toggle>
    </Column>
  </Row>
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>Order Lessons Tab</SectionTitle>
      <p>Drag and drop the labels to re-order your material tabs</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <DragAndDrop />
    </Column>
  </Row>
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>Lesson Download</SectionTitle>
      <p>Make the Lesson available for Download in pdf for registered students</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <Toggle size="sm" bind:toggled={$settings.lesson_download}>
        <span slot="labelA" style="color: gray">Disable</span>
        <span slot="labelB" style="color: gray">Enable</span>
      </Toggle>
    </Column>
  </Row>
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>Course Download</SectionTitle>
      <p>Make the Course available for Download for registered students</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <PrimaryButton
        variant={VARIANTS.LINK}
        label="Download Course"
        onClick={downloadCourse}
        isDisabled={isLoading}
        {isLoading}
      />
    </Column>
  </Row>

  <!-- Publish Course -->
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>Publish Course</SectionTitle>
      <p>This determines if your course displays on your landing page</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <Toggle size="sm" bind:toggled={$settings.is_published}>
        <span slot="labelA" style="color: gray">Unpublished</span>
        <span slot="labelB" style="color: gray">Published</span>
      </Toggle>
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>Delete course</SectionTitle>
      <p>Delete this course,this action cannot be undone</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <PrimaryButton
        variant={VARIANTS.CONTAINED_DANGER}
        label="Delete Course"
        onClick={handleDeleteCourse}
        isLoading={isDeleting}
        isDisabled={isDeleting}
      />
    </Column>
  </Row>
  <Row class="p-5 w-full flex items-center justify-end">
    <PrimaryButton
      label="Save Changes"
      isLoading={isSaving}
      isDisabled={isSaving}
      onClick={handleSave}
    />
  </Row>
</Grid>
