<script lang="ts">
  import get from 'lodash/get';
  import { Toggle, Select, SelectItem } from 'carbon-components-svelte';

  import TextField from '$lib/components/Form/TextField.svelte';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import { isCourseFree } from '$lib/utils/functions/course';
  import type { Course } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    course: Course;
    setter: (value: any, key: string) => void;
  }

  let { course = $bindable(), setter }: Props = $props();

  let discount = $derived(get(course, 'metadata.discount', 0));
  let paymentLink = $derived(get(course, 'metadata.paymentLink', ''));
  let showDiscount = $derived(get(course, 'metadata.showDiscount', false));
  let giftToggled = $derived(get(course, 'metadata.reward.show', false));

  function handleChange(html: string) {
    setter(html, 'metadata.reward.description');
  }

  $effect(() => {
    setter(showDiscount, 'metadata.showDiscount');
  });
  $effect(() => {
    setter(paymentLink, 'metadata.paymentLink');
  });
  $effect(() => {
    setter(discount, 'metadata.discount');
  });
  $effect(() => {
    setter(giftToggled, 'metadata.reward.show');
  });
</script>

{#if typeof course !== 'undefined'}
  <Select labelText={$t('course.navItem.landing_page.editor.pricing_form.currency')} bind:selected={course.currency}>
    <SelectItem value="NGN" />
    <SelectItem value="USD" />
  </Select>

  <TextField
    className="mt-5"
    labelClassName="font-bold"
    label={$t('course.navItem.landing_page.editor.pricing_form.cost')}
    type="number"
    bind:value={course.cost}
  />

  {#if !isCourseFree(course.cost || 0)}
    <TextField
      className="mt-5"
      labelClassName="font-bold"
      label={$t('course.navItem.landing_page.editor.pricing_form.payment')}
      helperMessage="Stripe, Lemon Squeezy or any payment link"
      bind:value={paymentLink}
    />
  {/if}

  <div class="mt-5">
    <!-- <label for="text-field" class="m-0 font-bold mb-2">Discount</label> -->
    <Toggle labelText={$t('course.navItem.landing_page.editor.pricing_form.discount')} bind:toggled={showDiscount}>
      <span slot="labelA">{$t('course.navItem.landing_page.editor.pricing_form.no')}</span>
      <span slot="labelB">{$t('course.navItem.landing_page.editor.pricing_form.yes')}</span>
    </Toggle>
  </div>

  {#if showDiscount}
    <TextField
      className="mt-5"
      labelClassName="font-bold"
      label={$t('course.navItem.landing_page.editor.pricing_form.percent')}
      type="number"
      bind:value={discount}
      helperMessage="In Percentage %"
    />
  {/if}

  <div class="mt-5">
    <!-- <label for="text-field" class="m-0 font-bold mb-2">Discount</label> -->
    <Toggle labelText="Gift on Completion" bind:toggled={giftToggled}>
      <span slot="labelA">{$t('course.navItem.landing_page.editor.pricing_form.no')}</span>
      <span slot="labelB">{$t('course.navItem.landing_page.editor.pricing_form.yes')}</span>
    </Toggle>
  </div>

  {#if giftToggled}
    <p class="mt-5 font-bold dark:text-white">
      {$t('course.navItem.landing_page.editor.pricing_form.gift')}
    </p>

    <div class="h-2/5">
      <TextEditor value={get(course, 'metadata.reward.description', '')} onChange={handleChange} />
    </div>
  {/if}
{/if}
