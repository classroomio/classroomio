<script lang="ts">
  import * as EmptyBase from '../../base/empty';
  import { SimpleLogoNav } from '../simple-logo-nav';
  import type { ComponentProps, Snippet } from 'svelte';
  import type { Component } from 'svelte';
  import { tv, type VariantProps } from 'tailwind-variants';
  import { cn } from '../../tools';

  const emptyVariants = tv({
    base: 'ui:w-full ui:max-h-90',
    variants: {
      variant: {
        default: '',
        page: 'ui:h-full ui:border ui:border-dashed ui:max-w-3xl  ui:mx-auto'
      }
    }
  });

  type EmptyVariant = VariantProps<typeof emptyVariants>['variant'];

  interface Props {
    title?: string;
    description?: string;
    icon?: Component<any, any, any>;
    class?: string;
    children?: Snippet;
    variant?: EmptyVariant;
    layout?: 'block' | 'full-page';
    showLogo?: boolean;
  }

  let {
    title,
    description,
    icon: IconComponent,
    class: className = '',
    children,
    variant = 'default',
    layout = 'block',
    showLogo = false,
    ...restProps
  }: Props & Omit<ComponentProps<typeof EmptyBase.Root>, 'class' | 'children'> = $props();

  const mergedProps = $derived({
    class: cn(emptyVariants({ variant }), className),
    'data-slot': 'empty',
    'data-variant': variant,
    ...restProps
  });
</script>

{#snippet content()}
  <EmptyBase.Root {...mergedProps}>
    <EmptyBase.Header class="">
      {#if IconComponent}
        <EmptyBase.Media variant="icon">
          {@const Icon = IconComponent}
          <Icon />
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
      <EmptyBase.Content>
        {@render children()}
      </EmptyBase.Content>
    {/if}
  </EmptyBase.Root>
{/snippet}

{#if layout === 'full-page'}
  <div class="ui:relative ui:flex ui:h-screen ui:w-screen ui:flex-col ui:items-center ui:justify-center">
    {#if showLogo}
      <SimpleLogoNav />
    {/if}

    {@render content()}
  </div>
{:else}
  {@render content()}
{/if}
