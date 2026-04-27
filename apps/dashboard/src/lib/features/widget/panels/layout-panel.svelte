<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { Switch } from '@cio/ui/base/switch';
  import { InputField } from '@cio/ui/custom/input-field';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';
  import { WIDGET_LAYOUT_TYPE_VALUES } from '@cio/utils/validation/widget';
  import WidgetLayoutThumbnail from '../components/widget-layout-thumbnail.svelte';
  import LayoutOptions from '../components/layout-options.svelte';
  import type { WidgetDetail } from '../utils/types';
  import type { WidgetConfig } from '../utils/types';

  interface Props {
    draftLayoutType: WidgetDetail['widget']['layoutType'];
    draftConfig: WidgetConfig;
    featuredCourseOptions: { id: string; title: string }[];
    tagOptions: WidgetDetail['availableTags'];
    layoutValidationError: string | null;
    onToggleCategoryTag: (tagId: string, checked: boolean) => void;
  }

  let {
    draftLayoutType = $bindable(),
    draftConfig = $bindable(),
    featuredCourseOptions,
    tagOptions,
    layoutValidationError,
    onToggleCategoryTag
  }: Props = $props();

  const layoutOptionIds = WIDGET_LAYOUT_TYPE_VALUES;
</script>

<div class="space-y-6">
  <div>
    <p class="ui:text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
      {$t('widgets.form.layout_type')}
    </p>
    <Tooltip.Provider delayDuration={250}>
      <div class="grid grid-cols-2 gap-3">
        {#each layoutOptionIds as layoutId (layoutId)}
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <div {...props} class={cn('space-y-1', props.class as string | undefined)}>
                  <p class="w-full text-sm">
                    {$t(`widgets.layout.${layoutId}`)}
                  </p>
                  <button
                    type="button"
                    class={cn(
                      'ui:bg-muted/40 group focus-visible:ui:ring-primary/40 flex w-full cursor-pointer flex-col overflow-hidden rounded-md border-2 p-2 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950',
                      draftLayoutType === layoutId
                        ? 'ui:border-primary shadow-sm'
                        : 'ui:border-border ui:hover:border-foreground/20'
                    )}
                    aria-label={$t(`widgets.layout.${layoutId}`)}
                    onclick={() => (draftLayoutType = layoutId)}
                  >
                    <WidgetLayoutThumbnail
                      layoutType={layoutId}
                      label={$t(`widgets.layout.${layoutId}`)}
                      objectFit="contain"
                      selected={draftLayoutType === layoutId}
                      class="h-auto"
                    />
                  </button>
                </div>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content side="right" sideOffset={16} class="ui:max-w-none h-50! w-60! p-3 text-left">
              <div class="w-full space-y-1">
                <p class="w-full text-center text-sm font-semibold">
                  {$t(`widgets.layout.${layoutId}`)}
                </p>

                <WidgetLayoutThumbnail
                  layoutType={layoutId}
                  label={$t(`widgets.layout.${layoutId}`)}
                  objectFit="contain"
                  class="ui:border-border ui:bg-card rounded-md border shadow-lg"
                />
              </div>
            </Tooltip.Content>
          </Tooltip.Root>
        {/each}
      </div>
    </Tooltip.Provider>
  </div>

  {#if layoutValidationError}
    <div
      class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
    >
      {$t(layoutValidationError)}
    </div>
  {/if}

  <Field.Group>
    <Field.Set>
      <Field.Legend>{$t('widgets.layoutOptions.section')}</Field.Legend>
      <LayoutOptions {draftLayoutType} bind:draftConfig {featuredCourseOptions} {tagOptions} {onToggleCategoryTag} />
    </Field.Set>

    <Field.Separator />

    <Field.Set>
      <Field.Legend>{$t('widgets.editor.layout')}</Field.Legend>
      <Field.Field>
        <Field.Label>{$t('widgets.form.sort_by')}</Field.Label>
        <Select.Root type="single" bind:value={draftConfig.sortBy}>
          <Select.Trigger>{$t(`widgets.sort.${draftConfig.sortBy}`)}</Select.Trigger>
          <Select.Content>
            <Select.Item value="manual">{$t('widgets.sort.manual')}</Select.Item>
            <Select.Item value="newest">{$t('widgets.sort.newest')}</Select.Item>
            <Select.Item value="title">{$t('widgets.sort.title')}</Select.Item>
          </Select.Content>
        </Select.Root>
      </Field.Field>
      <InputField label={$t('widgets.form.cta_label')} bind:value={draftConfig.content.ctaLabel} />
      <InputField label={$t('widgets.form.load_more_label')} bind:value={draftConfig.content.loadMoreLabel} />
    </Field.Set>

    <Field.Separator />

    <Field.Set>
      <Field.Legend>{$t('widgets.editor.content')}</Field.Legend>
      <Field.Field orientation="horizontal">
        <Switch bind:checked={draftConfig.content.showCourseImage} />
        <Field.Label>{$t('widgets.form.show_course_image')}</Field.Label>
      </Field.Field>
      <Field.Field orientation="horizontal">
        <Switch bind:checked={draftConfig.content.showCourseTypeBadge} />
        <Field.Label>{$t('widgets.form.show_type_badge')}</Field.Label>
      </Field.Field>
      <Field.Field orientation="horizontal">
        <Switch bind:checked={draftConfig.content.showLessonsCount} />
        <Field.Label>{$t('widgets.form.show_lessons_count')}</Field.Label>
      </Field.Field>
      <Field.Field orientation="horizontal">
        <Switch bind:checked={draftConfig.content.showDescriptionExcerpt} />
        <Field.Label>{$t('widgets.form.show_description')}</Field.Label>
      </Field.Field>
      <Field.Field orientation="horizontal">
        <Switch bind:checked={draftConfig.content.shortenLongDescription} />
        <Field.Label>{$t('widgets.form.shorten_long_description')}</Field.Label>
      </Field.Field>
      <Field.Field orientation="horizontal">
        <Switch bind:checked={draftConfig.content.showPrice} />
        <Field.Label>{$t('widgets.form.show_price')}</Field.Label>
      </Field.Field>
      <Field.Field orientation="horizontal">
        <Switch bind:checked={draftConfig.content.showRating} />
        <Field.Label>{$t('widgets.form.show_rating')}</Field.Label>
      </Field.Field>
    </Field.Set>
  </Field.Group>
</div>
