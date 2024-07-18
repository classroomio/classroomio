<script lang="ts">
  import { page } from '$app/stores';
  import { Restart } from 'carbon-icons-svelte';
  import {
    Column,
    Grid,
    Row,
    CodeSnippet,
    RadioButtonGroup,
    RadioButton
  } from 'carbon-components-svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';

  import PageNav from '$lib/components/PageNav/index.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { currentOrgDomain, currentOrg } from '$lib/utils/store/org';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';
  import CustomToggle from '$lib/components/Pathways/Toggle.svelte';

  import { collection } from '../store.js';

  // future function to handle the saving of collections
  import { updateCollection } from '$lib/utils/services/courses';

  let id: string;
  let isSaving = false;
  let slug: boolean = true;
  let errors: {
    title: string | undefined;
    description: string | undefined;
  } = { title: undefined, description: undefined };

  function widgetControl() {
    $handleOpenWidget.open = !$handleOpenWidget.open;
  }

  const deleteBannerImage = () => {
    $collection.avatar = '';
  };

  const generateNewCourseLink = () => {
    console.log('generate course link');
  };

  const handleSave = async () => {
    if (!$collection.title) {
      errors.title = 'Please add a collection title';
      return;
    }
    if (!$collection.description) {
      errors.description = 'Please add a collection description';
      return;
    }
    isSaving = true;
    // try catch block to save to supabase
    // try {
    // const {
    //   slug,
    //   title,
    //   avatar,
    //   description,
    //   prerequisite,
    //   is_published,
    //   lms_certificate,
    //   courses_certificate,
    //   courses
    // } = $collection;
    // await updateCollection(...)

    // replace the response
    // } catch (error) {}
    console.log('saved!');

    isSaving = false;
  };

  $: {
    id = $page.params.id;
  }
</script>

<section class="w-full h-full">
  <PageNav title="Settings" />

  <div
    class="border border-[#EAEAEA] max-w-[87%] max-h-[73vh] overflow-y-auto shadow-sm rounded-md w-full mx-auto my-10"
  >
    <Grid>
      <Row class="flex lg:flex-row flex-col my-4 md:py-7 border-bottom-c">
        <Column sm={8} md={8} lg={8} class="flex flex-col justify-between">
          <div>
            <h1 class="text-lg font-semibold">Cover Image</h1>
            <p class="mt-3 text-sm font-medium md:max-w-[67%]">
              This optional image will show up on your welcome page. If you include one, it should
              be at least 280 x 200
            </p>
          </div>
          <span class="flex items-center justify-start mt-10 md:mt-0">
            <PrimaryButton
              variant={VARIANTS.OUTLINED}
              label="Replace"
              className="mr-2"
              onClick={widgetControl}
            />
            <PrimaryButton
              variant={VARIANTS.CONTAINED_DANGER}
              label="Delete"
              onClick={deleteBannerImage}
            />
          </span>
          {#if $handleOpenWidget.open}
            <UploadWidget bind:imageURL={$collection.avatar} />
          {/if}
        </Column>

        <Column sm={8} md={8} lg={7} class="">
          <div class="max-w-full overflow-hidden my-5 md:my-0">
            <img
              alt="About us"
              src={$collection.avatar
                ? $collection.avatar
                : '/images/classroomio-course-img-template.jpg'}
              class="w-full h-full object-cover hover:scale-110 transition-all duration-300"
            />
          </div>
        </Column>
      </Row>

      <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
        <Column sm={8} md={8} lg={8}>
          <h1 class="text-lg font-semibold">Collection Details</h1>
        </Column>

        <Column sm={8} md={8} lg={7}>
          <TextField
            label="Collection Title"
            placeholder="Write the course title here"
            className="w-full mb-5"
            labelClassName="font-medium mb-3"
            bind:value={$collection.title}
            errorMessage={errors.title}
          />
          <TextArea
            label="Collection Description"
            placeholder="Write the course description here"
            className="w-full mb-5"
            labelClassName="font-medium mb-3 text-sm"
            bind:value={$collection.description}
            rows={5}
            errorMessage={errors.description}
          />
          <div class="">
            <p class="text-sm font-medium flex items-center gap-2 mb-2">
              Collection Link
              <IconButton contained={true} size="small" onClick={generateNewCourseLink}>
                <Restart size={16} />
              </IconButton>
            </p>
            {#if slug}
              <CodeSnippet
                wrapText
                type="multi"
                code={`${$currentOrgDomain}/${$currentOrg.siteName}/pathways/${id}`}
              />
            {:else}
              <CodeSnippet code="Setup landing page to get course link" />
            {/if}
          </div>
        </Column>
      </Row>

      <Row class="flex lg:flex-row flex-col py-7 gap-5 border-bottom-c">
        <Column sm={8} md={8} lg={8}>
          <h1 class="text-lg font-semibold leading-5">
            Students must take course according to recommended order?
          </h1>
          <p class="mt-3 text-sm max-w-[80%]">
            if yes, student must take cours according to order, if No, student can start from any
            course of their choice
          </p>
        </Column>
        <Column sm={8} md={8} lg={7} class="flex justify-center items-center">
          <RadioButtonGroup hideLegend bind:selected={$collection.prerequisite}>
            <RadioButton labelText="Yes" value="true" />
            <RadioButton labelText="No" value="false" />
          </RadioButtonGroup>
        </Column>
      </Row>

      <Row class="flex lg:flex-row flex-col gap-5 py-7 border-bottom-c overflow-hidden">
        <Column sm={8} md={8} lg={8}>
          <h1 class="text-lg font-semibold leading-5">Publish learning Path</h1>
          <p>Allow new student download courses in learning Path</p>
        </Column>
        <Column sm={8} md={8} lg={7} class="flex justify-start items-center">
          <div class="flex items-center gap-3">
            <CustomToggle on:toggle={(e) => (e.detail.isOn = $collection.is_published)} />
            <p class="text-sm">{$collection.is_published ? 'Enabled' : 'Disabled'}</p>
          </div>
        </Column>
      </Row>

      <Row class="flex flex-col w-[99%] mx-auto py-7 border-bottom-c">
        <h1 class="text-lg font-semibold leading-5 m-0">Certificate</h1>

        <Row class="overflow-hidden justify-between w-full items-center gap-5 flex-col mt-5">
          <Column class="flex flex-col md:flex-row gap-7 items-start  md:items-center py-2">
            <p class="md:w-[54%]">Issue certificate on LMS</p>
            <div class="flex items-center gap-3">
              <CustomToggle on:toggle={(e) => (e.detail.isOn = $collection.lms_certificate)} />
              <p class="text-sm">{$collection.lms_certificate ? 'Enabled' : 'Disabled'}</p>
            </div>
          </Column>
          <Column class="flex w-full flex-col md:flex-row items-start  md:items-center gap-5">
            <p class="md:w-[54%]">Issue certificate or all course in learning path</p>
            <div>
              <RadioButtonGroup hideLegend bind:selected={$collection.courses_certificate}>
                <RadioButton labelText="Yes" value="true" />
                <RadioButton labelText="No, for path only" value="false" />
              </RadioButtonGroup>
            </div>
          </Column>
        </Row>
      </Row>

      <Row class="flex lg:flex-row flex-col pt-7 pb-10 border-bottom-c overflow-hidden">
        <Column sm={8} md={8} lg={8}>
          <h1 class="text-lg font-semibold leading-5">Delete learning Path</h1>
          <p>Delete Learning Path as a whole</p>
        </Column>
        <Column sm={8} md={8} lg={8} class="mt-5">
          <button
            type="button"
            class="flex items-center md:ml-7 gap-2 hover:scale-125 transition-all duration-300"
            disabled={isSaving}
          >
            <TrashCan class="text-red-600" size={20} />
            <p class="text-sm text-red-600 font-medium">Delete</p>
          </button>
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
  </div>
</section>
