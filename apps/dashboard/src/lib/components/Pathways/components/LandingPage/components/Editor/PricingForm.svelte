<script lang="ts">
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import get from 'lodash/get';
  import isEmpty from 'lodash/isEmpty';
  import { Toggle, Select, SelectItem } from 'carbon-components-svelte';

  import TextField from '$lib/components/Form/TextField.svelte';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import { isCourseFree } from '$lib/utils/functions/course';
  import type { Pathway } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';

  export let pathway: Pathway;

  let discount = 0;
  let paymentLink = '';
  let showDiscount: boolean | undefined = undefined;
  let giftToggled: boolean | undefined = undefined;

  let hasBeenSet = false;

  function setDefaults(pathway: Pathway) {
    console.log('\n\nsetDefaults course', pathway);
    if (isEmpty(pathway) || hasBeenSet) return;
    hasBeenSet = true;

    paymentLink = get(pathway, 'landingpage.paymentLink', '');
    discount = get(pathway, 'landingpage.discount', 0);
    showDiscount = get(pathway, 'landingpage.showDiscount', false);
    giftToggled = get(pathway, 'landingpage.reward.show', false);
  }

  function setter(value: string | number | boolean | undefined, setterKey: string) {
    if (typeof value !== 'boolean' && !value) return;

    const _pathway = cloneDeep(pathway);
    set(_pathway, setterKey, value);
    pathway = _pathway;
  }

  function handleChange(html: string) {
    const _pathway = cloneDeep(pathway);
    set(_pathway, 'landingpage.reward.description', html);
    pathway = _pathway;
  }

  $: setter(showDiscount, 'landingpage.showDiscount');
  $: setter(paymentLink, 'landingpage.paymentLink');
  $: setter(discount, 'landingpage.discount');
  $: setter(giftToggled, 'landingpage.reward.show');

  $: setDefaults(pathway);
</script>

{#if typeof pathway !== 'undefined'}
  <Select
    labelText={$t('course.navItem.landing_page.editor.pricing_form.currency')}
    bind:selected={pathway.currency}
  >
    <SelectItem value="NGN" />
    <SelectItem value="USD" />
  </Select>

  <TextField
    className="mt-5"
    labelClassName="font-bold"
    label={$t('course.navItem.landing_page.editor.pricing_form.cost')}
    type="number"
    bind:value={pathway.cost}
  />

  {#if !isCourseFree(pathway.cost || 0)}
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
    <Toggle
      labelText={$t('course.navItem.landing_page.editor.pricing_form.discount')}
      bind:toggled={showDiscount}
    >
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
    <Toggle labelText={$t('course.navItem.landing_page.editor.pricing_form.gift_placeholder')} bind:toggled={giftToggled}>
      <span slot="labelA">{$t('course.navItem.landing_page.editor.pricing_form.no')}</span>
      <span slot="labelB">{$t('course.navItem.landing_page.editor.pricing_form.yes')}</span>
    </Toggle>
  </div>

  {#if giftToggled}
    <p class="dark:text-white font-bold mt-5">
      {$t('course.navItem.landing_page.editor.pricing_form.gift')}
    </p>

    <div class="h-2/5">
      <TextEditor
        value={get(pathway, 'landingpage.reward.description', '')}
        onChange={handleChange}
      />
    </div>
  {/if}
{/if}
