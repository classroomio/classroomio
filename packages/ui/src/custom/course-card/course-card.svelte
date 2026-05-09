<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { cn } from '../../tools';
  import { Badge } from '../../base/badge';
  import { Separator } from '../../base/separator';
  import * as Item from '../../base/item';
  import { DEFAULT_COURSE_BANNER_IMAGE } from './constants';

  interface Props {
    href?: string;
    title: string;
    description: string;
    /** Used when `media` snippet is not provided */
    bannerImage?: string;
    bannerAlt?: string;
    typeBadge?: {
      label: string;
      icon: Component;
      iconClass?: string;
    };
    /** e.g. public-course indicator on the banner */
    visibilityBadge?: {
      label: string;
      icon: Component;
      iconClass?: string;
    };
    class?: string;
    /** Custom banner area (e.g. optimized `Image`); overrides `bannerImage` */
    media?: Snippet;
    /** Optional overlay inside the link (e.g. dropdown), typically absolutely positioned */
    overlay?: Snippet;
    tags?: Snippet;
    footer?: Snippet;
  }

  let {
    href,
    title,
    description,
    bannerImage,
    bannerAlt = 'Course banner image',
    typeBadge,
    visibilityBadge,
    class: className = '',
    media,
    overlay,
    tags,
    footer
  }: Props = $props();

  const resolvedBannerImage = $derived(bannerImage?.trim() ? bannerImage : DEFAULT_COURSE_BANNER_IMAGE);
</script>

<Item.Root variant="outline" class={cn('ui:group ui:relative ui:max-w-[320px] ui:p-3!', className)}>
  {#snippet child({ props })}
    {#if href}
      <a {href} {...props} class={cn('ui:block', props.class as string)}>
        {@render overlay?.()}

        <Item.Header>
          <Item.Media variant="image" class="ui:relative ui:h-50! ui:w-full!">
            {#if media}
              {@render media()}
            {:else}
              <img
                src={resolvedBannerImage}
                alt={bannerAlt}
                class="ui:w-full ui:h-full ui:rounded-sm ui:object-cover"
              />
            {/if}

            {#if typeBadge}
              {@const Icon = typeBadge.icon}
              <Badge
                class="ui:absolute ui:bottom-2 ui:left-2 ui:z-10 ui:flex ui:items-center ui:rounded-md! ui:capitalize"
                variant="secondary"
              >
                <Icon class={typeBadge.iconClass} />
                {typeBadge.label}
              </Badge>
            {/if}

            {#if visibilityBadge}
              {@const VIcon = visibilityBadge.icon}
              <Badge
                class={cn(
                  'ui:absolute ui:bottom-2 ui:z-10 ui:flex ui:items-center ui:rounded-md! ui:gap-1 ui:capitalize',
                  typeBadge ? 'ui:right-2 ui:left-auto' : 'ui:left-2'
                )}
                variant="secondary"
              >
                <VIcon class={visibilityBadge.iconClass} />
                {visibilityBadge.label}
              </Badge>
            {/if}
          </Item.Media>
        </Item.Header>

        <Item.Content>
          <Item.Title class="ui:flex ui:w-full ui:min-h-14 ui:items-center ui:text-base!">
            <span class="ui:line-clamp-2">{title}</span>
          </Item.Title>

          <Item.Description class="ui:min-h-[63px]">{description}</Item.Description>

          {#if tags}
            {@render tags()}
          {/if}

          {#if footer}
            <Separator class="ui:my-3" />
            {@render footer()}
          {/if}
        </Item.Content>
      </a>
    {:else}
      <div {...props} class={cn('ui:block', props.class as string)}>
        {@render overlay?.()}

        <Item.Header>
          <Item.Media variant="image" class="ui:relative ui:h-50! ui:w-full!">
            {#if media}
              {@render media()}
            {:else}
              <img
                src={resolvedBannerImage}
                alt={bannerAlt}
                class="ui:w-full ui:h-full ui:rounded-sm ui:object-cover"
              />
            {/if}

            {#if typeBadge}
              {@const Icon = typeBadge.icon}
              <Badge
                class="ui:absolute ui:bottom-2 ui:left-2 ui:z-10 ui:flex ui:items-center ui:rounded-md! ui:capitalize"
                variant="secondary"
              >
                <Icon class={typeBadge.iconClass} />
                {typeBadge.label}
              </Badge>
            {/if}

            {#if visibilityBadge}
              {@const VIcon = visibilityBadge.icon}
              <Badge
                class={cn(
                  'ui:absolute ui:bottom-2 ui:z-10 ui:flex ui:items-center ui:rounded-md! ui:gap-1 ui:capitalize',
                  typeBadge ? 'ui:right-2 ui:left-auto' : 'ui:left-2'
                )}
                variant="secondary"
              >
                <VIcon class={visibilityBadge.iconClass} />
                {visibilityBadge.label}
              </Badge>
            {/if}
          </Item.Media>
        </Item.Header>

        <Item.Content>
          <Item.Title class="ui:flex ui:w-full ui:min-h-14 ui:items-center ui:text-base!">
            <span class="ui:line-clamp-2">{title}</span>
          </Item.Title>

          <Item.Description class="ui:min-h-[63px]">{description}</Item.Description>

          {#if tags}
            {@render tags()}
          {/if}

          {#if footer}
            <Separator class="ui:my-3" />
            {@render footer()}
          {/if}
        </Item.Content>
      </div>
    {/if}
  {/snippet}
</Item.Root>
