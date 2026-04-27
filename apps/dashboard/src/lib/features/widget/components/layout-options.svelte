<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import { Switch } from '@cio/ui/base/switch';
  import { InputField } from '@cio/ui/custom/input-field';
  import { t } from '$lib/utils/functions/translations';
  import type { WidgetDetail } from '../utils/types';
  import type { WidgetConfig } from '../utils/types';

  interface Props {
    draftLayoutType: WidgetDetail['widget']['layoutType'];
    draftConfig: WidgetConfig;
    featuredCourseOptions: { id: string; title: string }[];
    tagOptions: WidgetDetail['availableTags'];
    onToggleCategoryTag: (tagId: string, checked: boolean) => void;
  }

  let {
    draftLayoutType,
    draftConfig = $bindable(),
    featuredCourseOptions,
    tagOptions,
    onToggleCategoryTag
  }: Props = $props();
</script>

{#if draftLayoutType === 'card_grid'}
  <Field.Field>
    <Field.Label>{$t('widgets.layoutOptions.columns')}</Field.Label>
    <Select.Root type="single" bind:value={draftConfig.layoutOptions.cardGrid.columns}>
      <Select.Trigger>{draftConfig.layoutOptions.cardGrid.columns}</Select.Trigger>
      <Select.Content>
        <Select.Item value="2">2</Select.Item>
        <Select.Item value="3">3</Select.Item>
      </Select.Content>
    </Select.Root>
  </Field.Field>
  <InputField
    type="number"
    label={$t('widgets.layoutOptions.max_count')}
    bind:value={draftConfig.layoutOptions.cardGrid.maxCount}
  />
  <Field.Field orientation="horizontal">
    <Switch bind:checked={draftConfig.layoutOptions.cardGrid.showRating} />
    <Field.Label>{$t('widgets.layoutOptions.show_rating')}</Field.Label>
  </Field.Field>
{:else if draftLayoutType === 'tag_filter'}
  <InputField
    type="number"
    label={$t('widgets.layoutOptions.max_count')}
    bind:value={draftConfig.layoutOptions.tagFilter.maxCount}
  />
  <Field.Field>
    <Field.Label>{$t('widgets.layoutOptions.tag_source')}</Field.Label>
    <Select.Root type="single" bind:value={draftConfig.layoutOptions.tagFilter.tagSource}>
      <Select.Trigger>
        {draftConfig.layoutOptions.tagFilter.tagSource === 'auto'
          ? $t('widgets.layoutOptions.tag_source_auto')
          : $t('widgets.layoutOptions.tag_source_manual')}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="auto">{$t('widgets.layoutOptions.tag_source_auto')}</Select.Item>
        <Select.Item value="manual">{$t('widgets.layoutOptions.tag_source_manual')}</Select.Item>
      </Select.Content>
    </Select.Root>
  </Field.Field>
  <Field.Field orientation="horizontal">
    <Switch bind:checked={draftConfig.layoutOptions.tagFilter.showAllOption} />
    <Field.Label>{$t('widgets.layoutOptions.show_all_option')}</Field.Label>
  </Field.Field>
{:else if draftLayoutType === 'carousel'}
  <Field.Field>
    <Field.Label>{$t('widgets.layoutOptions.visible_cards')}</Field.Label>
    <Select.Root type="single" bind:value={draftConfig.layoutOptions.carousel.visibleCards}>
      <Select.Trigger>{draftConfig.layoutOptions.carousel.visibleCards}</Select.Trigger>
      <Select.Content>
        <Select.Item value="2">2</Select.Item>
        <Select.Item value="3">3</Select.Item>
        <Select.Item value="4">4</Select.Item>
      </Select.Content>
    </Select.Root>
  </Field.Field>
  <InputField
    type="number"
    label={$t('widgets.layoutOptions.max_count')}
    bind:value={draftConfig.layoutOptions.carousel.maxCount}
  />
  <Field.Field orientation="horizontal">
    <Switch bind:checked={draftConfig.layoutOptions.carousel.autoPlay} />
    <Field.Label>{$t('widgets.layoutOptions.auto_play')}</Field.Label>
  </Field.Field>
  {#if draftConfig.layoutOptions.carousel.autoPlay}
    <InputField
      type="number"
      label={$t('widgets.layoutOptions.auto_play_interval')}
      bind:value={draftConfig.layoutOptions.carousel.autoPlayIntervalMs}
    />
  {/if}
  <Field.Field orientation="horizontal">
    <Switch bind:checked={draftConfig.layoutOptions.carousel.showDots} />
    <Field.Label>{$t('widgets.layoutOptions.show_dots')}</Field.Label>
  </Field.Field>
  <Field.Field orientation="horizontal">
    <Switch bind:checked={draftConfig.layoutOptions.carousel.showArrows} />
    <Field.Label>{$t('widgets.layoutOptions.show_arrows')}</Field.Label>
  </Field.Field>
  <Field.Field orientation="horizontal">
    <Switch bind:checked={draftConfig.layoutOptions.carousel.loop} />
    <Field.Label>{$t('widgets.layoutOptions.loop')}</Field.Label>
  </Field.Field>
{:else if draftLayoutType === 'primary_course'}
  <Field.Field>
    <Field.Label>{$t('widgets.layoutOptions.featured_course')}</Field.Label>
    <Select.Root
      type="single"
      value={draftConfig.layoutOptions.primaryCourse.featuredCourseId ?? ''}
      onValueChange={(value) => {
        draftConfig.layoutOptions.primaryCourse.featuredCourseId = value || null;
      }}
    >
      <Select.Trigger>
        {featuredCourseOptions.find((c) => c.id === draftConfig.layoutOptions.primaryCourse.featuredCourseId)?.title ??
          $t('widgets.layoutOptions.none')}
      </Select.Trigger>
      <Select.Content>
        {#each featuredCourseOptions as course (course.id)}
          <Select.Item value={course.id}>{course.title}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </Field.Field>
  <InputField
    label={$t('widgets.layoutOptions.eyebrow_label')}
    bind:value={draftConfig.layoutOptions.primaryCourse.eyebrowLabel}
  />
  <InputField
    label={$t('widgets.layoutOptions.cta_label')}
    bind:value={draftConfig.layoutOptions.primaryCourse.ctaLabel}
  />
  <InputField
    type="number"
    label={$t('widgets.layoutOptions.secondary_max_count')}
    bind:value={draftConfig.layoutOptions.primaryCourse.secondaryMaxCount}
  />
{:else if draftLayoutType === 'compact_list'}
  <InputField
    type="number"
    label={$t('widgets.layoutOptions.max_count')}
    bind:value={draftConfig.layoutOptions.compactList.maxCount}
  />
  <Field.Field>
    <Field.Label>{$t('widgets.layoutOptions.density')}</Field.Label>
    <Select.Root type="single" bind:value={draftConfig.layoutOptions.compactList.density}>
      <Select.Trigger>
        {draftConfig.layoutOptions.compactList.density === 'comfortable'
          ? $t('widgets.layoutOptions.density_comfortable')
          : $t('widgets.layoutOptions.density_compact')}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="comfortable">{$t('widgets.layoutOptions.density_comfortable')}</Select.Item>
        <Select.Item value="compact">{$t('widgets.layoutOptions.density_compact')}</Select.Item>
      </Select.Content>
    </Select.Root>
  </Field.Field>
  <Field.Field orientation="horizontal">
    <Switch bind:checked={draftConfig.layoutOptions.compactList.showThumbnail} />
    <Field.Label>{$t('widgets.layoutOptions.show_thumbnail')}</Field.Label>
  </Field.Field>
  <Field.Field orientation="horizontal">
    <Switch bind:checked={draftConfig.layoutOptions.compactList.showTags} />
    <Field.Label>{$t('widgets.layoutOptions.show_tags')}</Field.Label>
  </Field.Field>
{:else if draftLayoutType === 'editorial_spotlight'}
  <Field.Field>
    <Field.Label>{$t('widgets.layoutOptions.main_course')}</Field.Label>
    <Select.Root
      type="single"
      value={draftConfig.layoutOptions.editorialSpotlight.mainCourseId ?? ''}
      onValueChange={(value) => {
        draftConfig.layoutOptions.editorialSpotlight.mainCourseId = value || null;
      }}
    >
      <Select.Trigger>
        {featuredCourseOptions.find((c) => c.id === draftConfig.layoutOptions.editorialSpotlight.mainCourseId)?.title ??
          $t('widgets.layoutOptions.none')}
      </Select.Trigger>
      <Select.Content>
        {#each featuredCourseOptions as course (course.id)}
          <Select.Item value={course.id}>{course.title}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </Field.Field>
  <InputField
    type="number"
    label={$t('widgets.layoutOptions.secondary_max_count')}
    bind:value={draftConfig.layoutOptions.editorialSpotlight.secondaryMaxCount}
  />
  <Field.Field>
    <Field.Label>{$t('widgets.layoutOptions.title_style')}</Field.Label>
    <Select.Root type="single" bind:value={draftConfig.layoutOptions.editorialSpotlight.titleStyle}>
      <Select.Trigger>
        {draftConfig.layoutOptions.editorialSpotlight.titleStyle === 'serif'
          ? $t('widgets.layoutOptions.title_style_serif')
          : $t('widgets.layoutOptions.title_style_sans')}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="serif">{$t('widgets.layoutOptions.title_style_serif')}</Select.Item>
        <Select.Item value="sans">{$t('widgets.layoutOptions.title_style_sans')}</Select.Item>
      </Select.Content>
    </Select.Root>
  </Field.Field>
{:else if draftLayoutType === 'category_shelf'}
  <Field.Field>
    <Field.Label>{$t('widgets.layoutOptions.category_tags')}</Field.Label>
    <div class="flex flex-wrap gap-1.5">
      {#each tagOptions as tag (tag.id)}
        {@const checked = draftConfig.layoutOptions.categoryShelf.categoryTagIds.includes(tag.id)}
        <button
          type="button"
          class={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
            checked
              ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
              : 'ui:border-border ui:bg-background ui:text-foreground ui:hover:bg-muted'
          }`}
          onclick={() => onToggleCategoryTag(tag.id, !checked)}
        >
          {tag.name}
        </button>
      {/each}
    </div>
  </Field.Field>
  <Field.Field orientation="horizontal">
    <Switch bind:checked={draftConfig.layoutOptions.categoryShelf.showAllTab} />
    <Field.Label>{$t('widgets.layoutOptions.show_all_tab')}</Field.Label>
  </Field.Field>
  <InputField
    type="number"
    label={$t('widgets.layoutOptions.max_per_category')}
    bind:value={draftConfig.layoutOptions.categoryShelf.maxPerCategory}
  />
{/if}
