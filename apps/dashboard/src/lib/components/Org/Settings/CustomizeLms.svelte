<script lang="ts">
  import { Grid, Row, Column } from 'carbon-components-svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Save from 'carbon-icons-svelte/lib/Save.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import SectionTitle from '../SectionTitle.svelte';
  import { Toggle } from 'carbon-components-svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';
  import { t } from '$lib/utils/functions/translations';

  const supabase = getSupabase();

  let widgetKey = '';
  let isSaving = false;

  function widgetControl(key: string) {
    widgetKey = key;
    $handleOpenWidget.open = true;
  }

  async function handleSave() {
    isSaving = true;

    const { error } = await supabase
      .from('organization')
      .update({ customization: $currentOrg.customization })
      .match({ id: $currentOrg.id });

    if (error) {
      const message = error?.message || 'snackbar.lms.error.try_again';
      console.error('Error updating customizations', message);
      snackbar.error('snackbar.lms.error.update');
    } else {
      snackbar.success('snackbar.success_update');
    }

    isSaving = false;
  }
</script>

<Grid class="border-c rounded border-gray-200 dark:border-neutral-600 w-full mt-5 relative">
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}>
      <SectionTitle>{$t('components.settings.customize_lms.dashboard.title')}</SectionTitle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <div>
        <p>{$t('components.settings.customize_lms.dashboard.community')}</p>
        <Toggle size="sm" class="mb-3" bind:toggled={$currentOrg.customization.dashboard.community}>
          <span slot="labelA" style="color: gray"
            >{$t('components.settings.customize_lms.disabled')}</span
          >
          <span slot="labelB" style="color: gray"
            >{$t('components.settings.customize_lms.enabled')}</span
          >
        </Toggle>
      </div>

      <div>
        <p>{$t('components.settings.customize_lms.dashboard.exercises')}</p>
        <Toggle size="sm" class="mb-3" bind:toggled={$currentOrg.customization.dashboard.exercise}>
          <span slot="labelA" style="color: gray"
            >{$t('components.settings.customize_lms.disabled')}</span
          >
          <span slot="labelB" style="color: gray"
            >{$t('components.settings.customize_lms.enabled')}</span
          >
        </Toggle>
      </div>

      <div class="mb-3">
        <p>{$t('components.settings.customize_lms.dashboard.banner_image')}</p>
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          label={$t('components.settings.customize_lms.dashboard.banner_image_btn')}
          className="mt-3"
          onClick={() => widgetControl('banner-image')}
        />
        {#if $currentOrg.customization.dashboard.bannerImage}
          <img
            alt="Banner"
            src={$currentOrg.customization.dashboard.bannerImage}
            class="mt-2 rounded-md w-full"
          />
        {/if}
        {#if $handleOpenWidget.open && widgetKey === 'banner-image'}
          <UploadWidget bind:imageURL={$currentOrg.customization.dashboard.bannerImage} />
        {/if}
      </div>

      <div>
        <p>{$t('components.settings.customize_lms.dashboard.banner_text')}</p>
        <TextField
          label={$t('components.settings.customize_lms.dashboard.banner_text_label')}
          placeholder={$t('components.settings.customize_lms.dashboard.banner_text_placeholder')}
          className="mb-5"
          bind:value={$currentOrg.customization.dashboard.bannerText}
        />
      </div>
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('components.settings.customize_lms.course.title')}</SectionTitle></Column
    >
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <div>
        <p>{$t('components.settings.customize_lms.course.newsfeed')}</p>
        <Toggle size="sm" class="mb-3" bind:toggled={$currentOrg.customization.course.newsfeed}>
          <span slot="labelA" style="color: gray"
            >{$t('components.settings.customize_lms.disabled')}</span
          >
          <span slot="labelB" style="color: gray"
            >{$t('components.settings.customize_lms.enabled')}</span
          >
        </Toggle>
      </div>

      <div>
        <p>{$t('components.settings.customize_lms.course.grading')}</p>
        <Toggle size="sm" class="mb-3" bind:toggled={$currentOrg.customization.course.grading}>
          <span slot="labelA" style="color: gray"
            >{$t('components.settings.customize_lms.disabled')}</span
          >
          <span slot="labelB" style="color: gray"
            >{$t('components.settings.customize_lms.enabled')}</span
          >
        </Toggle>
      </div>
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('components.settings.customize_lms.apps.title')}</SectionTitle></Column
    >
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <div>
        <p>{$t('components.settings.customize_lms.apps.poll')}</p>
        <Toggle size="sm" class="mb-3" bind:toggled={$currentOrg.customization.apps.poll}>
          <span slot="labelA" style="color: gray"
            >{$t('components.settings.customize_lms.disabled')}</span
          >
          <span slot="labelB" style="color: gray"
            >{$t('components.settings.customize_lms.enabled')}</span
          >
        </Toggle>
      </div>
      <div>
        <p>{$t('components.settings.customize_lms.apps.live_comment')}</p>
        <Toggle size="sm" class="mb-3" bind:toggled={$currentOrg.customization.apps.comments}>
          <span slot="labelA" style="color: gray"
            >{$t('components.settings.customize_lms.disabled')}</span
          >
          <span slot="labelB" style="color: gray"
            >{$t('components.settings.customize_lms.enabled')}</span
          >
        </Toggle>
      </div>
    </Column>
  </Row>

  <div class="sticky desktop float-right bottom-12 mr-2 z-[120]">
    <PrimaryButton
      label={$t('components.settings.customize_lms.save')}
      onClick={handleSave}
      isLoading={isSaving}
      isDisabled={isSaving}
    />
  </div>
</Grid>

<div
  class="absolute
   mobile right-6 bottom-8 z-[120]"
>
  <span>
    <IconButton onClick={handleSave} disabled={isSaving}>
      <Save size={40} class=" bg-blue-700 SectionTitle-1 rounded-full" />
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
