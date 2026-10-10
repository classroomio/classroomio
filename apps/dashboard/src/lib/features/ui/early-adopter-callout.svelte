<script lang="ts">
  import { EARLY_ADOPTER_OFFER, getEarlyAdopterDaysLeft, getEarlyAdopterUrgency } from '@cio/utils/plans';
  import { Button } from '@cio/ui/base/button';
  import * as Item from '@cio/ui/base/item';
  import { locale, t } from '$lib/utils/functions/translations';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  const now = new Date();
  const urgency = getEarlyAdopterUrgency(now);
  const daysLeft = getEarlyAdopterDaysLeft(now);
  const postUrl = `https://classroomio.com${EARLY_ADOPTER_OFFER.postPath}`;

  const endDate = $derived(
    new Date(`${EARLY_ADOPTER_OFFER.endsAt}T00:00:00Z`).toLocaleDateString($locale || 'en', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    })
  );
  const eyebrow = $derived(
    urgency === 'today'
      ? $t('pricing.modal.priced_low.eyebrow_today')
      : urgency === 'closing'
        ? $t('pricing.modal.priced_low.eyebrow_closing', { days: daysLeft })
        : $t('pricing.modal.priced_low.eyebrow_open', { days: daysLeft })
  );
  const title = $derived(
    urgency === 'open' ? $t('pricing.modal.priced_low.title') : $t('pricing.modal.priced_low.title_closing')
  );
</script>

{#if urgency !== 'ended'}
  <Item.Root variant="outline" class="w-full border-blue-700! {className}">
    <Item.Content>
      <p class="font-mono text-xs font-medium tracking-wide text-blue-700 uppercase dark:text-white">{eyebrow}</p>
      <Item.Title>{title}</Item.Title>
      <Item.Description>{$t('pricing.modal.priced_low.body', { date: endDate })}</Item.Description>
    </Item.Content>
    <Item.Actions>
      <Button size="sm" variant="outline" href={postUrl} target="_blank" rel="noopener noreferrer">
        {$t('pricing.modal.priced_low.link')}
      </Button>
    </Item.Actions>
  </Item.Root>
{/if}
