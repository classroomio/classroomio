<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import { t } from '$lib/utils/functions/translations';
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import { Textarea } from '@cio/ui/base/textarea';
  import AIGenerateButton from '$features/agent/components/ai-generate-button.svelte';
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
      enabled: true,
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
    setter({ ...ensureEmbed(), enabled }, 'embed');
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

<Field.Group class="min-w-0 space-y-6 overflow-x-hidden">
  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.editor.sections.embed')}</Field.Legend>

    <div class="space-y-6">
      <Field.Field orientation="horizontal">
        <Switch
          checked={settings.embed?.enabled ?? false}
          onCheckedChange={(checked) => setEmbedEnabled(checked === true)}
        />
        <Field.Label>{$t('settings.landing_page.editor.embed.toggle')}</Field.Label>
      </Field.Field>

      {#if settings.embed?.enabled}
        <div class="pb-5">
          <Field.Field>
            <div class="flex items-center justify-between">
              <Field.Label>{$t('settings.landing_page.editor.embed.title')}</Field.Label>
              <AIGenerateButton
                context="the embed section title on an organization's course platform landing page"
                onInsert={(text) => setter(text, 'embed.title')}
              />
            </div>
            <Input
              value={settings.embed.title}
              placeholder={$t('settings.landing_page.editor.embed.title_placeholder')}
              oninput={(event) => setter(event.currentTarget.value, 'embed.title')}
            />
          </Field.Field>

          <Field.Field class="min-w-0">
            <div class="flex items-center justify-between">
              <Field.Label>{$t('settings.landing_page.editor.embed.description')}</Field.Label>
              <AIGenerateButton
                context="the embed section description on an organization's course platform landing page"
                onInsert={(text) => setter(text, 'embed.description')}
              />
            </div>
            <Textarea
              class="box-border [field-sizing:fixed] w-full max-w-full min-w-0 resize-y overflow-x-auto break-all"
              value={settings.embed.description ?? ''}
              placeholder={$t('settings.landing_page.editor.embed.description_placeholder')}
              oninput={(event) => setter(event.currentTarget.value, 'embed.description')}
            />
          </Field.Field>

          <Field.Field class="min-w-0">
            <Field.Label>{$t('settings.landing_page.editor.embed.code')}</Field.Label>
            <Field.Description>{$t('settings.landing_page.editor.embed.code_description')}</Field.Description>
            <Textarea
              class="box-border [field-sizing:fixed] w-full max-w-full min-w-0 resize-y overflow-x-auto break-all"
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
        </div>
      {/if}
    </div>
  </Field.Set>
</Field.Group>
