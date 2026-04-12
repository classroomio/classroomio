<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import { t } from '$lib/utils/functions/translations';
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import { Textarea } from '@cio/ui/base/textarea';
  import type { OrgLandingPageEmbed, OrgLandingPageJson } from '$lib/utils/types/org';
  import ButtonLinkFields from './button-link-fields.svelte';
  import { Input } from '@cio/ui/base/input';

  interface Props {
    settings: OrgLandingPageJson;
    markDirty: () => void;
  }

  let { settings = $bindable(), markDirty }: Props = $props();

  function setter(value: unknown, setterKey: string) {
    if (typeof value === 'undefined') {
      return;
    }

    const nextSettings = cloneDeep(settings);
    set(nextSettings, setterKey, value);
    settings = nextSettings;
    markDirty();
  }

  function ensureEmbed(): OrgLandingPageEmbed {
    if (settings.embed) {
      return settings.embed;
    }

    const embed = {
      title: t.get('settings.landing_page.editor.embed.title'),
      description: '',
      code: '',
      secondaryAction: undefined
    };

    settings = {
      ...settings,
      embed
    };
    markDirty();

    return embed;
  }

  function setEmbedEnabled(enabled: boolean) {
    if (!enabled) {
      settings = {
        ...settings,
        embed: undefined
      };
      markDirty();
      return;
    }

    setter(ensureEmbed(), 'embed');
  }

  function updateSecondaryAction(label: string, href: string) {
    if (!settings.embed) {
      return;
    }

    setter(
      {
        label,
        href
      },
      'embed.secondaryAction'
    );
  }
</script>

<Field.Group class="space-y-6">
  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.editor.sections.embed')}</Field.Legend>

    <div class="space-y-6">
      <Field.Field orientation="horizontal">
        <Switch checked={Boolean(settings.embed)} onCheckedChange={(checked) => setEmbedEnabled(checked === true)} />
        <Field.Label>{$t('settings.landing_page.editor.embed.toggle')}</Field.Label>
      </Field.Field>

      {#if settings.embed}
        <Field.Field>
          <Field.Label>{$t('settings.landing_page.editor.embed.title')}</Field.Label>
          <Input
            value={settings.embed.title}
            placeholder={$t('settings.landing_page.editor.embed.title_placeholder')}
            oninput={(event) => setter(event.currentTarget.value, 'embed.title')}
          />
        </Field.Field>

        <Field.Field class="min-w-0">
          <Field.Label>{$t('settings.landing_page.editor.embed.description')}</Field.Label>
          <Textarea
            class="ui:[field-sizing:fixed] ui:min-w-0 ui:w-full ui:max-w-full ui:box-border ui:resize-y"
            value={settings.embed.description ?? ''}
            placeholder={$t('settings.landing_page.editor.embed.description_placeholder')}
            oninput={(event) => setter(event.currentTarget.value, 'embed.description')}
          />
        </Field.Field>

        <Field.Field class="min-w-0">
          <Field.Label>{$t('settings.landing_page.editor.embed.code')}</Field.Label>
          <Field.Description>{$t('settings.landing_page.editor.embed.code_description')}</Field.Description>
          <Textarea
            class="ui:[field-sizing:fixed] ui:min-w-0 ui:w-full ui:max-w-full ui:box-border ui:resize-y"
            value={settings.embed.code}
            placeholder={$t('settings.landing_page.editor.embed.code_placeholder')}
            oninput={(event) => setter(event.currentTarget.value, 'embed.code')}
          />
        </Field.Field>

        <ButtonLinkFields
          label={settings.embed.secondaryAction?.label ?? ''}
          href={settings.embed.secondaryAction?.href ?? ''}
          labelFieldLabel={$t('settings.landing_page.editor.embed.secondary_label')}
          hrefFieldLabel={$t('settings.landing_page.editor.embed.secondary_href')}
          labelPlaceholder={$t('settings.landing_page.editor.embed.secondary_label')}
          hrefPlaceholder={$t('settings.landing_page.editor.embed.secondary_href')}
          onLabelInput={(value) => updateSecondaryAction(value, settings.embed.secondaryAction?.href ?? '')}
          onHrefInput={(value) => updateSecondaryAction(settings.embed.secondaryAction?.label ?? '', value)}
        />
      {/if}
    </div>
  </Field.Set>
</Field.Group>
