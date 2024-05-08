<script lang="ts">
  import { Grid, Row, Column, RadioButtonGroup, RadioButton } from 'carbon-components-svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Save from 'carbon-icons-svelte/lib/Save.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import SectionTitle from '../SectionTitle.svelte';
  import { Toggle } from 'carbon-components-svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { landingPageSettings } from './store';
  import type { OrgLandingPageJson } from './store';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';
  import { t } from '$lib/utils/functions/translations';

  let isSaving = false;
  let creatingNewQuestion = false;
  let widgetKey = '';
  const banner = [
    { value: 'video', label: `${$t('settings.landing_page.actions.banner_type.video')}` },
    { value: 'image', label: `${$t('settings.landing_page.actions.banner_type.image')}` }
  ];
  const supabase = getSupabase();

  let newQuestion = {
    title: '',
    content: ''
  };

  function widgetControl(key: string) {
    widgetKey = key;
    $handleOpenWidget.open = true;
  }

  function createNewFaq() {
    newQuestion = {
      title: '',
      content: ''
    };
    creatingNewQuestion = true;
  }

  function saveNewFAQ() {
    if (newQuestion.title !== '' && newQuestion.content !== '') {
      $landingPageSettings.faq.questions = [
        ...$landingPageSettings.faq.questions,
        {
          id: new Date().getTime(),
          title: newQuestion.title,
          content: newQuestion.content
        }
      ];
      creatingNewQuestion = false;
    }
  }

  function cancelNewFAQ() {
    creatingNewQuestion = false;
  }

  function deleteFaq(id: number) {
    let faqs = $landingPageSettings.faq.questions;
    const filteredFaq = faqs.filter((faq) => faq.id !== id);
    $landingPageSettings.faq.questions = filteredFaq;
  }

  const checkPrefix = (inputValue: string) => {
    if (!inputValue) return;

    if (inputValue.trim() !== '') {
      if (!inputValue.startsWith('https://')) {
        inputValue = 'https://' + inputValue;
      }
    }
    return inputValue;
  };

  async function handleSave() {
    isSaving = true;
    $landingPageSettings.footer.twitter = checkPrefix($landingPageSettings.footer.twitter) || '';
    $landingPageSettings.footer.linkedin = checkPrefix($landingPageSettings.footer.linkedin) || '';
    $landingPageSettings.footer.facebook = checkPrefix($landingPageSettings.footer.facebook) || '';

    const { error } = await supabase
      .from('organization')
      .update({ landingpage: $landingPageSettings })
      .match({ id: $currentOrg.id });

    if (error) {
      const message = error?.message || 'snackbar.lms.error.try_again';
      snackbar.error(`snackbar.lms.error.update ${message}`);
    } else {
      $currentOrg.landingpage = $landingPageSettings;
      snackbar.success();
    }

    isSaving = false;
  }

  function setDefault(landingpage: OrgLandingPageJson) {
    if (landingpage && Object.keys(landingpage).length) {
      // Added new key, support backward compatibility
      if (!landingpage?.header?.banner) {
        landingpage.header.banner = $landingPageSettings.header.banner;
      }

      $landingPageSettings = {
        ...landingpage
      };
    }
  }

  $: setDefault($currentOrg?.landingpage as unknown as OrgLandingPageJson);
</script>

<Grid class="border-c rounded border-gray-200 dark:border-neutral-600 w-full mt-5 relative">
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}>
      <SectionTitle>{$t('settings.landing_page.heading')}</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.header.show} size="sm">
        <span slot="labelA" style="color: gray">{$t('settings.landing_page.hide_section')}</span>
        <span slot="labelB" style="color: gray">{$t('settings.landing_page.show_section')}</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label={$t('settings.landing_page.title')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
        bind:value={$landingPageSettings.header.title}
        className="w-full mb-5"
      />
      <TextField
        label={$t('settings.landing_page.title_highlight')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.highlight')}
        className="w-full mb-5"
        bind:value={$landingPageSettings.header.titleHighlight}
      />

      <TextArea
        label={$t('settings.landing_page.subtitle')}
        labelClassName="font-light"
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_subtitle')}
        className="w-full mb-5"
        bind:value={$landingPageSettings.header.subtitle}
        isAIEnabled={true}
      />

      <SectionTitle>{$t('settings.landing_page.actions.heading')}</SectionTitle>
      <TextField
        label={$t('settings.landing_page.actions.label')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.label')}
        className="w-full mt-3 mb-5"
        bind:value={$landingPageSettings.header.action.label}
      />
      <div class="gap-2 mb-5">
        <TextField
          label={$t('settings.landing_page.actions.link')}
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.link')}
          bind:value={$landingPageSettings.header.action.link}
        />
        <Toggle bind:toggled={$landingPageSettings.header.action.redirect} size="sm">
          <span slot="labelA" style="color: gray"
            >{$t('settings.landing_page.actions.no_redirect')}</span
          >
          <span slot="labelB" style="color: gray"
            >{$t('settings.landing_page.actions.redirect')}</span
          >
        </Toggle>
      </div>

      <div />
      <RadioButtonGroup
        legendText={$t('settings.landing_page.actions.banner_type.heading')}
        bind:selected={$landingPageSettings.header.banner.type}
        class="mt-10 mb-5"
      >
        {#each banner as item}
          <RadioButton value={item.value} labelText={item.label} />
        {/each}
      </RadioButtonGroup>
      {#if $landingPageSettings.header.banner.type === 'video'}
        <div class="gap-2 mt-3 mb-5">
          <TextField
            label={$t('settings.landing_page.actions.link')}
            placeholder={$t('course.navItem.lessons.exercises.all_exercises.video')}
            bind:value={$landingPageSettings.header.banner.video}
          />
        </div>
      {:else}
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          label={$t('settings.landing_page.about.select_image')}
          className="mt-3"
          onClick={() => widgetControl('banner')}
        />
      {/if}
      {#if $landingPageSettings.header.banner.image && $landingPageSettings.header.banner.type === 'image'}
        <img
          alt="bannerImage"
          src={$landingPageSettings.header.banner.image}
          class="mt-2 rounded-md w-full"
        />
      {/if}

      <Toggle bind:toggled={$landingPageSettings.header.banner.show} size="sm">
        <span slot="labelA" style="color: gray"
          >{$t('settings.landing_page.actions.hide_banner')}</span
        >
        <span slot="labelB" style="color: gray"
          >{$t('settings.landing_page.actions.show_banner')}</span
        >
      </Toggle>
      {#if $handleOpenWidget.open && widgetKey === 'banner'}
        <UploadWidget bind:imageURL={$landingPageSettings.header.banner.image} />
      {/if}
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('settings.landing_page.about.heading')}</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.aboutUs.show} size="sm">
        <span slot="labelA" style="color: gray">{$t('settings.landing_page.hide_section')}</span>
        <span slot="labelB" style="color: gray">{$t('settings.landing_page.show_section')}</span>
      </Toggle></Column
    >
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label={$t('settings.landing_page.about.title')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
        bind:value={$landingPageSettings.aboutUs.title}
        className="mb-5"
      />

      <TextArea
        label={$t('settings.landing_page.about.content')}
        labelClassName="font-light"
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.content')}
        className="mb-5"
        bind:value={$landingPageSettings.aboutUs.content}
        isAIEnabled={true}
      />

      <div>
        <p class="font-bold">{$t('settings.landing_page.about.upload_an_image')}</p>
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          label={$t('settings.landing_page.about.select_image')}
          className="mt-3"
          onClick={() => widgetControl('about-us')}
        />
        {#if $landingPageSettings.aboutUs.imageUrl}
          <img
            alt="About us"
            src={$landingPageSettings.aboutUs.imageUrl}
            class="mt-2 rounded-md w-full"
          />
        {/if}
        {#if $handleOpenWidget.open && widgetKey === 'about-us'}
          <UploadWidget bind:imageURL={$landingPageSettings.aboutUs.imageUrl} />
        {/if}
      </div>
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('settings.landing_page.courses.heading')}</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.courses.show} size="sm">
        <span slot="labelA" style="color: gray"
          >{$t('settings.landing_page.courses.hide_section')}</span
        >
        <span slot="labelB" style="color: gray"
          >{$t('settings.landing_page.courses.show_section')}</span
        >
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label={$t('settings.landing_page.courses.title')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
        bind:value={$landingPageSettings.courses.title}
      />
      <TextField
        label={$t('settings.landing_page.courses.title_highlight')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.highlight')}
        bind:value={$landingPageSettings.courses.titleHighlight}
      />
      <TextArea
        label={$t('settings.landing_page.courses.subtitle')}
        labelClassName="font-light"
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_subtitle')}
        bind:value={$landingPageSettings.courses.subtitle}
        isAIEnabled={true}
      />
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('settings.landing_page.faq.heading')}</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.faq.show} size="sm">
        <span slot="labelA" style="color: gray">{$t('settings.landing_page.faq.hide_section')}</span
        >
        <span slot="labelB" style="color: gray">{$t('settings.landing_page.faq.show_section')}</span
        >
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <TextField
        label={$t('settings.landing_page.faq.title')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
        bind:value={$landingPageSettings.faq.title}
        className="mb-5"
      />
      {#each $landingPageSettings.faq.questions as item (item.id)}
        <div class="mb-3">
          <TextField
            label={$t('settings.landing_page.faq.question')}
            placeholder={$t(
              'course.navItem.lessons.exercises.all_exercises.write_your_question_here'
            )}
            bind:value={item.title}
            className="mb-5"
          />
          <TextArea
            label={$t('settings.landing_page.faq.answer')}
            labelClassName="font-light"
            placeholder={$t(
              'course.navItem.lessons.exercises.all_exercises.write_your_answer_here'
            )}
            bind:value={item.content}
            className="mb-5"
            isAIEnabled={true}
          />
          <IconButton onClick={() => deleteFaq(item.id)}>
            <TrashCan size={24} class="fill-red-700" />
          </IconButton>
        </div>
      {/each}
      {#if creatingNewQuestion}
        <TextField
          label={$t('settings.landing_page.faq.question')}
          placeholder={$t(
            'course.navItem.lessons.exercises.all_exercises.write_your_question_here'
          )}
          bind:value={newQuestion.title}
          className="mb-5"
        />
        <TextArea
          label={$t('settings.landing_page.faq.answer')}
          labelClassName="font-light"
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_answer_here')}
          bind:value={newQuestion.content}
          className="mb-5"
          isAIEnabled={true}
        />
        <div class="flex items-center gap-2">
          <PrimaryButton
            variant={VARIANTS.OUTLINED}
            label={$t('settings.landing_page.faq.save')}
            onClick={saveNewFAQ}
          />
          <PrimaryButton
            variant={VARIANTS.OUTLINED}
            label={$t('settings.landing_page.faq.cancel')}
            onClick={cancelNewFAQ}
          />
        </div>
      {:else}
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          label={$t('settings.landing_page.faq.button')}
          onClick={createNewFaq}
        />
      {/if}
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('settings.landing_page.contact_us.heading')}</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.contact.show} size="sm">
        <span slot="labelA" style="color: gray"
          >{$t('settings.landing_page.contact_us.hide_section')}</span
        >
        <span slot="labelB" style="color: gray"
          >{$t('settings.landing_page.contact_us.show_section')}</span
        >
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <TextField
        label={$t('settings.landing_page.contact_us.title')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
        bind:value={$landingPageSettings.contact.title}
        className="mb-5"
      />
      <TextField
        label={$t('settings.landing_page.contact_us.title_highlight')}
        labelClassName="font-light"
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.highlight')}
        className="mb-5"
        bind:value={$landingPageSettings.contact.titleHighlight}
      />
      <TextArea
        label={$t('settings.landing_page.contact_us.subtitle')}
        labelClassName="font-light"
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_subtitle')}
        className="mt-3 mb-5"
        bind:value={$landingPageSettings.contact.subtitle}
        isAIEnabled={true}
      />
      <TextField
        label={$t('settings.landing_page.contact_us.phone_number')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.number')}
        className="mt-3 mb-5"
        bind:value={$landingPageSettings.contact.phone}
      />
      <TextField
        label={$t('settings.landing_page.contact_us.email')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.email')}
        className="mt-3 mb-5"
        bind:value={$landingPageSettings.contact.email}
      />
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('settings.landing_page.mailing_list.heading')}</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.mailinglist.show} size="sm">
        <span slot="labelA" style="color: gray"
          >{$t('settings.landing_page.mailing_list.hide_section')}</span
        >
        <span slot="labelB" style="color: gray"
          >{$t('settings.landing_page.mailing_list.show_section')}</span
        >
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label={$t('settings.landing_page.mailing_list.title')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
        bind:value={$landingPageSettings.mailinglist.title}
        className="mb-5"
      />
      <TextArea
        label={$t('settings.landing_page.mailing_list.subtitle')}
        labelClassName="font-light"
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_subtitle')}
        className="mb-5"
        bind:value={$landingPageSettings.mailinglist.subtitle}
        isAIEnabled={true}
      />

      <TextField
        label={$t('settings.landing_page.mailing_list.button_label')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.label')}
        className="mb-5"
        bind:value={$landingPageSettings.mailinglist.buttonLabel}
      />
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('settings.landing_page.footer.heading')}</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.footer.show} size="sm">
        <span slot="labelA" style="color: gray"
          >{$t('settings.landing_page.footer.hide_section')}</span
        >
        <span slot="labelB" style="color: gray"
          >{$t('settings.landing_page.footer.show_section')}</span
        >
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label={$t('settings.landing_page.footer.facebook')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.facebook')}
        bind:value={$landingPageSettings.footer.facebook}
        className="mb-5"
      />
      <!-- <TextField
        label="Instagram"
        placeholder="Write your Instagram link here"
        className="mb-5"
        bind:value={$landingPageSettings.footer.instagram}
      /> -->
      <TextField
        label={$t('settings.landing_page.footer.twitter')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.twitter')}
        className="mb-5"
        bind:value={$landingPageSettings.footer.twitter}
      />
      <TextField
        label={$t('settings.landing_page.footer.linkedin')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.linkedin')}
        className="mb-5"
        bind:value={$landingPageSettings.footer.linkedin}
      />
    </Column>
  </Row>
  <div class="sticky desktop float-right bottom-12 mr-2 z-[120]">
    <PrimaryButton
      label={$t('settings.landing_page.save_changes')}
      isLoading={isSaving}
      isDisabled={isSaving}
      onClick={handleSave}
    />
  </div>
</Grid>

<div
  class="absolute
 mobile right-6 bottom-8 z-[120]"
>
  <span>
    <IconButton onClick={handleSave} disabled={isSaving}>
      <Save size={40} class=" bg-blue-700 p-1 rounded-full" />
    </IconButton>
  </span>
</div>

<style>
  @media screen and (min-width: 769px) {
    .desktop {
      display: block;
    }
    .mobile {
      display: none;
    }
  }
  @media screen and (max-width: 768px) {
    .desktop {
      display: none;
    }
    .mobile {
      display: flex;
    }
  }
</style>
