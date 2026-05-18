<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import * as Accordion from '@cio/ui/base/accordion';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import * as Select from '@cio/ui/base/select';
  import { Switch } from '@cio/ui/base/switch';
  import { Textarea } from '@cio/ui/base/textarea';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import FooterSocialIcon from '@cio/ui/custom/org-landing-page/footer-social-icon.svelte';
  import { FOOTER_SOCIAL_PLATFORMS } from '@cio/ui/custom/org-landing-page/footer-social-platform';
  import type { FooterSocialPlatform, OrgLandingPageJson } from '$lib/utils/types/org';
  import ButtonLinkFields from './button-link-fields.svelte';

  const MAX_COLUMNS = 6;
  const MAX_LINKS_PER_COLUMN = 10;

  interface Props {
    settings: OrgLandingPageJson;
    markDirty: () => void;
  }

  let { settings = $bindable(), markDirty }: Props = $props();

  let openSections = $state(['brand']);

  function setter(value: unknown, setterKey: string) {
    if (typeof value === 'undefined') {
      return;
    }

    const nextSettings = cloneDeep(settings);
    set(nextSettings, setterKey, value);
    settings = nextSettings;
    markDirty();
  }

  function platformTranslationKey(platform: FooterSocialPlatform): string {
    const key = platform === 'x' ? 'x' : platform;
    return `settings.landing_page.editor.footer.brand.platforms.${key}`;
  }

  function addSocial() {
    const nextSettings = cloneDeep(settings);
    nextSettings.footer.brand.socials.push({
      platform: 'linkedin',
      href: 'https://'
    });
    settings = nextSettings;
    markDirty();
  }

  function removeSocial(index: number) {
    settings = {
      ...settings,
      footer: {
        ...settings.footer,
        brand: {
          ...settings.footer.brand,
          socials: settings.footer.brand.socials.filter((_, socialIndex) => socialIndex !== index)
        }
      }
    };
    markDirty();
  }

  function addColumn() {
    const nextSettings = cloneDeep(settings);
    nextSettings.footer.columns.push({
      id: crypto.randomUUID(),
      heading: '',
      links: [
        {
          id: crypto.randomUUID(),
          label: t.get('settings.landing_page.editor.footer.default_label'),
          href: '#'
        }
      ]
    });
    settings = nextSettings;
    markDirty();
  }

  function removeColumn(columnIndex: number) {
    settings = {
      ...settings,
      footer: {
        ...settings.footer,
        columns: settings.footer.columns.filter((_, index) => index !== columnIndex)
      }
    };
    markDirty();
  }

  function addColumnLink(columnIndex: number) {
    const nextSettings = cloneDeep(settings);
    const column = nextSettings.footer.columns[columnIndex];
    if (!column || column.links.length >= MAX_LINKS_PER_COLUMN) {
      return;
    }

    column.links.push({
      id: crypto.randomUUID(),
      label: t.get('settings.landing_page.editor.footer.default_label'),
      href: '#'
    });
    settings = nextSettings;
    markDirty();
  }

  function removeColumnLink(columnIndex: number, linkIndex: number) {
    const nextSettings = cloneDeep(settings);
    const column = nextSettings.footer.columns[columnIndex];
    if (!column || column.links.length <= 1) {
      return;
    }

    column.links = column.links.filter((_, index) => index !== linkIndex);
    settings = nextSettings;
    markDirty();
  }

  function setColumnCtaEnabled(columnIndex: number, enabled: boolean) {
    const nextSettings = cloneDeep(settings);
    const column = nextSettings.footer.columns[columnIndex];
    if (!column) {
      return;
    }

    if (enabled) {
      column.cta = {
        label: t.get('settings.landing_page.editor.footer.columns.cta_default_label'),
        href: '#'
      };
    } else {
      delete column.cta;
    }

    settings = nextSettings;
    markDirty();
  }

  function addBottomLink() {
    const nextSettings = cloneDeep(settings);
    nextSettings.footer.bottom ??= { text: '', links: [] };
    nextSettings.footer.bottom.links.push({
      id: crypto.randomUUID(),
      label: t.get('settings.landing_page.editor.footer.default_label'),
      href: '#'
    });
    settings = nextSettings;
    markDirty();
  }

  function removeBottomLink(linkIndex: number) {
    const nextSettings = cloneDeep(settings);
    nextSettings.footer.bottom ??= { text: '', links: [] };
    nextSettings.footer.bottom.links = nextSettings.footer.bottom.links.filter((_, index) => index !== linkIndex);
    settings = nextSettings;
    markDirty();
  }

  const bottomLinks = $derived(settings.footer.bottom?.links ?? []);
</script>

<Accordion.Root
  type="multiple"
  bind:value={openSections}
  class="border-border divide-border divide-y rounded-lg border"
>
  <!-- Brand -->
  <Accordion.Item value="brand" class="border-none px-4 last:border-none">
    <Accordion.Trigger class="hover:no-underline">
      {$t('settings.landing_page.editor.footer.brand.legend')}
    </Accordion.Trigger>
    <Accordion.Content>
      <div class="space-y-4 pb-2">
        <div class="flex items-center gap-2.5 text-sm">
          {#if $currentOrg.avatarUrl}
            <img src={$currentOrg.avatarUrl} alt="" class="size-7 rounded object-cover" />
          {/if}
          <span class="font-medium">{$currentOrg.name}</span>
        </div>

        <Field.Field>
          <Field.Label>{$t('settings.landing_page.editor.footer.brand.tagline')}</Field.Label>
          <Input
            value={settings.footer.brand.tagline ?? ''}
            placeholder={$t('settings.landing_page.editor.footer.brand.tagline_placeholder')}
            oninput={(event) => setter(event.currentTarget.value || undefined, 'footer.brand.tagline')}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('settings.landing_page.editor.footer.brand.copyright')}</Field.Label>
          <Input
            value={settings.footer.brand.copyright ?? ''}
            placeholder={$t('settings.landing_page.editor.footer.brand.copyright_placeholder')}
            oninput={(event) => setter(event.currentTarget.value || undefined, 'footer.brand.copyright')}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('settings.landing_page.editor.footer.brand.social_label')}</Field.Label>
          <div class="space-y-2">
            {#each settings.footer.brand.socials as social, socialIndex (socialIndex)}
              <div class="flex items-center gap-2">
                <Select.Root
                  type="single"
                  value={social.platform}
                  onValueChange={(value) => {
                    if (value) {
                      setter(value as FooterSocialPlatform, `footer.brand.socials.${socialIndex}.platform`);
                    }
                  }}
                >
                  <Select.Trigger class="w-36 shrink-0">
                    <span class="flex items-center gap-1.5">
                      <FooterSocialIcon platform={social.platform} class="size-3.5" />
                      {$t(platformTranslationKey(social.platform))}
                    </span>
                  </Select.Trigger>
                  <Select.Content>
                    {#each FOOTER_SOCIAL_PLATFORMS as platformOption (platformOption)}
                      <Select.Item value={platformOption}>
                        <span class="flex items-center gap-2">
                          <FooterSocialIcon platform={platformOption} class="size-4" />
                          {$t(platformTranslationKey(platformOption))}
                        </span>
                      </Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>

                <Input
                  value={social.href}
                  placeholder="https://"
                  class="flex-1"
                  oninput={(event) => setter(event.currentTarget.value, `footer.brand.socials.${socialIndex}.href`)}
                />

                <IconButton
                  aria-label={$t('settings.landing_page.editor.footer.brand.remove_social')}
                  onclick={() => removeSocial(socialIndex)}
                >
                  <TrashIcon size={14} />
                </IconButton>
              </div>
            {/each}

            <Button type="button" variant="outline" size="sm" onclick={addSocial}>
              {$t('settings.landing_page.editor.footer.brand.add_social')}
            </Button>
          </div>
        </Field.Field>
      </div>
    </Accordion.Content>
  </Accordion.Item>

  <!-- Link columns -->
  <Accordion.Item value="columns" class="border-none px-4 last:border-none">
    <Accordion.Trigger class="hover:no-underline">
      {$t('settings.landing_page.editor.footer.columns.legend')}
      {#if settings.footer.columns.length > 0}
        <span class="ui:text-muted-foreground ml-1 text-xs font-normal">({settings.footer.columns.length})</span>
      {/if}
    </Accordion.Trigger>
    <Accordion.Content>
      <div class="space-y-3 pb-2">
        {#if settings.footer.columns.length === 0}
          <p class="ui:text-muted-foreground text-sm">{$t('settings.landing_page.editor.footer.columns.empty_hint')}</p>
        {/if}

        {#each settings.footer.columns as column, columnIndex (column.id)}
          <div class="border-border rounded-md border bg-white p-3 dark:bg-transparent">
            <div class="mb-3 flex items-center justify-between gap-2">
              <Input
                value={column.heading}
                placeholder={$t('settings.landing_page.editor.footer.columns.heading_placeholder')}
                class="h-8 text-sm font-medium"
                oninput={(event) => setter(event.currentTarget.value, `footer.columns.${columnIndex}.heading`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive shrink-0"
                onclick={() => removeColumn(columnIndex)}
              >
                <TrashIcon size={14} />
              </Button>
            </div>

            <div class="space-y-2">
              {#each column.links as columnLink, linkIndex (linkIndex)}
                <div class="flex items-center gap-2">
                  <Input
                    value={columnLink.label}
                    placeholder={$t('settings.landing_page.editor.footer.link_label')}
                    class="h-7 flex-1 text-xs"
                    oninput={(event) =>
                      setter(event.currentTarget.value, `footer.columns.${columnIndex}.links.${linkIndex}.label`)}
                  />
                  <Input
                    value={columnLink.href}
                    placeholder="#"
                    class="h-7 flex-1 text-xs"
                    oninput={(event) =>
                      setter(event.currentTarget.value, `footer.columns.${columnIndex}.links.${linkIndex}.href`)}
                  />
                  {#if column.links.length > 1}
                    <IconButton
                      aria-label={$t('settings.landing_page.editor.footer.columns.remove_link')}
                      onclick={() => removeColumnLink(columnIndex, linkIndex)}
                    >
                      <TrashIcon size={12} />
                    </IconButton>
                  {/if}
                </div>
              {/each}
            </div>

            <div class="mt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-7 text-xs"
                onclick={() => addColumnLink(columnIndex)}
                disabled={column.links.length >= MAX_LINKS_PER_COLUMN}
              >
                + {$t('settings.landing_page.editor.footer.columns.add_link')}
              </Button>

              <Field.Field orientation="horizontal" class="gap-1.5">
                <Switch
                  checked={Boolean(column.cta)}
                  onCheckedChange={(checked) => setColumnCtaEnabled(columnIndex, checked === true)}
                />
                <Field.Label class="text-xs">{$t('settings.landing_page.editor.footer.columns.cta_toggle')}</Field.Label
                >
              </Field.Field>
            </div>

            {#if column.cta}
              <div class="border-border mt-2 flex items-center gap-2 border-t pt-2">
                <Input
                  value={column.cta.label}
                  placeholder={$t('settings.landing_page.editor.footer.columns.cta_label')}
                  class="h-7 flex-1 text-xs"
                  oninput={(event) => setter(event.currentTarget.value, `footer.columns.${columnIndex}.cta.label`)}
                />
                <Input
                  value={column.cta.href}
                  placeholder="#"
                  class="h-7 flex-1 text-xs"
                  oninput={(event) => setter(event.currentTarget.value, `footer.columns.${columnIndex}.cta.href`)}
                />
              </div>
            {/if}
          </div>
        {/each}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onclick={addColumn}
          disabled={settings.footer.columns.length >= MAX_COLUMNS}
        >
          {$t('settings.landing_page.editor.footer.columns.add')}
        </Button>
      </div>
    </Accordion.Content>
  </Accordion.Item>

  <!-- Bottom bar -->
  <Accordion.Item value="bottom" class="border-none px-4 last:border-none">
    <Accordion.Trigger class="hover:no-underline">
      {$t('settings.landing_page.editor.footer.bottom.legend')}
    </Accordion.Trigger>
    <Accordion.Content>
      <div class="space-y-4 pb-2">
        <Field.Field>
          <Field.Label>{$t('settings.landing_page.editor.footer.text')}</Field.Label>
          <Textarea
            value={settings.footer.bottom?.text ?? ''}
            class="ui:[field-sizing:fixed] ui:min-w-0 ui:w-full ui:max-w-full ui:box-border ui:resize-y"
            oninput={(event) => {
              const nextSettings = cloneDeep(settings);
              nextSettings.footer.bottom ??= { text: '', links: [] };
              nextSettings.footer.bottom.text = event.currentTarget.value;
              settings = nextSettings;
              markDirty();
            }}
          />
        </Field.Field>

        <div class="space-y-2">
          {#each bottomLinks as bottomLink, bottomLinkIndex (bottomLinkIndex)}
            <div class="flex items-center gap-2">
              <Input
                value={bottomLink.label}
                placeholder={$t('settings.landing_page.editor.footer.link_label')}
                class="h-8 flex-1 text-sm"
                oninput={(event) => setter(event.currentTarget.value, `footer.bottom.links.${bottomLinkIndex}.label`)}
              />
              <Input
                value={bottomLink.href}
                placeholder="#"
                class="h-8 flex-1 text-sm"
                oninput={(event) => setter(event.currentTarget.value, `footer.bottom.links.${bottomLinkIndex}.href`)}
              />
              <IconButton
                aria-label={$t('settings.landing_page.editor.footer.remove')}
                onclick={() => removeBottomLink(bottomLinkIndex)}
              >
                <TrashIcon size={14} />
              </IconButton>
            </div>
          {/each}

          <Button type="button" variant="outline" size="sm" onclick={addBottomLink}>
            {$t('settings.landing_page.editor.footer.bottom.add_link')}
          </Button>
        </div>
      </div>
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
