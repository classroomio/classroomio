<script lang="ts">
  import { NotchCard } from '$lib/components/ui';
  import type { Snippet } from 'svelte';

  type Variant = 'pick' | 'problem' | 'feat' | 'price' | 'faq' | 'read';

  interface Props {
    variant?: Variant;
    href?: string;
    title?: string;
    description?: string;
    wide?: boolean;
    open?: boolean;
    notchClass?: string;
    class?: string;
    children?: Snippet;
  }

  let {
    variant = 'problem',
    href,
    title,
    description,
    wide = false,
    open = false,
    notchClass = 'bg-[var(--notch-bg)]',
    class: className = '',
    children
  }: Props = $props();

  const VARIANT_CARD: Record<Variant, string> = {
    pick: '!rounded-[10px] !px-6 !pt-9 !pb-6 bg-[var(--sand)] grid gap-4 content-start',
    problem: '!rounded-[10px] !px-6 !pt-9 !pb-6 bg-[var(--sand)] grid gap-3 content-start',
    feat: '!rounded-[10px] !px-5 !pt-9 !pb-6 bg-[var(--sand)] grid gap-4 content-start',
    price:
      'price-card !rounded-[14px] !px-8 !pt-7 !pb-8 !bg-white border border-[var(--sand-deep)] grid gap-3 content-start',
    faq: 'faq-item !rounded-[10px] !p-0 bg-white',
    read: 'read !rounded-[14px] !p-6 !bg-white border border-[var(--sand-line)] grid gap-2.5 content-start hover:border-[var(--blue)] transition-colors'
  };

  const VARIANT_TITLE: Record<Variant, string> = {
    pick: 'text-[20px] font-semibold tracking-[-0.02em] text-[var(--ink)] leading-[1.2]',
    problem: 'text-[20px] font-semibold tracking-[-0.02em] text-[var(--ink)] leading-[1.2]',
    feat: 'text-[19px] font-semibold tracking-[-0.02em] text-[var(--ink)] flex items-center gap-2.5',
    price: 'text-[18px] font-semibold text-[var(--ink)]',
    faq: '',
    read: 'text-[18px] font-semibold tracking-[-0.02em] text-[var(--ink)] leading-[1.25]'
  };

  const VARIANT_BODY: Record<Variant, string> = {
    pick: '',
    problem: 'text-[15px] leading-relaxed text-[var(--body)]',
    feat: 'text-[15px] leading-relaxed text-[var(--body)] mt-2',
    price: 'text-[15px] text-[var(--muted)]',
    faq: '',
    read: 'text-sm text-[var(--muted)] leading-relaxed'
  };

  const cardClass = $derived(
    [
      VARIANT_CARD[variant],
      variant === 'feat' && wide ? 'lg:!grid lg:!grid-cols-[1fr_1fr] lg:!items-center lg:!gap-6 lg:col-span-2' : '',
      variant === 'faq' && open ? 'open' : '',
      className
    ]
      .filter(Boolean)
      .join(' ')
  );
</script>

{#if variant === 'price' || variant === 'read'}
  <svelte:element this={href ? 'a' : 'div'} {href} class={cardClass}>
    {#if title}
      <h3 class={VARIANT_TITLE[variant]}>{title}</h3>
    {/if}
    {#if description}
      <p class={VARIANT_BODY[variant]}>{description}</p>
    {/if}
    {@render children?.()}
  </svelte:element>
{:else}
  <NotchCard {href} class={cardClass} {notchClass}>
    {#if title}
      <h3 class={VARIANT_TITLE[variant]}>{title}</h3>
    {/if}
    {#if description}
      <p class={VARIANT_BODY[variant]}>{description}</p>
    {/if}
    {@render children?.()}
  </NotchCard>
{/if}
