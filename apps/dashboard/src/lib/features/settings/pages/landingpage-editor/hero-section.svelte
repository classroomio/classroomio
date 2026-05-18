<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Switch } from '@cio/ui/base/switch';
  import { Textarea } from '@cio/ui/base/textarea';
  import AIGenerateButton from '$features/agent/components/ai-generate-button.svelte';
  import { UploadWidget } from '$features/ui';
  import { handleOpenWidget } from '$features/ui/course-landing-page/store';
  import type { OrgLandingPageHeroStat, OrgLandingPageJson } from '$lib/utils/types/org';
  import ButtonLinkFields from './button-link-fields.svelte';
  import TrashIcon from '@lucide/svelte/icons/trash-2';
  import PlusIcon from '@lucide/svelte/icons/plus';

  interface Props {
    settings: OrgLandingPageJson;
    markDirty: () => void;
  }

  let { settings = $bindable(), markDirty }: Props = $props();

  let activeWidget = $state<'hero-image' | ''>('');

  const MAX_STATS = 4;

  function updateStats(next: OrgLandingPageHeroStat[]) {
    settings = {
      ...settings,
      hero: {
        ...settings.hero,
        stats: next.length > 0 ? next : undefined
      }
    };
    markDirty();
  }

  function addStat() {
    const current = settings.hero.stats ?? [];
    if (current.length >= MAX_STATS) return;
    updateStats([...current, { label: '', value: '' }]);
  }

  function removeStat(index: number) {
    const current = settings.hero.stats ?? [];
    updateStats(current.filter((_, i) => i !== index));
  }

  function updateStatField(index: number, field: 'label' | 'value', nextValue: string) {
    const current = settings.hero.stats ?? [];
    const next = current.map((stat, i) => (i === index ? { ...stat, [field]: nextValue } : stat));
    updateStats(next);
  }

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
        <div class="flex items-center justify-between">
          <Field.Label>{$t('settings.landing_page.editor.hero.heading')}</Field.Label>
          <AIGenerateButton
            context="the main hero heading on an organization's course platform landing page"
            onInsert={(text) => setter(text, 'hero.heading')}
          />
        </div>
        <Input value={settings.hero.heading} oninput={(event) => setter(event.currentTarget.value, 'hero.heading')} />
      </Field.Field>

      <Field.Field>
        <div class="flex items-center justify-between">
          <Field.Label>{$t('settings.landing_page.editor.hero.subheading')}</Field.Label>
          <AIGenerateButton
            context="the hero subheading/tagline on an organization's course platform landing page"
            onInsert={(text) => setter(text, 'hero.subheading')}
          />
        </div>
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
        <div class="flex items-center justify-between">
          <Field.Label>{$t('settings.landing_page.editor.hero.stats.label')}</Field.Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="gap-1"
            disabled={(settings.hero.stats?.length ?? 0) >= MAX_STATS}
            onclick={addStat}
          >
            <PlusIcon class="size-3.5" />
            {$t('settings.landing_page.editor.hero.stats.add')}
          </Button>
        </div>
        <Field.Description>{$t('settings.landing_page.editor.hero.stats.description')}</Field.Description>

        {#if settings.hero.stats && settings.hero.stats.length > 0}
          <div class="space-y-3">
            {#each settings.hero.stats as stat, index (index)}
              <div class="flex items-end gap-2">
                <div class="flex-1">
                  <Field.Label class="text-muted-foreground mb-1 text-xs">
                    {$t('settings.landing_page.editor.hero.stats.label_field')}
                  </Field.Label>
                  <Input
                    value={stat.label}
                    placeholder={$t('settings.landing_page.editor.hero.stats.label_placeholder')}
                    oninput={(event) => updateStatField(index, 'label', event.currentTarget.value)}
                  />
                </div>
                <div class="w-32">
                  <Field.Label class="text-muted-foreground mb-1 text-xs">
                    {$t('settings.landing_page.editor.hero.stats.value_field')}
                  </Field.Label>
                  <Input
                    value={stat.value}
                    placeholder={$t('settings.landing_page.editor.hero.stats.value_placeholder')}
                    oninput={(event) => updateStatField(index, 'value', event.currentTarget.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="text-muted-foreground hover:text-destructive"
                  onclick={() => removeStat(index)}
                  aria-label={$t('settings.landing_page.editor.hero.stats.remove')}
                >
                  <TrashIcon class="size-4" />
                </Button>
              </div>
            {/each}
          </div>
        {/if}
      </Field.Field>

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
