<script lang="ts">
  import * as EmptyBase from '../../base/empty';
  import { SimpleLogoNav } from '../simple-logo-nav';
  import type { ComponentProps, Snippet } from 'svelte';
  import type { Component } from 'svelte';
  import { tv, type VariantProps } from 'tailwind-variants';
  import { cn } from '../../tools';

  const emptyVariants = tv({
    base: 'ui:w-full',
    variants: {
      variant: {
        default: '',
        page: 'ui:border ui:border-dashed ui:max-w-3xl ui:mx-auto'
      },
      hasMedia: {
        false: 'ui:max-h-90',
        true: 'ui:flex-none'
      }
    },
    compoundVariants: [{ variant: 'page', hasMedia: false, class: 'ui:h-full' }]
  });

  const fullPageVariants = tv({
    base: 'ui:relative ui:flex ui:flex-col ui:items-center ui:justify-center',
    variants: {
      hasMedia: {
        false: 'ui:h-screen ui:w-screen',
        true: 'ui:min-h-screen ui:w-full ui:py-6'
      },
      showLogo: {
        true: '',
        false: ''
      }
    },
    compoundVariants: [{ hasMedia: true, showLogo: true, class: 'ui:pt-28' }]
  });

  type EmptyVariant = VariantProps<typeof emptyVariants>['variant'];

  interface Props {
    title?: string;
    description?: string;
    icon?: Component<any, any, any>;
    iconClass?: string;
    media?: Snippet;
    class?: string;
    contentClass?: string;
    children?: Snippet;
    variant?: EmptyVariant;
    layout?: 'block' | 'full-page';
    showLogo?: boolean;
    animatedBackground?: boolean;
  }

  let {
    title,
    description,
    icon: IconComponent,
    iconClass = '',
    media,
    class: className = '',
    contentClass = '',
    children,
    variant = 'default',
    layout = 'block',
    showLogo = false,
    animatedBackground = false,
    ...restProps
  }: Props & Omit<ComponentProps<typeof EmptyBase.Root>, 'class' | 'children'> = $props();

  const mergedProps = $derived({
    class: cn(emptyVariants({ variant, hasMedia: Boolean(media) }), className),
    'data-slot': 'empty',
    'data-variant': variant,
    animatedBackground,
    ...restProps
  });
</script>

{#snippet content()}
  <EmptyBase.Root {...mergedProps}>
    <EmptyBase.Header class="">
      {#if media}
        <EmptyBase.Media
          variant="default"
          class="ui:mb-3 ui:w-full ui:max-sm:hidden ui:[@media(max-height:639px)]:hidden"
        >
          {@render media()}
        </EmptyBase.Media>
      {:else if IconComponent}
        <EmptyBase.Media variant="icon">
          {@const Icon = IconComponent}
          <Icon class={iconClass} />
        </EmptyBase.Media>
      {/if}
      {#if title}
        <EmptyBase.Title>{title}</EmptyBase.Title>
      {/if}
      {#if description}
        <EmptyBase.Description>{description}</EmptyBase.Description>
      {/if}
    </EmptyBase.Header>
    {#if children}
      <EmptyBase.Content class={contentClass}>
        {@render children()}
      </EmptyBase.Content>
    {/if}
  </EmptyBase.Root>
{/snippet}

{#if layout === 'full-page'}
  <div class={fullPageVariants({ hasMedia: Boolean(media), showLogo })}>
    {#if showLogo}
      <SimpleLogoNav />
    {/if}

    {@render content()}
  </div>
{:else}
  {@render content()}
{/if}
