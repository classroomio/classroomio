<script lang="ts">
  import { Grid, Row, Column } from 'carbon-components-svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Save from 'carbon-icons-svelte/lib/Save.svelte';
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

  let widgetKey = $state('');
  let isSaving = $state(false);

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

<Grid class="border-c relative mt-5 w-full rounded border-gray-200 dark:border-neutral-600">
  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}>
      <SectionTitle>{$t('components.settings.customize_lms.dashboard.title')}</SectionTitle>
    </Column>
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <div>
        <p>{$t('components.settings.customize_lms.dashboard.community')}</p>
        <Toggle size="sm" class="mb-3" bind:toggled={$currentOrg.customization.dashboard.community}>
          {#snippet labelA()}
            <span style="color: gray">{$t('components.settings.customize_lms.disabled')}</span>
          {/snippet}
          {#snippet labelB()}
            <span style="color: gray">{$t('components.settings.customize_lms.enabled')}</span>
          {/snippet}
        </Toggle>
      </div>

      <div>
        <p>{$t('components.settings.customize_lms.dashboard.exercises')}</p>
        <Toggle size="sm" class="mb-3" bind:toggled={$currentOrg.customization.dashboard.exercise}>
          {#snippet labelA()}
            <span style="color: gray">{$t('components.settings.customize_lms.disabled')}</span>
          {/snippet}
          {#snippet labelB()}
            <span style="color: gray">{$t('components.settings.customize_lms.enabled')}</span>
          {/snippet}
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
            class="mt-2 w-full rounded-md"
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

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('components.settings.customize_lms.course.title')}</SectionTitle></Column
    >
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <div>
        <p>{$t('components.settings.customize_lms.course.newsfeed')}</p>
        <Toggle size="sm" class="mb-3" bind:toggled={$currentOrg.customization.course.newsfeed}>
          {#snippet labelA()}
            <span style="color: gray">{$t('components.settings.customize_lms.disabled')}</span>
          {/snippet}
          {#snippet labelB()}
            <span style="color: gray">{$t('components.settings.customize_lms.enabled')}</span>
          {/snippet}
        </Toggle>
      </div>

      <div>
        <p>{$t('components.settings.customize_lms.course.grading')}</p>
        <Toggle size="sm" class="mb-3" bind:toggled={$currentOrg.customization.course.grading}>
          {#snippet labelA()}
            <span style="color: gray">{$t('components.settings.customize_lms.disabled')}</span>
          {/snippet}
          {#snippet labelB()}
            <span style="color: gray">{$t('components.settings.customize_lms.enabled')}</span>
          {/snippet}
        </Toggle>
      </div>
    </Column>
  </Row>

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('components.settings.customize_lms.apps.title')}</SectionTitle></Column
    >
    <Column sm={8} md={8} lg={8} class="mt-4 lg:mt-0">
      <div>
        <p>{$t('components.settings.customize_lms.apps.poll')}</p>
        <Toggle size="sm" class="mb-3" bind:toggled={$currentOrg.customization.apps.poll}>
          {#snippet labelA()}
            <span style="color: gray">{$t('components.settings.customize_lms.disabled')}</span>
          {/snippet}
          {#snippet labelB()}
            <span style="color: gray">{$t('components.settings.customize_lms.enabled')}</span>
          {/snippet}
        </Toggle>
      </div>
      <div>
        <p>{$t('components.settings.customize_lms.apps.live_comment')}</p>
        <Toggle size="sm" class="mb-3" bind:toggled={$currentOrg.customization.apps.comments}>
          {#snippet labelA()}
            <span style="color: gray">{$t('components.settings.customize_lms.disabled')}</span>
          {/snippet}
          {#snippet labelB()}
            <span style="color: gray">{$t('components.settings.customize_lms.enabled')}</span>
          {/snippet}
        </Toggle>
      </div>
    </Column>
  </Row>

  <div class="sticky bottom-12 z-[120] float-right mr-2 hidden md:block">
    <PrimaryButton
      label={$t('components.settings.customize_lms.save')}
      onClick={handleSave}
      isLoading={isSaving}
      isDisabled={isSaving}
    />
  </div>
</Grid>

<div class="absolute bottom-8 right-6 z-[120] block md:hidden">
  <PrimaryButton onClick={handleSave} isLoading={isSaving} isDisabled={isSaving}>
    <Save size={24} class="" />
  </PrimaryButton>
</div>
