<script lang="ts">
  import { Grid, Row, Column, RadioButtonGroup, RadioButton } from 'carbon-components-svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import SectionTitle from '../SectionTitle.svelte';
  import { Toggle } from 'carbon-components-svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { FileUploader } from 'carbon-components-svelte';
  import { landingPageSettings } from './store';
  import type { OrgLandingPageJson } from './store';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';
  import merge from 'lodash/merge';

  let files: File[] = [];
  let imageBuffer: File;
  let uploadingImage = false;
  let isSaving = false;
  let creatingNewQuestion = false;
  let widgetKey = '';

  const banner = [
    { value: 'video', label: 'Video' },
    { value: 'image', label: 'Image' }
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
      const message = error?.message || 'Please try again';
      snackbar.error(`Update failed: ${message}`);
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

  $: setDefault($currentOrg?.landingpage as OrgLandingPageJson);
</script>

<Grid class="border-c rounded border-gray-200 w-full mt-5 relative">
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}>
      <SectionTitle>Landing Page</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.header.show} size="sm">
        <span slot="labelA" style="color: gray">Hide section</span>
        <span slot="labelB" style="color: gray">Show section</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label="Title"
        placeholder="Write your title here"
        bind:value={$landingPageSettings.header.title}
        className="w-full mb-5"
      />
      <TextField
        label="Title-Highlight"
        placeholder="Write your titlehighlight here"
        className="w-full mb-5"
        bind:value={$landingPageSettings.header.titleHighlight}
      />

      <TextArea
        label="Subtitle"
        labelClassName="font-light"
        placeholder="Write your subtitle here"
        className="w-full mb-5"
        bind:value={$landingPageSettings.header.subtitle}
        isAIEnabled={true}
      />

      <SectionTitle>Actions</SectionTitle>
      <TextField
        label="Label"
        placeholder="Write your label here"
        className="w-full mt-3 mb-5"
        bind:value={$landingPageSettings.header.action.label}
      />
      <div class="gap-2 mb-5">
        <TextField
          label="Link"
          placeholder="Write your link here"
          bind:value={$landingPageSettings.header.action.link}
        />
        <Toggle bind:toggled={$landingPageSettings.header.action.redirect} size="sm">
          <span slot="labelA" style="color: gray">No redirect</span>
          <span slot="labelB" style="color: gray">Redirect</span>
        </Toggle>
      </div>

      <div />
      <RadioButtonGroup
        legendText="Banner Type"
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
            label="Link"
            placeholder="Write your video link here"
            bind:value={$landingPageSettings.header.banner.video}
          />
        </div>
      {:else}
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          label="Select Image"
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
        <span slot="labelA" style="color: gray">Hide banner</span>
        <span slot="labelB" style="color: gray">Show banner</span>
      </Toggle>
      {#if $handleOpenWidget.open && widgetKey === 'banner'}
        <UploadWidget bind:imageURL={$landingPageSettings.header.banner.image} />
      {/if}
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>About</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.aboutUs.show} size="sm">
        <span slot="labelA" style="color: gray">Hide section</span>
        <span slot="labelB" style="color: gray">Show section</span>
      </Toggle></Column
    >
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label="Title"
        placeholder="Write your title here"
        bind:value={$landingPageSettings.aboutUs.title}
        className="mb-5"
      />

      <TextArea
        label="Content"
        labelClassName="font-light"
        placeholder="Write your Content here"
        className="mb-5"
        bind:value={$landingPageSettings.aboutUs.content}
        isAIEnabled={true}
      />

      <div>
        <p class="font-bold">Upload an image</p>
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          label="Select Image"
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
      ><SectionTitle>Courses</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.courses.show} size="sm">
        <span slot="labelA" style="color: gray">Hide section</span>
        <span slot="labelB" style="color: gray">Show section</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label="Title"
        placeholder="Write your title here"
        bind:value={$landingPageSettings.courses.title}
      />
      <TextField
        label="Title-Highlight"
        placeholder="Write your title highlight here"
        bind:value={$landingPageSettings.courses.titleHighlight}
      />
      <TextArea
        label="Subtitle"
        labelClassName="font-light"
        placeholder="Write your subtitle here"
        bind:value={$landingPageSettings.courses.subtitle}
        isAIEnabled={true}
      />
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>Frequently Asked Questions</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.faq.show} size="sm">
        <span slot="labelA" style="color: gray">Hide section</span>
        <span slot="labelB" style="color: gray">Show section</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <TextField
        label="Title"
        placeholder="Write your title here"
        bind:value={$landingPageSettings.faq.title}
        className="mb-5"
      />
      {#each $landingPageSettings.faq.questions as item (item.id)}
        <div class="mb-3">
          <TextField
            label="Question"
            placeholder="Write your question here"
            bind:value={item.title}
            className="mb-5"
          />
          <TextArea
            label="Answer"
            labelClassName="font-light"
            placeholder="Write your answer here"
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
          label="Question"
          placeholder="Write your question here"
          bind:value={newQuestion.title}
          className="mb-5"
        />
        <TextArea
          label="Answer"
          labelClassName="font-light"
          placeholder="Write your answer here"
          bind:value={newQuestion.content}
          className="mb-5"
          isAIEnabled={true}
        />
        <div class="flex items-center gap-2">
          <PrimaryButton variant={VARIANTS.OUTLINED} label="Save" onClick={saveNewFAQ} />
          <PrimaryButton variant={VARIANTS.OUTLINED} label="Cancel" onClick={cancelNewFAQ} />
        </div>
      {:else}
        <PrimaryButton variant={VARIANTS.OUTLINED} label="Add New Faq" onClick={createNewFaq} />
      {/if}
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>Contact us</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.contact.show} size="sm">
        <span slot="labelA" style="color: gray">Hide section</span>
        <span slot="labelB" style="color: gray">Show section</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <TextField
        label="Title"
        placeholder="Write your title here"
        bind:value={$landingPageSettings.contact.title}
        className="mb-5"
      />
      <TextField
        label="Title-highlight"
        labelClassName="font-light"
        placeholder="Write your title highlight here"
        className="mb-5"
        bind:value={$landingPageSettings.contact.titleHighlight}
      />
      <TextArea
        label="Subtitle"
        labelClassName="font-light"
        placeholder="Write your subtitle here"
        className="mt-3 mb-5"
        bind:value={$landingPageSettings.contact.subtitle}
        isAIEnabled={true}
      />
      <TextField
        label="Phone number"
        placeholder="Write your phone number here"
        className="mt-3 mb-5"
        bind:value={$landingPageSettings.contact.phone}
      />
      <TextField
        label="Email"
        placeholder="Write your email here"
        className="mt-3 mb-5"
        bind:value={$landingPageSettings.contact.email}
      />
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>Mailing List</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.mailinglist.show} size="sm">
        <span slot="labelA" style="color: gray">Hide section</span>
        <span slot="labelB" style="color: gray">Show section</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label="Title"
        placeholder="Write your title here"
        bind:value={$landingPageSettings.mailinglist.title}
        className="mb-5"
      />
      <TextArea
        label="Subtitle"
        labelClassName="font-light"
        placeholder="Write your subtitle here"
        className="mb-5"
        bind:value={$landingPageSettings.mailinglist.subtitle}
        isAIEnabled={true}
      />

      <TextField
        label="Button-label"
        placeholder="Write your label here"
        className="mb-5"
        bind:value={$landingPageSettings.mailinglist.buttonLabel}
      />
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>Footer</SectionTitle>
      <Toggle bind:toggled={$landingPageSettings.footer.show} size="sm">
        <span slot="labelA" style="color: gray">Hide section</span>
        <span slot="labelB" style="color: gray">Show section</span>
      </Toggle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <TextField
        label="Facebook"
        placeholder="Write your Facebook link here"
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
        label="Twitter"
        placeholder="Write your Twitter link here"
        className="mb-5"
        bind:value={$landingPageSettings.footer.twitter}
      />
      <TextField
        label="Linkedin"
        placeholder="Write your Linkedin link here"
        className="mb-5"
        bind:value={$landingPageSettings.footer.linkedin}
      />
    </Column>
  </Row>
  <Row class="p-5 w-full flex items-center justify-center">
    <PrimaryButton
      label="Save Changes"
      isLoading={isSaving}
      isDisabled={isSaving}
      onClick={handleSave}
    />
  </Row>
</Grid>
