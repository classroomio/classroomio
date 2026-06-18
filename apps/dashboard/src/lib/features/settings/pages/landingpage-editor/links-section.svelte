<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import * as Select from '@cio/ui/base/select';
  import { Switch } from '@cio/ui/base/switch';
  import { Textarea } from '@cio/ui/base/textarea';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { landingPageLinkIconMap } from '@cio/ui/custom/org-landing-page/landing-page-link-icons';
  import type { OrgLandingPageJson, OrgLandingPageLinkIcon } from '$lib/utils/types/org';

  const LINK_ICONS: OrgLandingPageLinkIcon[] = [
    'help-circle',
    'life-buoy',
    'book-open',
    'video',
    'users',
    'message-circle',
    'newspaper',
    'rocket',
    'calendar',
    'mail'
  ];

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

  function iconLabel(icon: OrgLandingPageLinkIcon) {
    return t.get(`settings.landing_page.editor.links.icons.${icon.replace(/-/g, '_')}`);
  }

  function ensureLinks(): NonNullable<OrgLandingPageJson['links']> {
    if (settings.links) {
      return settings.links;
    }

    const links: NonNullable<OrgLandingPageJson['links']> = {
      heading: t.get('settings.landing_page.editor.links.heading_default'),
      description: '',
      boldVisitLabel: t.get('settings.landing_page.editor.links.bold_visit_default'),
      classicLearnMoreLabel: t.get('settings.landing_page.editor.links.classic_learn_more_default'),
      cards: [
        {
          icon: 'help-circle',
          title: t.get('settings.landing_page.editor.links.card_placeholder_help'),
          description: '',
          href: 'https://'
        },
        {
          icon: 'video',
          title: t.get('settings.landing_page.editor.links.card_placeholder_webinars'),
          description: '',
          href: 'https://'
        },
        {
          icon: 'users',
          title: t.get('settings.landing_page.editor.links.card_placeholder_community'),
          description: '',
          href: 'https://'
        }
      ]
    };

    settings = {
      ...settings,
      links
    };
    markDirty();

    return links;
  }

  function setLinksEnabled(enabled: boolean) {
    if (!enabled) {
      settings = {
        ...settings,
        links: undefined
      };
      markDirty();
      return;
    }

    ensureLinks();
  }

  function addCard() {
    if (!settings.links || settings.links.cards.length >= 3) {
      return;
    }

    const nextSettings = cloneDeep(settings);
    nextSettings.links!.cards.push({
      icon: 'book-open',
      title: t.get('settings.landing_page.editor.navigation.default_label'),
      description: '',
      href: 'https://'
    });
    settings = nextSettings;
    markDirty();
  }

  function removeCard(index: number) {
    if (!settings.links || settings.links.cards.length <= 1) {
      return;
    }

    const nextSettings = cloneDeep(settings);
    nextSettings.links!.cards = nextSettings.links!.cards.filter((_, cardIndex) => cardIndex !== index);
    settings = nextSettings;
    markDirty();
  }
</script>

<Field.Group class="space-y-6">
  <Field.Set>
    <Field.Legend>{$t('settings.landing_page.editor.sections.links')}</Field.Legend>
    <Field.Description>{$t('settings.landing_page.editor.sections.links_desc')}</Field.Description>

    <div class="space-y-6">
      <Field.Field orientation="horizontal">
        <Switch checked={Boolean(settings.links)} onCheckedChange={(checked) => setLinksEnabled(checked === true)} />
        <Field.Label>{$t('settings.landing_page.editor.links.toggle')}</Field.Label>
      </Field.Field>

      {#if settings.links}
        <Field.Field>
          <Field.Label>{$t('settings.landing_page.editor.links.heading')}</Field.Label>
          <Input
            value={settings.links.heading}
            placeholder={$t('settings.landing_page.editor.links.heading_placeholder')}
            oninput={(event) => setter(event.currentTarget.value, 'links.heading')}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('settings.landing_page.editor.links.description')}</Field.Label>
          <Textarea
            class="ui:[field-sizing:fixed] ui:min-w-0 ui:w-full ui:max-w-full ui:box-border ui:resize-y"
            value={settings.links.description ?? ''}
            placeholder={$t('settings.landing_page.editor.links.description_placeholder')}
            oninput={(event) => setter(event.currentTarget.value, 'links.description')}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('settings.landing_page.editor.links.bold_visit_label')}</Field.Label>
          <Input
            value={settings.links.boldVisitLabel ?? ''}
            placeholder={$t('settings.landing_page.editor.links.bold_visit_default')}
            oninput={(event) => setter(event.currentTarget.value, 'links.boldVisitLabel')}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('settings.landing_page.editor.links.classic_learn_more_label')}</Field.Label>
          <Input
            value={settings.links.classicLearnMoreLabel ?? ''}
            placeholder={$t('settings.landing_page.editor.links.classic_learn_more_default')}
            oninput={(event) => setter(event.currentTarget.value, 'links.classicLearnMoreLabel')}
          />
        </Field.Field>

        {#each settings.links.cards as card, index (index)}
          <div class="group ui:border-border relative space-y-3 border-b pb-5">
            {#if settings.links.cards.length > 1}
              <IconButton
                class="absolute! -top-3! right-2!"
                aria-label={$t('settings.landing_page.editor.links.remove_card')}
                onclick={() => removeCard(index)}
              >
                <TrashIcon size={16} />
              </IconButton>
            {/if}

            <Field.Field>
              <Field.Label>{$t('settings.landing_page.editor.links.card_icon')}</Field.Label>
              <Select.Root
                type="single"
                value={card.icon}
                onValueChange={(value) => {
                  if (value) {
                    setter(value, `links.cards.${index}.icon`);
                  }
                }}
              >
                <Select.Trigger class="w-full">
                  {@const PreviewIcon = landingPageLinkIconMap[card.icon]}
                  <span class="flex items-center gap-2">
                    <PreviewIcon class="size-4" />
                    {iconLabel(card.icon)}
                  </span>
                </Select.Trigger>
                <Select.Content style="z-index: 260">
                  {#each LINK_ICONS as iconOption (iconOption)}
                    {@const OptionIcon = landingPageLinkIconMap[iconOption]}
                    <Select.Item value={iconOption}>
                      <span class="flex items-center gap-2">
                        <OptionIcon class="size-4" />
                        {iconLabel(iconOption)}
                      </span>
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </Field.Field>

            <Field.Field>
              <Field.Label>{$t('settings.landing_page.editor.links.card_title')}</Field.Label>
              <Input
                value={card.title}
                placeholder={$t('settings.landing_page.editor.links.card_title_placeholder')}
                oninput={(event) => setter(event.currentTarget.value, `links.cards.${index}.title`)}
              />
            </Field.Field>

            <Field.Field>
              <Field.Label>{$t('settings.landing_page.editor.links.card_description')}</Field.Label>
              <Textarea
                class="ui:[field-sizing:fixed] ui:min-w-0 ui:w-full ui:max-w-full ui:box-border ui:resize-y"
                value={card.description}
                placeholder={$t('settings.landing_page.editor.links.card_description_placeholder')}
                oninput={(event) => setter(event.currentTarget.value, `links.cards.${index}.description`)}
              />
            </Field.Field>

            <Field.Field>
              <Field.Label>{$t('settings.landing_page.editor.links.card_href')}</Field.Label>
              <Input
                value={card.href}
                placeholder={$t('settings.landing_page.editor.links.card_href_placeholder')}
                oninput={(event) => setter(event.currentTarget.value, `links.cards.${index}.href`)}
              />
            </Field.Field>
          </div>
        {/each}

        <Button type="button" variant="outline" onclick={addCard} disabled={settings.links.cards.length >= 3}>
          {$t('settings.landing_page.editor.links.add_card')}
        </Button>
        {#if settings.links.cards.length >= 3}
          <p class="text-muted-foreground text-xs">{$t('settings.landing_page.editor.links.max_reached')}</p>
        {/if}
      {/if}
    </div>
  </Field.Set>
</Field.Group>
