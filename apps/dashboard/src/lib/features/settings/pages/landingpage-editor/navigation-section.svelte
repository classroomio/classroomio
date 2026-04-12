<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
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

  function addNavigationItem() {
    settings = {
      ...settings,
      navItems: [
        ...settings.navItems,
        {
          label: t.get('settings.landing_page.editor.navigation.default_label'),
          href: '#'
        }
      ]
    };
    markDirty();
  }

  function removeNavigationItem(index: number) {
    settings = {
      ...settings,
      navItems: settings.navItems.filter((_, itemIndex) => itemIndex !== index)
    };
    markDirty();
  }
</script>

<div class="space-y-7">
  <Field.Legend>{$t('settings.landing_page.editor.sections.navigation')}</Field.Legend>

  {#each settings.navItems as navItem, index (index)}
    <ButtonLinkFields
      label={navItem.label}
      href={navItem.href}
      labelFieldLabel={$t('settings.landing_page.editor.navigation.link_label')}
      hrefFieldLabel={$t('settings.landing_page.editor.navigation.link_href')}
      className="group ui:border-border relative space-y-3 border-b pb-5"
      removeAriaLabel={$t('settings.landing_page.editor.navigation.remove')}
      onLabelInput={(value) => setter(value, `navItems.${index}.label`)}
      onHrefInput={(value) => setter(value, `navItems.${index}.href`)}
      onRemove={() => removeNavigationItem(index)}
    />
  {/each}
  <Button type="button" variant="outline" onclick={addNavigationItem}>
    {$t('settings.landing_page.editor.navigation.add')}
  </Button>
</div>
