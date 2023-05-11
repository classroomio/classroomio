<script>
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import get from 'lodash/get';
  import isEmpty from 'lodash/isEmpty';
  import { Toggle } from 'carbon-components-svelte';
  import TextEditor from '../../../TextEditor/index.svelte';
  import TextField from '../../../Form/TextField.svelte';

  export let course = {};

  let discount = 0;
  let showDiscount;
  let giftToggled;

  let hasBeenSet = false;

  function setDefaults(course) {
    console.log('\n\nsetDefaults course', course);
    if (isEmpty(course) || hasBeenSet) return;
    hasBeenSet = true;

    discount = get(course, 'metadata.discount', 0);
    showDiscount = get(course, 'metadata.showDiscount', false);
    giftToggled = get(course, 'metadata.reward.show', false);
  }

  function setter(value, setterKey) {
    console.log('\n\nsetter course', value);
    if (typeof value !== 'boolean' && !value) return;

    const _course = cloneDeep(course);
    set(_course, setterKey, value);
    course = _course;
  }

  $: setter(showDiscount, 'metadata.showDiscount');
  $: setter(discount, 'metadata.discount');
  $: setter(giftToggled, 'metadata.reward.show');

  $: setDefaults(course);
</script>

<TextField
  className="mt-5"
  labelClassName="font-bold"
  label="Currency"
  value={course.currency}
  isDisabled={true}
/>

<TextField
  className="mt-5"
  labelClassName="font-bold"
  label="Cost"
  type="number"
  bind:value={course.cost}
/>

<div class="mt-5">
  <!-- <label for="text-field" class="m-0 font-bold mb-2">Discount</label> -->
  <Toggle labelText="Discount" bind:toggled={showDiscount}>
    <span slot="labelA">No</span>
    <span slot="labelB">Yes</span>
  </Toggle>
</div>

{#if showDiscount}
  <TextField
    className="mt-5"
    labelClassName="font-bold"
    label="Discout Percent"
    type="number"
    bind:value={discount}
    helperMessage="In Percentage %"
  />
{/if}

<div class="mt-5">
  <!-- <label for="text-field" class="m-0 font-bold mb-2">Discount</label> -->
  <Toggle labelText="Gift on Completion" bind:toggled={giftToggled}>
    <span slot="labelA">No</span>
    <span slot="labelB">Yes</span>
  </Toggle>
</div>

{#if giftToggled}
  <p class="dark:text-white font-bold mt-5">About Gift</p>

  <div class="h-2/5">
    <TextEditor
      content={get(course, 'metadata.reward.description')}
      onChange={(html) => {
        const _course = cloneDeep(course);
        set(_course, 'metadata.reward.description', html);
        course = _course;
      }}
    />
  </div>
{/if}
