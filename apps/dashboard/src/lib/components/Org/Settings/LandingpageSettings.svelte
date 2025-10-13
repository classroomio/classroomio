<script lang="ts">
  import { untrack } from 'svelte';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { IconButton } from '$lib/components/IconButton';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import UnsavedChanges from '$lib/components/UnsavedChanges/index.svelte';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { Column, Grid, RadioButton, RadioButtonGroup, Row, Toggle } from 'carbon-components-svelte';
  import SaveIcon from '@lucide/svelte/icons/save';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import SectionTitle from '../SectionTitle.svelte';
  import type { OrgLandingPageJson } from '$lib/utils/types/org';
  import { landingPageSettings } from './store';

  let isSaving = $state(false);
  let creatingNewQuestion = false;
  let creatingNewCustomLink = false;
  let hasUnsavedChanges = false;
  let widgetKey = '';
  const banner = [
    { value: 'video', label: `${$t('settings.landing_page.actions.banner_type.video')}` },
    { value: 'image', label: `${$t('settings.landing_page.actions.banner_type.image')}` }
  ];
  const supabase = getSupabase();

  let newQuestion = $state({
    title: '',
    content: ''
  });

  let newCustomLink = {
    label: '',
    url: '',
    openInNewTab: false
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

  function createNewCustomLink() {
    newCustomLink = {
      label: '',
      url: '',
      openInNewTab: false
    };
    creatingNewCustomLink = true;
  }

  function saveNewCustomLink() {
    if (newCustomLink.label !== '' && newCustomLink.url !== '') {
      $landingPageSettings.customLinks.links = [
        ...$landingPageSettings.customLinks.links,
        {
          id: new Date().getTime(),
          label: newCustomLink.label,
          url: newCustomLink.url,
          openInNewTab: newCustomLink.openInNewTab
        }
      ];
      creatingNewCustomLink = false;
    }
  }

  function cancelNewCustomLink() {
    creatingNewCustomLink = false;
  }

  function deleteCustomLink(id: number) {
    let customLinks = $landingPageSettings.customLinks.links;
    const filteredCustomLinks = customLinks.filter((link) => link.id !== id);
    $landingPageSettings.customLinks.links = filteredCustomLinks;
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
      $currentOrg.landingpage = $landingPageSettings as any;
      snackbar.success('snackbar.success_update');
      hasUnsavedChanges = false;
    }

    isSaving = false;
  }

  function setDefault(landingpage: OrgLandingPageJson) {
    if (landingpage && Object.keys(landingpage).length) {
      // Added new key, support backward compatibility
      if (!landingpage?.header?.banner) {
        landingpage.header.banner = $landingPageSettings.header.banner;
      }

      if (!landingpage?.header?.background) {
        landingpage.header.background = $landingPageSettings.header.background;
      }
      
      if (!landingpage.customLinks) {
        landingpage.customLinks = $landingPageSettings.customLinks;
      }

      untrack(() => {
        $landingPageSettings = {
          ...landingpage
        };
      });
    }
  }
  $effect(() => {
    setDefault($currentOrg?.landingpage as unknown as OrgLandingPageJson);
  });
</script>

<UnsavedChanges bind:hasUnsavedChanges />
<Grid class="border-c relative mt-5 w-full rounded border-gray-200 dark:border-neutral-600">
  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}>
      <SectionTitle>{$t('settings.landing_page.heading')}</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.header.show} size="sm" on:change={() => (hasUnsavedChanges = true)}>
        <span slot="labelA" style="color: gray">{$t('settings.landing_page.hide_section')}</span>
        <span slot="labelB" style="color: gray">{$t('settings.landing_page.show_section')}</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label={$t('settings.landing_page.title')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
        bind:value={$landingPageSettings.header.title}
        onChange={() => (hasUnsavedChanges = true)}
        className="w-full mb-5"
      />
      <TextField
        label={$t('settings.landing_page.title_highlight')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.highlight')}
        className="w-full mb-5"
        bind:value={$landingPageSettings.header.titleHighlight}
        onChange={() => (hasUnsavedChanges = true)}
      />

      <TextArea
        label={$t('settings.landing_page.subtitle')}
        labelClassName="font-light"
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_subtitle')}
        className="w-full mb-5"
        bind:value={$landingPageSettings.header.subtitle}
        onChange={() => (hasUnsavedChanges = true)}
        isAIEnabled={true}
      />

      <SectionTitle>{$t('settings.landing_page.actions.heading')}</SectionTitle>
      <TextField
        label={$t('settings.landing_page.actions.label')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.label')}
        className="w-full mt-3 mb-5"
        bind:value={$landingPageSettings.header.action.label}
        onChange={() => (hasUnsavedChanges = true)}
      />
      <div class="mb-5 gap-2">
        <TextField
          label={$t('settings.landing_page.actions.link')}
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.link')}
          bind:value={$landingPageSettings.header.action.link}
          onChange={() => (hasUnsavedChanges = true)}
        />
        <Toggle
          bind:toggled={$landingPageSettings.header.action.redirect}
          size="sm"
          on:change={() => (hasUnsavedChanges = true)}
        >
          <span slot="labelA" style="color: gray">{$t('settings.landing_page.actions.no_redirect')}</span>
          <span slot="labelB" style="color: gray">{$t('settings.landing_page.actions.redirect')}</span>
        </Toggle>
      </div>

      <RadioButtonGroup
        legendText={$t('settings.landing_page.actions.banner_type.heading')}
        bind:selected={$landingPageSettings.header.banner.type}
        on:change={() => (hasUnsavedChanges = true)}
        class="mb-5 mt-10"
      >
        {#each banner as item}
          <RadioButton value={item.value} labelText={item.label} />
        {/each}
      </RadioButtonGroup>
      {#if $landingPageSettings.header.banner.type === 'video'}
        <div class="mb-5 mt-3 gap-2">
          <TextField
            label={$t('settings.landing_page.actions.link')}
            placeholder={$t('course.navItem.lessons.exercises.all_exercises.video')}
            bind:value={$landingPageSettings.header.banner.video}
            onChange={() => (hasUnsavedChanges = true)}
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
        <img alt="bannerImage" src={$landingPageSettings.header.banner.image} class="mt-2 w-full rounded-md" />
      {/if}

      <Toggle
        bind:toggled={$landingPageSettings.header.banner.show}
        size="sm"
        on:change={() => (hasUnsavedChanges = true)}
      >
        <span slot="labelA" style="color: gray">{$t('settings.landing_page.actions.hide_banner')}</span>
        <span slot="labelB" style="color: gray">{$t('settings.landing_page.actions.show_banner')}</span>
      </Toggle>
      {#if $handleOpenWidget.open && widgetKey === 'banner'}
        <UploadWidget
          bind:imageURL={$landingPageSettings.header.banner.image}
          onchange={() => (hasUnsavedChanges = true)}
        />
      {/if}

      <!-- background -->

      <div class="mt-4">
        <p class="mb-4 font-bold">{$t('settings.landing_page.background.title')}</p>
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          label={$t('settings.landing_page.about.select_image')}
          className="mt-3"
          onClick={() => widgetControl('background')}
        />

        {#if $landingPageSettings.header.background?.image}
          <img
            alt="backgroundImage"
            src={$landingPageSettings.header.background.image}
            class="mt-2 w-full rounded-md"
          />
        {/if}

        <Toggle
          toggled={$landingPageSettings.header.background?.show}
          on:change={() => {
            hasUnsavedChanges = true;
            if (!$landingPageSettings.header.background) {
              $landingPageSettings.header.background = {
                image: '',
                show: false
              };
            } else {
              $landingPageSettings.header.background.show = !$landingPageSettings.header.background.show;
            }
          }}
          size="sm"
        >
          <span slot="labelA" style="color: gray">{$t('settings.landing_page.background.hide_background')}</span>
          <span slot="labelB" style="color: gray">{$t('settings.landing_page.background.show_background')}</span>
        </Toggle>

        {#if $handleOpenWidget.open && widgetKey === 'background'}
          <UploadWidget
            imageURL={$landingPageSettings.header.background?.image}
            onchange={(imgUrl) => {
              hasUnsavedChanges = true;

              if (!$landingPageSettings.header.background) {
                $landingPageSettings.header.background = {
                  image: imgUrl,
                  show: true
                };
              } else {
                $landingPageSettings.header.background.image = imgUrl;
              }
            }}
          />
        {/if}
      </div>
    </Column>
  </Row>

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('settings.landing_page.about.heading')}</SectionTitle>

      <Toggle bind:toggled={$landingPageSettings.aboutUs.show} on:change={() => (hasUnsavedChanges = true)} size="sm">
        <span slot="labelA" style="color: gray">{$t('settings.landing_page.hide_section')}</span>
        <span slot="labelB" style="color: gray">{$t('settings.landing_page.show_section')}</span>
      </Toggle></Column
    >
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label={$t('settings.landing_page.about.title')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
        bind:value={$landingPageSettings.aboutUs.title}
        onChange={() => (hasUnsavedChanges = true)}
        className="mb-5"
      />

      <TextArea
        label={$t('settings.landing_page.about.content')}
        labelClassName="font-light"
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.content')}
        className="mb-5"
        bind:value={$landingPageSettings.aboutUs.content}
        onChange={() => (hasUnsavedChanges = true)}
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
          <img alt="About us" src={$landingPageSettings.aboutUs.imageUrl} class="mt-2 w-full rounded-md" />
        {/if}
        {#if $handleOpenWidget.open && widgetKey === 'about-us'}
          <UploadWidget bind:imageURL={$landingPageSettings.aboutUs.imageUrl} />
        {/if}
      </div>
    </Column>
  </Row>

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('settings.landing_page.courses.heading')}</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.courses.show} size="sm" on:change={() => (hasUnsavedChanges = true)}>
        <span slot="labelA" style="color: gray">{$t('settings.landing_page.courses.hide_section')}</span>
        <span slot="labelB" style="color: gray">{$t('settings.landing_page.courses.show_section')}</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label={$t('settings.landing_page.courses.title')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
        bind:value={$landingPageSettings.courses.title}
        onChange={() => (hasUnsavedChanges = true)}
      />
      <TextField
        label={$t('settings.landing_page.courses.title_highlight')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.highlight')}
        bind:value={$landingPageSettings.courses.titleHighlight}
        onChange={() => (hasUnsavedChanges = true)}
      />
      <TextArea
        label={$t('settings.landing_page.courses.subtitle')}
        labelClassName="font-light"
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_subtitle')}
        bind:value={$landingPageSettings.courses.subtitle}
        onChange={() => (hasUnsavedChanges = true)}
        isAIEnabled={true}
      />
    </Column>
  </Row>

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}>
      <SectionTitle>{$t('settings.landing_page.faq.heading')}</SectionTitle>

      <Toggle bind:toggled={$landingPageSettings.faq.show} size="sm" on:change={() => (hasUnsavedChanges = true)}>
        <span slot="labelA" style="color: gray">{$t('settings.landing_page.faq.hide_section')}</span>
        <span slot="labelB" style="color: gray">{$t('settings.landing_page.faq.show_section')}</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <TextField
        label={$t('settings.landing_page.faq.title')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
        bind:value={$landingPageSettings.faq.title}
        onChange={() => (hasUnsavedChanges = true)}
        className="mb-5"
      />
      {#each $landingPageSettings.faq.questions as item (item.id)}
        <div class="mb-3">
          <TextField
            label={$t('settings.landing_page.faq.question')}
            placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_question_here')}
            bind:value={item.title}
            onChange={() => (hasUnsavedChanges = true)}
            className="mb-5"
          />
          <TextArea
            label={$t('settings.landing_page.faq.answer')}
            labelClassName="font-light"
            placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_answer_here')}
            bind:value={item.content}
            className="mb-5"
            onChange={() => (hasUnsavedChanges = true)}
            isAIEnabled={true}
          />
          <IconButton onClick={() => deleteFaq(item.id)}>
            <TrashIcon />
          </IconButton>
        </div>
      {/each}
      {#if creatingNewQuestion}
        <TextField
          label={$t('settings.landing_page.faq.question')}
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_question_here')}
          bind:value={newQuestion.title}
          onChange={() => (hasUnsavedChanges = true)}
          className="mb-5"
        />
        <TextArea
          label={$t('settings.landing_page.faq.answer')}
          labelClassName="font-light"
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_answer_here')}
          bind:value={newQuestion.content}
          onChange={() => (hasUnsavedChanges = true)}
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

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('settings.landing_page.contact_us.heading')}</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.contact.show} size="sm" on:change={() => (hasUnsavedChanges = true)}>
        <span slot="labelA" style="color: gray">{$t('settings.landing_page.contact_us.hide_section')}</span>
        <span slot="labelB" style="color: gray">{$t('settings.landing_page.contact_us.show_section')}</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <TextField
        label={$t('settings.landing_page.contact_us.title')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
        bind:value={$landingPageSettings.contact.title}
        onChange={() => (hasUnsavedChanges = true)}
        className="mb-5"
      />
      <TextField
        label={$t('settings.landing_page.contact_us.title_highlight')}
        labelClassName="font-light"
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.highlight')}
        className="mb-5"
        bind:value={$landingPageSettings.contact.titleHighlight}
        onChange={() => (hasUnsavedChanges = true)}
      />
      <TextArea
        label={$t('settings.landing_page.contact_us.subtitle')}
        labelClassName="font-light"
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_subtitle')}
        className="mt-3 mb-5"
        bind:value={$landingPageSettings.contact.subtitle}
        onChange={() => (hasUnsavedChanges = true)}
        isAIEnabled={true}
      />
      <TextField
        label={$t('settings.landing_page.contact_us.address')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.address')}
        className="mt-3 mb-5"
        bind:value={$landingPageSettings.contact.address}
        onChange={() => (hasUnsavedChanges = true)}
      />
      <TextField
        label={$t('settings.landing_page.contact_us.phone_number')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.number')}
        className="mt-3 mb-5"
        bind:value={$landingPageSettings.contact.phone}
        onChange={() => (hasUnsavedChanges = true)}
      />
      <TextField
        label={$t('settings.landing_page.contact_us.email')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.email')}
        className="mt-3 mb-5"
        bind:value={$landingPageSettings.contact.email}
        onChange={() => (hasUnsavedChanges = true)}
      />
    </Column>
  </Row>

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('settings.landing_page.mailing_list.heading')}</SectionTitle>
      <Toggle
        bind:toggled={$landingPageSettings.mailinglist.show}
        size="sm"
        on:change={() => (hasUnsavedChanges = true)}
      >
        <span slot="labelA" style="color: gray">{$t('settings.landing_page.mailing_list.hide_section')}</span>
        <span slot="labelB" style="color: gray">{$t('settings.landing_page.mailing_list.show_section')}</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label={$t('settings.landing_page.mailing_list.title')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_title')}
        bind:value={$landingPageSettings.mailinglist.title}
        onChange={() => (hasUnsavedChanges = true)}
        className="mb-5"
      />
      <TextArea
        label={$t('settings.landing_page.mailing_list.subtitle')}
        labelClassName="font-light"
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_subtitle')}
        className="mb-5"
        bind:value={$landingPageSettings.mailinglist.subtitle}
        onChange={() => (hasUnsavedChanges = true)}
        isAIEnabled={true}
      />

      <TextField
        label={$t('settings.landing_page.mailing_list.button_label')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.label')}
        className="mb-5"
        bind:value={$landingPageSettings.mailinglist.buttonLabel}
        onChange={() => (hasUnsavedChanges = true)}
      />
    </Column>
  </Row>

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('settings.landing_page.custom_links.heading')}</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.customLinks.show} size="sm">
        <span slot="labelA" style="color: gray">{$t('settings.landing_page.custom_links.hide_links')}</span>
        <span slot="labelB" style="color: gray">{$t('settings.landing_page.custom_links.show_links')}</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <p class="mb-4 text-sm text-gray-600">
        {$t('settings.landing_page.custom_links.description')}
      </p>

      {#each $landingPageSettings.customLinks.links as link (link.id)}
        <div class="mb-4 rounded-lg border border-gray-200 p-4">
          <div class="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              label={$t('settings.landing_page.custom_links.label')}
              placeholder={$t('settings.landing_page.custom_links.label_placeholder')}
              bind:value={link.label}
              className="mb-3"
            />
            <TextField
              label={$t('settings.landing_page.custom_links.url')}
              placeholder={$t('settings.landing_page.custom_links.url_placeholder')}
              bind:value={link.url}
              className="mb-3"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="flex items-center">
              <input type="checkbox" bind:checked={link.openInNewTab} class="mr-2" />
              <span class="text-sm">{$t('settings.landing_page.custom_links.new_tab')}</span>
            </label>
            <IconButton onClick={() => deleteCustomLink(link.id)}>
              <TrashIcon />
            </IconButton>
          </div>
        </div>
      {/each}

      {#if creatingNewCustomLink}
        <div class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div class="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              label={$t('settings.landing_page.custom_links.label')}
              placeholder={$t('settings.landing_page.custom_links.label_placeholder')}
              bind:value={newCustomLink.label}
              className="mb-3"
            />
            <TextField
              label={$t('settings.landing_page.custom_links.url')}
              placeholder={$t('settings.landing_page.custom_links.url_placeholder')}
              bind:value={newCustomLink.url}
              className="mb-3"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="flex items-center">
              <input type="checkbox" bind:checked={newCustomLink.openInNewTab} class="mr-2" />
              <span class="text-sm">{$t('settings.landing_page.custom_links.new_tab')}</span>
            </label>
            <div class="flex gap-2">
              <PrimaryButton
                variant={VARIANTS.OUTLINED}
                label={$t('settings.landing_page.custom_links.save')}
                onClick={saveNewCustomLink}
                className="text-sm px-3 py-1"
              />
              <PrimaryButton
                variant={VARIANTS.OUTLINED}
                label={$t('settings.landing_page.custom_links.cancel')}
                onClick={cancelNewCustomLink}
                className="text-sm px-3 py-1"
              />
            </div>
          </div>
        </div>
      {:else}
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          label={$t('settings.landing_page.custom_links.add')}
          onClick={createNewCustomLink}
          className="mt-2"
        />
      {/if}
    </Column>
  </Row>

  <Row class="flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('settings.landing_page.footer.heading')}</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.footer.show} size="sm" on:change={() => (hasUnsavedChanges = true)}>
        <span slot="labelA" style="color: gray">{$t('settings.landing_page.footer.hide_section')}</span>
        <span slot="labelB" style="color: gray">{$t('settings.landing_page.footer.show_section')}</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label={$t('settings.landing_page.footer.facebook')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.facebook')}
        bind:value={$landingPageSettings.footer.facebook}
        onChange={() => (hasUnsavedChanges = true)}
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
        onChange={() => (hasUnsavedChanges = true)}
      />
      <TextField
        label={$t('settings.landing_page.footer.linkedin')}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.linkedin')}
        className="mb-5"
        bind:value={$landingPageSettings.footer.linkedin}
        onChange={() => (hasUnsavedChanges = true)}
      />
    </Column>
  </Row>
  <div class="desktop sticky bottom-12 z-[120] float-right mr-2">
    <PrimaryButton
      label={$t('settings.landing_page.save_changes')}
      isLoading={isSaving}
      isDisabled={isSaving}
      onClick={handleSave}
    />
  </div>
</Grid>

<div
  class="mobile
 absolute bottom-8 right-6 z-[120]"
>
  <span>
    <IconButton onClick={handleSave} disabled={isSaving}>
      <SaveIcon />
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
