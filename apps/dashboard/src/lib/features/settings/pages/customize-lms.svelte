<script lang="ts">
  import { Switch } from '@cio/ui/base/switch';

  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { orgApi } from '$features/org/api/org.svelte';
  import { handleOpenWidget } from '$features/ui/course-landing-page/store';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';

  import { UploadWidget } from '$features/ui';
  import * as Field from '@cio/ui/base/field';

  let widgetKey = $state('');

  function widgetControl(key: string) {
    widgetKey = key;
    $handleOpenWidget.open = true;
  }

  export async function handleSave() {
    await orgApi.update($currentOrg.id, {
      customization: $currentOrg.customization
    });
  }
</script>

<Field.Group class="w-full max-w-md! px-2">
  <Field.Set>
    <Field.Legend>{$t('components.settings.customize_lms.dashboard.title')}</Field.Legend>
    <Field.Group>
      <Field.Field orientation="horizontal">
        <Field.Label>{$t('components.settings.customize_lms.dashboard.community')}</Field.Label>
        <Switch bind:checked={$currentOrg.customization.dashboard.community} />
        <Field.Description class="text-sm">
          {$currentOrg.customization.dashboard.community
            ? $t('components.settings.customize_lms.enabled')
            : $t('components.settings.customize_lms.disabled')}
        </Field.Description>
      </Field.Field>

      <Field.Field orientation="horizontal">
        <Field.Label>{$t('components.settings.customize_lms.dashboard.exercises')}</Field.Label>
        <Switch bind:checked={$currentOrg.customization.dashboard.exercise} />
        <Field.Description class="text-sm">
          {$currentOrg.customization.dashboard.exercise
            ? $t('components.settings.customize_lms.enabled')
            : $t('components.settings.customize_lms.disabled')}
        </Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('components.settings.customize_lms.dashboard.banner_image')}</Field.Label>
        <Button variant="outline" onclick={() => widgetControl('banner-image')}>
          {$t('components.settings.customize_lms.dashboard.banner_image_btn')}
        </Button>
        {#if $currentOrg.customization.dashboard.bannerImage}
          <img alt="Banner" src={$currentOrg.customization.dashboard.bannerImage} class="mt-2 w-full rounded-md" />
        {/if}
        {#if $handleOpenWidget.open && widgetKey === 'banner-image'}
          <UploadWidget bind:imageURL={$currentOrg.customization.dashboard.bannerImage} />
        {/if}
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('components.settings.customize_lms.dashboard.banner_text')}</Field.Label>
        <Input
          placeholder={$t('components.settings.customize_lms.dashboard.banner_text_placeholder')}
          bind:value={$currentOrg.customization.dashboard.bannerText}
        />
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('components.settings.customize_lms.course.title')}</Field.Legend>
    <Field.Group>
      <Field.Field orientation="horizontal">
        <Field.Label>{$t('components.settings.customize_lms.course.newsfeed')}</Field.Label>
        <Switch bind:checked={$currentOrg.customization.course.newsfeed} />
        <Field.Description class="text-gray-600">
          {$currentOrg.customization.course.newsfeed
            ? $t('components.settings.customize_lms.enabled')
            : $t('components.settings.customize_lms.disabled')}
        </Field.Description>
      </Field.Field>

      <Field.Field orientation="horizontal">
        <Field.Label>{$t('components.settings.customize_lms.course.grading')}</Field.Label>
        <Switch bind:checked={$currentOrg.customization.course.grading} />
        <Field.Description class="text-gray-600">
          {$currentOrg.customization.course.grading
            ? $t('components.settings.customize_lms.enabled')
            : $t('components.settings.customize_lms.disabled')}
        </Field.Description>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('components.settings.customize_lms.apps.title')}</Field.Legend>
    <Field.Group>
      <Field.Field orientation="horizontal">
        <Field.Label>{$t('components.settings.customize_lms.apps.poll')}</Field.Label>
        <Switch bind:checked={$currentOrg.customization.apps.poll} />
        <Field.Description class="text-gray-600">
          {$currentOrg.customization.apps.poll
            ? $t('components.settings.customize_lms.enabled')
            : $t('components.settings.customize_lms.disabled')}
        </Field.Description>
      </Field.Field>
      <Field.Field orientation="horizontal">
        <Field.Label>{$t('components.settings.customize_lms.apps.live_comment')}</Field.Label>
        <Switch bind:checked={$currentOrg.customization.apps.comments} />
        <Field.Description class="text-gray-600">
          {$currentOrg.customization.apps.comments
            ? $t('components.settings.customize_lms.enabled')
            : $t('components.settings.customize_lms.disabled')}
        </Field.Description>
      </Field.Field>
    </Field.Group>
  </Field.Set>
</Field.Group>
