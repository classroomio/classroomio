<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Restart } from 'carbon-icons-svelte';
  import {
    Column,
    Grid,
    Row,
    Toggle,
    CodeSnippet,
    RadioButtonGroup,
    RadioButton,
    Loading
  } from 'carbon-components-svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { pathway, pathwaySettings, RADIO_VALUE } from '$lib/components/Pathways/store';
  import { deletePathway, updatePathways } from '$lib/utils/services/pathways';
  import { currentOrgDomain, currentOrg, currentOrgPath } from '$lib/utils/store/org';

  import PageNav from '$lib/components/PageNav/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';
  import PathwayContainer from '$lib/components/Pathways/components/PathwayContainer.svelte';
  import SectionTitle from '$lib/components/Org/SectionTitle.svelte';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import type { Pathway } from '$lib/utils/types';
  import { snackbar } from '$lib/components/Snackbar/store';

  let isSaving = false;
  let isDeleting = false;
  let errors: {
    title: string | undefined;
    description: string | undefined;
  } = { title: undefined, description: undefined };
  let avatar: string | undefined;

  function widgetControl() {
    $handleOpenWidget.open = !$handleOpenWidget.open;
  }

  const deleteBannerImage = () => {
    $pathwaySettings.logo = '';
  };

  const generateNewPathwayLink = () => {
    $pathway.slug = generateSlug($pathway.title);
  };

  const handleSave = async () => {
    if (!$pathwaySettings.title) {
      errors.title = $t('pathway.pages.settings.title_error');
      return;
    }
    if (!$pathwaySettings.description) {
      errors.description = $t('pathway.pages.settings.description_error');
      return;
    }
    isSaving = true;
    // try catch block to save to supabase
    try {
      const {
        title,
        logo,
        description,
        prerequisite,
        is_published,
        lms_certificate,
        courses_certificate
      } = $pathwaySettings;

      await updatePathways($pathway.id, avatar, {
        title,
        logo,
        description,
        prerequisite,
        is_published,
        lms_certificate,
        courses_certificate,
        slug: $pathway.slug
      });

      $pathway.title = title;
      $pathway.description = description;
      $pathway.logo = logo;
      $pathway.is_published = is_published;
      $pathway.courses_certificate = courses_certificate;
      $pathway.prerequisite = prerequisite;
      $pathway.lms_certificate = lms_certificate;

      snackbar.success('snackbar.course_settings.success.saved');
    } catch (error) {
      console.log(error);
    } finally {
      isSaving = false;
    }
  };

  const handledeletePathway = async () => {
    isDeleting = true;
    try {
      await deletePathway($pathway.id);
      goto($currentOrgPath + '/pathways');
    } catch (error) {
      snackbar.error('snackbar.course_settings.error.went_wrong');
    } finally {
      isDeleting = false;
    }
  };
  function setDefault(pathway: Pathway) {
    if (pathway && Object.keys(pathway).length && $pathwaySettings.title !== pathway.title) {
      $pathwaySettings = {
        title: pathway.title,
        description: pathway.description,
        logo: pathway.logo || '',
        is_published: !!pathway.is_published,
        prerequisite: pathway.prerequisite,
        metadata: pathway.metadata,
        lms_certificate: pathway.lms_certificate,
        courses_certificate: pathway.courses_certificate
      };
    }
  }

  $: setDefault($pathway);
</script>

<PathwayContainer>
  <PageNav title={$t('pathway.pages.settings.page_title')} />

  <PageBody>
    <Grid class="border-c rounded border-gray-200 dark:border-neutral-600">
      <Row class="flex lg:flex-row flex-col my-4 md:py-7 border-bottom-c">
        <Column sm={8} md={8} lg={8} class="flex flex-col justify-between">
          <div>
            <SectionTitle>{$t('pathway.pages.settings.cover_image')}</SectionTitle>
            <p>
              {$t('pathway.pages.settings.optional')}
            </p>
          </div>
          <span class="flex items-center justify-start mt-10 md:mt-0">
            <PrimaryButton
              variant={VARIANTS.OUTLINED}
              label={$t('pathway.pages.settings.replace')}
              className="mr-2"
              onClick={widgetControl}
            />
            <PrimaryButton
              variant={VARIANTS.CONTAINED_DANGER}
              label={$t('pathway.pages.settings.delete')}
              onClick={deleteBannerImage}
            />
          </span>
          {#if $handleOpenWidget.open}
            <UploadWidget bind:imageURL={$pathwaySettings.logo} />
          {/if}
        </Column>

        <Column sm={8} md={8} lg={7} class="">
          <div class="max-w-full overflow-hidden my-5 md:my-0">
            <img
              alt="About us"
              src={$pathwaySettings.logo || '/images/classroomio-course-img-template.jpg'}
              class="w-full h-full object-cover hover:scale-110 transition-all duration-300"
            />
          </div>
        </Column>
      </Row>

      <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
        <Column sm={8} md={8} lg={8}>
          <SectionTitle>{$t('pathway.pages.settings.details')}</SectionTitle>
        </Column>

        <Column sm={8} md={8} lg={7}>
          <TextField
            label={$t('pathway.pages.settings.title')}
            placeholder={$t('pathway.pages.settings.title_placeholder')}
            className="w-full mb-5"
            labelClassName="font-medium mb-3"
            bind:value={$pathwaySettings.title}
            errorMessage={errors.title}
          />
          <TextArea
            label={$t('pathway.pages.settings.description')}
            placeholder={$t('pathway.pages.settings.description_placeholder')}
            className="w-full mb-5"
            labelClassName="font-medium mb-3 text-sm"
            bind:value={$pathwaySettings.description}
            rows={5}
            errorMessage={errors.description}
          />
          <div class="">
            <p>
              {$t('pathway.pages.settings.link')}
              <IconButton contained={true} size="small" onClick={generateNewPathwayLink}>
                <Restart size={16} />
              </IconButton>
            </p>
            {#if $pathway.slug}
              <CodeSnippet
                wrapText
                type="multi"
                code={`${$currentOrgDomain}/${$currentOrg.siteName}/pathways/${$pathway.slug}`}
              />
            {:else}
              <CodeSnippet code="Setup landing page to get pathway link" />
            {/if}
          </div>
        </Column>
      </Row>

      <Row class="flex lg:flex-row flex-col py-7 gap-5 border-bottom-c">
        <Column sm={8} md={8} lg={8}>
          <SectionTitle>
            {$t('pathway.pages.settings.students')}
          </SectionTitle>
          <p>
            {$t('pathway.pages.settings.yes')}
          </p>
        </Column>
        <Column sm={8} md={8} lg={7} class="flex justify-center items-center">
          <RadioButtonGroup hideLegend bind:selected={$pathwaySettings.prerequisite}>
            <RadioButton
              labelText={$t('pathway.pages.settings.option_one')}
              value={RADIO_VALUE.TRUE}
            />
            <RadioButton
              labelText={$t('pathway.pages.settings.option_two')}
              value={RADIO_VALUE.FALSE}
            />
          </RadioButtonGroup>
        </Column>
      </Row>

      <Row class="flex lg:flex-row flex-col gap-5 py-7 border-bottom-c overflow-hidden">
        <Column sm={8} md={8} lg={8}>
          <SectionTitle>{$t('pathway.pages.settings.publish')}</SectionTitle>
          <p>{$t('pathway.pages.settings.allow')}</p>
        </Column>
        <Column sm={8} md={8} lg={7} class="flex justify-start items-center">
          <Toggle size="sm" bind:toggled={$pathwaySettings.is_published}>
            <span slot="labelA" style="color: gray">{$t('pathway.pages.settings.disabled')}</span>
            <span slot="labelB" style="color: gray">{$t('pathway.pages.settings.enabled')}</span>
          </Toggle>
        </Column>
      </Row>

      <Row class="flex flex-col w-[99%] mx-auto py-7 border-bottom-c">
        <SectionTitle>
          {$t('pathway.pages.settings.certificate')}
        </SectionTitle>

        <Row class="overflow-hidden justify-between w-full items-center gap-5 flex-col mt-5">
          <Column class="flex flex-col md:flex-row gap-7 items-start  md:items-center py-2">
            <p>{$t('pathway.pages.settings.issue')}</p>
            <Toggle size="sm" bind:toggled={$pathwaySettings.lms_certificate}>
              <span slot="labelA" style="color: gray">{$t('pathway.pages.settings.disabled')}</span>
              <span slot="labelB" style="color: gray">{$t('pathway.pages.settings.enabled')}</span>
            </Toggle>
          </Column>
          <Column class="flex w-full flex-col md:flex-row items-start  md:items-center gap-5">
            <p>{$t('pathway.pages.settings.issue_two')}</p>
            <div>
              <RadioButtonGroup hideLegend bind:selected={$pathwaySettings.courses_certificate}>
                <RadioButton
                  labelText={$t('pathway.pages.settings.option_one')}
                  value={RADIO_VALUE.TRUE}
                />
                <RadioButton
                  labelText={$t('pathway.pages.settings.option_three')}
                  value={RADIO_VALUE.FALSE}
                />
              </RadioButtonGroup>
            </div>
          </Column>
        </Row>
      </Row>

      <Row class="flex lg:flex-row flex-col pt-7 pb-10 border-bottom-c overflow-hidden">
        <Column sm={8} md={8} lg={8}>
          <SectionTitle>
            {$t('pathway.pages.settings.delete_path')}
          </SectionTitle>
          <p>{$t('pathway.pages.settings.delete_text')}</p>
        </Column>
        <Column sm={8} md={8} lg={8} class="mt-5">
          <button
            type="button"
            class="flex items-center md:ml-7 gap-2 hover:scale-125 transition-all duration-300"
            disabled={isSaving}
            on:click={handledeletePathway}
          >
            {#if isDeleting}
              <Loading withOverlay={false} small />
            {:else}
              <TrashCan class="text-red-600" size={20} />
              <p class="text-sm text-red-600 font-medium">{$t('pathway.pages.settings.delete')}</p>
            {/if}
          </button>
        </Column>
      </Row>

      <Row class="p-5 w-full flex items-center justify-end">
        <PrimaryButton
          label={$t('pathway.pages.settings.save')}
          isLoading={isSaving}
          isDisabled={isSaving}
          onClick={handleSave}
        />
      </Row>
    </Grid>
  </PageBody>
</PathwayContainer>
