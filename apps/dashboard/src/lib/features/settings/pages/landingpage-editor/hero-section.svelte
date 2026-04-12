<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Switch } from '@cio/ui/base/switch';
  import { Textarea } from '@cio/ui/base/textarea';
  import { UploadWidget } from '$features/ui';
  import { handleOpenWidget } from '$features/ui/course-landing-page/store';
  import type { OrgLandingPageJson } from '$lib/utils/types/org';
  import ButtonLinkFields from './button-link-fields.svelte';

  interface Props {
    settings: OrgLandingPageJson;
    markDirty: () => void;
  }

  let { settings = $bindable(), markDirty }: Props = $props();

  let activeWidget = $state<'hero-image' | ''>('');

  function setter(value: unknown, setterKey: string) {
    if (typeof value === 'undefined') {
      return;
    }

    const nextSettings = cloneDeep(settings);
    set(nextSettings, setterKey, value);
    settings = nextSettings;
    markDirty();
  }

  function toggleSecondaryAction(enabled: boolean) {
    if (!enabled) {
      settings = {
        ...settings,
        hero: {
          ...settings.hero,
          secondaryAction: undefined
        }
      };
      markDirty();
      return;
    }

    setter(
      settings.hero.secondaryAction ?? {
        label: t.get('settings.landing_page.editor.hero.secondary_label'),
        href: '/courses'
      },
      'hero.secondaryAction'
    );
  }
</script>

<Field.Group class="space-y-6">
  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.editor.sections.hero')}</Field.Legend>

    <div class="space-y-4">
      <Field.Field>
        <Field.Label>{$t('settings.landing_page.editor.hero.heading')}</Field.Label>
        <Input value={settings.hero.heading} oninput={(event) => setter(event.currentTarget.value, 'hero.heading')} />
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('settings.landing_page.editor.hero.subheading')}</Field.Label>
        <Textarea
          value={settings.hero.subheading}
          oninput={(event) => setter(event.currentTarget.value, 'hero.subheading')}
        />
      </Field.Field>

      <ButtonLinkFields
        label={settings.hero.primaryAction.label}
        href={settings.hero.primaryAction.href}
        labelFieldLabel={$t('settings.landing_page.editor.hero.primary_label')}
        hrefFieldLabel={$t('settings.landing_page.editor.hero.primary_href')}
        labelPlaceholder={$t('settings.landing_page.editor.hero.primary_label')}
        hrefPlaceholder={$t('settings.landing_page.editor.hero.primary_href')}
        onLabelInput={(value) => setter(value, 'hero.primaryAction.label')}
        onHrefInput={(value) => setter(value, 'hero.primaryAction.href')}
      />

      <Field.Field orientation="horizontal">
        <Switch
          checked={Boolean(settings.hero.secondaryAction)}
          onCheckedChange={(checked) => toggleSecondaryAction(checked === true)}
        />
        <Field.Label>{$t('settings.landing_page.editor.hero.secondary_toggle')}</Field.Label>
      </Field.Field>

      {#if settings.hero.secondaryAction}
        <ButtonLinkFields
          label={settings.hero.secondaryAction.label}
          href={settings.hero.secondaryAction.href}
          labelFieldLabel={$t('settings.landing_page.editor.hero.secondary_label')}
          hrefFieldLabel={$t('settings.landing_page.editor.hero.secondary_href')}
          labelPlaceholder={$t('settings.landing_page.editor.hero.secondary_label')}
          hrefPlaceholder={$t('settings.landing_page.editor.hero.secondary_href')}
          onLabelInput={(value) => setter(value, 'hero.secondaryAction.label')}
          onHrefInput={(value) => setter(value, 'hero.secondaryAction.href')}
        />
      {/if}

      <Field.Field>
        <Field.Label>{$t('settings.landing_page.editor.hero.image')}</Field.Label>
        {#if settings.hero.image}
          <img src={settings.hero.image} alt="" class="border-border/60 mb-3 w-full rounded-lg border object-cover" />
        {/if}

        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onclick={() => {
              activeWidget = 'hero-image';
              $handleOpenWidget.open = true;
            }}
          >
            {$t('settings.landing_page.editor.hero.upload')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onclick={() => {
              setter('', 'hero.image');
            }}
          >
            {$t('settings.landing_page.editor.hero.clear')}
          </Button>
        </div>

        {#if $handleOpenWidget.open && activeWidget === 'hero-image'}
          <UploadWidget
            imageURL={settings.hero.image}
            onchange={(imageUrl) => {
              setter(imageUrl, 'hero.image');
              $handleOpenWidget.open = false;
            }}
          />
        {/if}
      </Field.Field>
    </div>
  </Field.Set>
</Field.Group>
