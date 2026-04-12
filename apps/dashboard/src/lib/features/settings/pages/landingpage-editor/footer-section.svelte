<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Textarea } from '@cio/ui/base/textarea';
  import type { OrgLandingPageJson } from '$lib/utils/types/org';
  import ButtonLinkFields from './button-link-fields.svelte';

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

  function addFooterLink() {
    settings = {
      ...settings,
      footerLinks: [
        ...settings.footerLinks,
        {
          label: t.get('settings.landing_page.editor.footer.default_label'),
          href: '#'
        }
      ]
    };
    markDirty();
  }

  function removeFooterLink(index: number) {
    settings = {
      ...settings,
      footerLinks: settings.footerLinks.filter((_, linkIndex) => linkIndex !== index)
    };
    markDirty();
  }
</script>

<Field.Group class="space-y-6">
  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.editor.sections.footer')}</Field.Legend>

    <div class="space-y-4">
      <Field.Field class="mb-6">
        <Field.Label>{$t('settings.landing_page.editor.footer.text')}</Field.Label>
        <Textarea
          value={settings.footerText}
          oninput={(event) => {
            settings = {
              ...settings,
              footerText: event.currentTarget.value
            };
            markDirty();
          }}
        />
      </Field.Field>

      <div class="space-y-4">
        {#each settings.footerLinks as footerLink, index (index)}
          <ButtonLinkFields
            label={footerLink.label}
            href={footerLink.href}
            labelFieldLabel={$t('settings.landing_page.editor.footer.link_label')}
            hrefFieldLabel={$t('settings.landing_page.editor.footer.link_href')}
            className="group ui:border-border relative space-y-3 border-b pb-5"
            removeAriaLabel={$t('settings.landing_page.editor.footer.remove')}
            onLabelInput={(value) => setter(value, `footerLinks.${index}.label`)}
            onHrefInput={(value) => setter(value, `footerLinks.${index}.href`)}
            onRemove={() => removeFooterLink(index)}
          />
        {/each}

        <Button type="button" variant="outline" onclick={addFooterLink}>
          {$t('settings.landing_page.editor.footer.add')}
        </Button>
      </div>
    </div>
  </Field.Set>
</Field.Group>
