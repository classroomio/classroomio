<script lang="ts">
  import { Label } from '@cio/ui/base/label';
  import { Switch } from '@cio/ui/base/switch';
  import SaveIcon from '@lucide/svelte/icons/save';

  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { Button } from '@cio/ui/base/button';
  import { handleOpenWidget } from '$features/ui/course-landing-page/store';

  import { Row, Grid, Column } from './Layout';
  import SectionTitle from '../SectionTitle.svelte';
  import { InputField } from '@cio/ui/custom/input-field';
  import { UploadWidget } from '$features/ui';

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
      snackbar.error('snackbar.update_failed');
    } else {
      snackbar.success('snackbar.success_update');
    }

    isSaving = false;
  }
</script>

<Grid class="border-c relative mt-5 w-full rounded border-gray-200 dark:border-neutral-600">
  <Row class="border-bottom-c flex flex-col items-start py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}>
      <SectionTitle>{$t('components.settings.customize_lms.dashboard.title')}</SectionTitle>
    </Column>

    <Column sm={8} md={8} lg={8} class="space-y-2">
      <div class="flex flex-col gap-3">
        <p class="text-sm">{$t('components.settings.customize_lms.dashboard.community')}</p>
        <div class="mb-3 flex items-center space-x-2">
          <Switch bind:checked={$currentOrg.customization.dashboard.community} />

          <Label class="text-sm">
            {$currentOrg.customization.dashboard.community
              ? $t('components.settings.customize_lms.enabled')
              : $t('components.settings.customize_lms.disabled')}
          </Label>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <p class="text-sm">{$t('components.settings.customize_lms.dashboard.exercises')}</p>
        <div class="mb-3 flex items-center space-x-2">
          <Switch bind:checked={$currentOrg.customization.dashboard.exercise} />

          <Label class="text-sm">
            {$currentOrg.customization.dashboard.exercise
              ? $t('components.settings.customize_lms.enabled')
              : $t('components.settings.customize_lms.disabled')}
          </Label>
        </div>
      </div>

      <div class="mb-3">
        <p class="text-sm">{$t('components.settings.customize_lms.dashboard.banner_image')}</p>
        <Button variant="outline" class="mt-3" onclick={() => widgetControl('banner-image')}>
          {$t('components.settings.customize_lms.dashboard.banner_image_btn')}
        </Button>
        {#if $currentOrg.customization.dashboard.bannerImage}
          <img alt="Banner" src={$currentOrg.customization.dashboard.bannerImage} class="mt-2 w-full rounded-md" />
        {/if}
        {#if $handleOpenWidget.open && widgetKey === 'banner-image'}
          <UploadWidget bind:imageURL={$currentOrg.customization.dashboard.bannerImage} />
        {/if}
      </div>

      <div>
        <p>{$t('components.settings.customize_lms.dashboard.banner_text')}</p>
        <InputField
          label={$t('components.settings.customize_lms.dashboard.banner_text_label')}
          placeholder={$t('components.settings.customize_lms.dashboard.banner_text_placeholder')}
          bind:value={$currentOrg.customization.dashboard.bannerText}
        />
      </div>
    </Column>
  </Row>

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('components.settings.customize_lms.course.title')}</SectionTitle></Column
    >
    <Column sm={8} md={8} lg={8} class="space-y-4">
      <div class="flex flex-col gap-3">
        <p class="text-sm">{$t('components.settings.customize_lms.course.newsfeed')}</p>
        <div class="flex items-center space-x-2">
          <Switch bind:checked={$currentOrg.customization.course.newsfeed} />

          <Label class="text-gray-600">
            {$currentOrg.customization.course.newsfeed
              ? $t('components.settings.customize_lms.enabled')
              : $t('components.settings.customize_lms.disabled')}
          </Label>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <p class="text-sm">{$t('components.settings.customize_lms.course.grading')}</p>
        <div class="flex items-center space-x-2">
          <Switch bind:checked={$currentOrg.customization.course.grading} />
          <Label class="text-gray-600">
            {$currentOrg.customization.course.grading
              ? $t('components.settings.customize_lms.enabled')
              : $t('components.settings.customize_lms.disabled')}
          </Label>
        </div>
      </div>
    </Column>
  </Row>

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('components.settings.customize_lms.apps.title')}</SectionTitle></Column
    >
    <Column sm={8} md={8} lg={8} class="space-y-4">
      <div class="flex flex-col gap-3">
        <p class="text-sm">{$t('components.settings.customize_lms.apps.poll')}</p>
        <div class="flex items-center space-x-2">
          <Switch bind:checked={$currentOrg.customization.apps.poll} />

          <Label class="text-gray-600">
            {$currentOrg.customization.apps.poll
              ? $t('components.settings.customize_lms.enabled')
              : $t('components.settings.customize_lms.disabled')}
          </Label>
        </div>
      </div>
      <div class="flex flex-col gap-3">
        <p class="text-sm">{$t('components.settings.customize_lms.apps.live_comment')}</p>
        <div class="flex items-center space-x-2">
          <Switch bind:checked={$currentOrg.customization.apps.comments} />

          <Label class="text-gray-600">
            {$currentOrg.customization.apps.comments
              ? $t('components.settings.customize_lms.enabled')
              : $t('components.settings.customize_lms.disabled')}
          </Label>
        </div>
      </div>
    </Column>
  </Row>

  <div class="sticky bottom-12 z-[120] float-right mr-2 hidden md:block">
    <Button onclick={handleSave} loading={isSaving} disabled={isSaving}>
      {$t('components.settings.customize_lms.save')}
    </Button>
  </div>
</Grid>

<div class="z-120 absolute bottom-8 right-6 block md:hidden">
  <Button onclick={handleSave} loading={isSaving} disabled={isSaving}>
    <SaveIcon size={16} />
  </Button>
</div>
