<script lang="ts">
  import {
    EARLY_ADOPTER_OFFER,
    getEarlyAdopterDaysLeft,
    getEarlyAdopterUrgency,
    type EarlyAdopterUrgency
  } from '@cio/utils/plans';
  import { getLockInHref, type LockInInterval } from '$lib/utils/lock-in';
  import { formatDate } from '$lib/utils/format-date';
  import CtaButton from './ui/cta-button.svelte';
  import Eyebrow from './ui/eyebrow.svelte';
  import NotchCard from './ui/notch-card.svelte';

  interface Props {
    interval?: LockInInterval;
    class?: string;
  }

  let { interval = 'month', class: className = '' }: Props = $props();

  const now = new Date();
  const urgency = getEarlyAdopterUrgency(now);
  const daysLeft = getEarlyAdopterDaysLeft(now);
  const endDate = formatDate(EARLY_ADOPTER_OFFER.endsAt, 'long', 'en-GB');

  const COUNTDOWN_LABEL: Record<Exclude<EarlyAdopterUrgency, 'ended'>, string> = {
    open: `${daysLeft} days left`,
    closing: `Last ${daysLeft} days`,
    final: '1 day left',
    today: 'Ends today'
  };
  const title = urgency === 'open' ? 'Priced low on purpose. Not for long.' : 'Priced low on purpose. Closing soon.';
</script>

{#if urgency !== 'ended'}
  <NotchCard class="bg-[#EEF2FF] text-gray-950 {className}" notchClass="bg-white">
    <div class="grid items-center gap-6 md:grid-cols-[1fr_auto] md:gap-12">
      <div class="flex flex-col gap-3">
        <Eyebrow size="sm" class="text-blue-700">Early Adopter rate · {COUNTDOWN_LABEL[urgency]}</Eyebrow>
        <h2 class="text-h3 font-medium text-balance">{title}</h2>
        <p class="max-w-[640px] text-pretty text-gray-600">
          We keep ClassroomIO affordable because we build it with our customers, not for them. Lock in today’s rate
          before {endDate}. After that, the Early Adopter plan closes and new pricing applies.
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row md:flex-col">
        <CtaButton href={getLockInHref(interval)} arrow>Lock in my rate</CtaButton>
        <CtaButton variant="secondary" href={EARLY_ADOPTER_OFFER.postPath}>Read why we do it</CtaButton>
      </div>
    </div>
  </NotchCard>
{/if}
