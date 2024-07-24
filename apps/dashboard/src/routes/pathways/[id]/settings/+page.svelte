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

  import { t } from '$lib/utils/functions/translations';
  import { pathway } from '$lib/components/Pathways/store';
  // future function to handle the saving of collections
  // import { updateCollection } from '$lib/utils/services/pathways';
  import { currentOrgDomain, currentOrg } from '$lib/utils/store/org';

  import PageNav from '$lib/components/PageNav/index.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';
  import CustomToggle from '$lib/components/Pathways/components/Toggle.svelte';
  import PathwayContainer from '$lib/components/Pathways/components/PathwayContainer.svelte';

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
    $pathway.avatar = '';
  };

  const generateNewCourseLink = () => {
    // console.log('generate course link');
  };

  const handleSave = async () => {
    if (!$pathway.title) {
      errors.title = $t('pathways.pages.settings.title_error');
      return;
    }
    if (!$pathway.description) {
      errors.description = $t('pathways.pages.settings.title_description');
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
    // console.log('saved!');

    isSaving = false;
  };

  $: id = $page.params.id;
</script>

<PathwayContainer>
  <PageNav title={$t('pathways.pages.settings.page_title')} />

  <div class="border border-[#EAEAEA] max-w-[87%] shadow-sm rounded-md w-full mx-auto my-10">
    <Grid>
      <Row class="flex lg:flex-row flex-col my-4 md:py-7 border-bottom-c">
        <Column sm={8} md={8} lg={8} class="flex flex-col justify-between">
          <div>
            <h1 class="text-lg font-semibold">{$t('pathways.pages.settings.cover_image')}</h1>
            <p class="mt-3 text-sm font-medium md:max-w-[67%]">
              {$t('pathways.pages.settings.optional')}
            </p>
          </div>
          <span class="flex items-center justify-start mt-10 md:mt-0">
            <PrimaryButton
              variant={VARIANTS.OUTLINED}
              label={$t('pathways.pages.settings.replace')}
              className="mr-2"
              onClick={widgetControl}
            />
            <PrimaryButton
              variant={VARIANTS.CONTAINED_DANGER}
              label={$t('pathways.pages.settings.delete')}
              onClick={deleteBannerImage}
            />
          </span>
          {#if $handleOpenWidget.open}
            <UploadWidget bind:imageURL={$pathway.avatar} />
          {/if}
        </Column>

        <Column sm={8} md={8} lg={7} class="">
          <div class="max-w-full overflow-hidden my-5 md:my-0">
            <img
              alt="About us"
              src={$pathway.avatar
                ? $pathway.avatar
                : '/images/classroomio-course-img-template.jpg'}
              class="w-full h-full object-cover hover:scale-110 transition-all duration-300"
            />
          </div>
        </Column>
      </Row>

      <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
        <Column sm={8} md={8} lg={8}>
          <h1 class="text-lg font-semibold">{$t('pathways.pages.settings.details')}</h1>
        </Column>

        <Column sm={8} md={8} lg={7}>
          <TextField
            label={$t('pathways.pages.settings.title')}
            placeholder={$t('pathways.pages.settings.title_placeholder')}
            className="w-full mb-5"
            labelClassName="font-medium mb-3"
            bind:value={$pathway.title}
            errorMessage={errors.title}
          />
          <TextArea
            label={$t('pathways.pages.settings.description')}
            placeholder={$t('pathways.pages.settings.description_placeholder')}
            className="w-full mb-5"
            labelClassName="font-medium mb-3 text-sm"
            bind:value={$pathway.description}
            rows={5}
            errorMessage={errors.description}
          />
          <div class="">
            <p class="text-sm font-medium flex items-center gap-2 mb-2">
              {$t('pathways.pages.settings.link')}
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
            {$t('pathways.pages.settings.students')}
          </h1>
          <p class="mt-3 text-sm max-w-[80%]">
            {$t('pathways.pages.settings.yes')}
          </p>
        </Column>
        <Column sm={8} md={8} lg={7} class="flex justify-center items-center">
          <RadioButtonGroup hideLegend bind:selected={$pathway.prerequisite}>
            <RadioButton labelText={$t('pathways.pages.settings.option_one')} value="true" />
            <RadioButton labelText={$t('pathways.pages.settings.option_two')} value="false" />
          </RadioButtonGroup>
        </Column>
      </Row>

      <Row class="flex lg:flex-row flex-col gap-5 py-7 border-bottom-c overflow-hidden">
        <Column sm={8} md={8} lg={8}>
          <h1 class="text-lg font-semibold leading-5">{$t('pathways.pages.settings.publish')}</h1>
          <p>{$t('pathways.pages.settings.allow')}</p>
        </Column>
        <Column sm={8} md={8} lg={7} class="flex justify-start items-center">
          <div class="flex items-center gap-3">
            <CustomToggle on:toggle={(e) => (e.detail.isOn = $pathway.is_published)} />
            <p class="text-sm">
              {$pathway.is_published
                ? $t('pathways.pages.settings.enabled')
                : $t('pathways.pages.settings.disabled')}
            </p>
          </div>
        </Column>
      </Row>

      <Row class="flex flex-col w-[99%] mx-auto py-7 border-bottom-c">
        <h1 class="text-lg font-semibold leading-5 m-0">
          {$t('pathways.pages.settings.certificate')}
        </h1>

        <Row class="overflow-hidden justify-between w-full items-center gap-5 flex-col mt-5">
          <Column class="flex flex-col md:flex-row gap-7 items-start  md:items-center py-2">
            <p class="md:w-[54%]">{$t('pathways.pages.settings.issue')}</p>
            <div class="flex items-center gap-3">
              <CustomToggle on:toggle={(e) => (e.detail.isOn = $pathway.lms_certificate)} />
              <p class="text-sm">
                {$pathway.lms_certificate
                  ? $t('pathways.pages.settings.enabled')
                  : $t('pathways.pages.settings.disabled')}
              </p>
            </div>
          </Column>
          <Column class="flex w-full flex-col md:flex-row items-start  md:items-center gap-5">
            <p class="md:w-[54%]">{$t('pathways.pages.settings.issue_two')}</p>
            <div>
              <RadioButtonGroup hideLegend bind:selected={$pathway.courses_certificate}>
                <RadioButton labelText={$t('pathways.pages.settings.option_one')} value="true" />
                <RadioButton labelText={$t('pathways.pages.settings.option_three')} value="false" />
              </RadioButtonGroup>
            </div>
          </Column>
        </Row>
      </Row>

      <Row class="flex lg:flex-row flex-col pt-7 pb-10 border-bottom-c overflow-hidden">
        <Column sm={8} md={8} lg={8}>
          <h1 class="text-lg font-semibold leading-5">
            {$t('pathways.pages.settings.delete_path')}
          </h1>
          <p>{$t('pathways.pages.settings.delete_text')}</p>
        </Column>
        <Column sm={8} md={8} lg={8} class="mt-5">
          <button
            type="button"
            class="flex items-center md:ml-7 gap-2 hover:scale-125 transition-all duration-300"
            disabled={isSaving}
          >
            <TrashCan class="text-red-600" size={20} />
            <p class="text-sm text-red-600 font-medium">{$t('pathways.pages.settings.delete')}</p>
          </button>
        </Column>
      </Row>

      <Row class="p-5 w-full flex items-center justify-end">
        <PrimaryButton
          label={$t('pathways.pages.settings.save')}
          isLoading={isSaving}
          isDisabled={isSaving}
          onClick={handleSave}
        />
      </Row>
    </Grid>
  </div>
</PathwayContainer>
