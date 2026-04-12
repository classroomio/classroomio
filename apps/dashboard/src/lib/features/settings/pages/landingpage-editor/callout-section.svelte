<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import { t } from '$lib/utils/functions/translations';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Switch } from '@cio/ui/base/switch';
  import { Textarea } from '@cio/ui/base/textarea';
  import type { OrgLandingPageCallout, OrgLandingPageJson } from '$lib/utils/types/org';

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

  function ensureCallout(): OrgLandingPageCallout {
    if (settings.callout) {
      return settings.callout;
    }

    const callout: OrgLandingPageCallout = {
      heading: t.get('settings.landing_page.editor.callout.heading_default'),
      description: '',
      action: {
        label: t.get('settings.landing_page.editor.callout.action_label_default'),
        href: '#'
      }
    };

    settings = {
      ...settings,
      callout
    };
    markDirty();

    return callout;
  }

  function setCalloutEnabled(enabled: boolean) {
    if (!enabled) {
      settings = {
        ...settings,
        callout: undefined
      };
      markDirty();
      return;
    }

    setter(ensureCallout(), 'callout');
  }
</script>

<Field.Group class="space-y-6">
  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.editor.sections.callout')}</Field.Legend>

    <div class="space-y-6">
      <Field.Field orientation="horizontal">
        <Switch
          checked={Boolean(settings.callout)}
          onCheckedChange={(checked) => setCalloutEnabled(checked === true)}
        />
        <Field.Label>{$t('settings.landing_page.editor.callout.toggle')}</Field.Label>
      </Field.Field>

      {#if settings.callout}
        <Field.Field>
          <Field.Label>{$t('settings.landing_page.editor.callout.heading')}</Field.Label>
          <Input
            value={settings.callout.heading}
            placeholder={$t('settings.landing_page.editor.callout.heading_placeholder')}
            oninput={(event) => setter(event.currentTarget.value, 'callout.heading')}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('settings.landing_page.editor.callout.description')}</Field.Label>
          <Textarea
            class="ui:[field-sizing:fixed] ui:min-w-0 ui:w-full ui:max-w-full ui:box-border ui:resize-y"
            value={settings.callout.description}
            placeholder={$t('settings.landing_page.editor.callout.description_placeholder')}
            oninput={(event) => setter(event.currentTarget.value, 'callout.description')}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('settings.landing_page.editor.callout.action_label')}</Field.Label>
          <Input
            value={settings.callout.action.label}
            placeholder={$t('settings.landing_page.editor.callout.action_label_placeholder')}
            oninput={(event) => setter(event.currentTarget.value, 'callout.action.label')}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('settings.landing_page.editor.callout.action_href')}</Field.Label>
          <Input
            value={settings.callout.action.href}
            placeholder={$t('settings.landing_page.editor.callout.action_href_placeholder')}
            oninput={(event) => setter(event.currentTarget.value, 'callout.action.href')}
          />
        </Field.Field>
      {/if}
    </div>
  </Field.Set>
</Field.Group>
