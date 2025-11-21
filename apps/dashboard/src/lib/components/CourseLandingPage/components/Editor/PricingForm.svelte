<script lang="ts">
  import get from 'lodash/get';
  import * as Select from '@cio/ui/base/select';
  import { Switch } from '@cio/ui/base/switch';
  import { Label } from '@cio/ui/base/label';

  import type { Course } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { isCourseFree } from '$lib/utils/functions/course';

  import TextField from '$lib/components/Form/TextField.svelte';
  import TextEditor from '$lib/components/TextEditor/index.svelte';

  interface Props {
    course: Course;
    setter: (value: any, key: string) => void;
  }

  let { course = $bindable(), setter }: Props = $props();

  let discount = $derived(get(course, 'metadata.discount', 0));
  let paymentLink = $derived(get(course, 'metadata.paymentLink', ''));
  let showDiscount = $derived(get(course, 'metadata.showDiscount', false));
  let giftToggled = $derived(get(course, 'metadata.reward.show', false));

  function handleChange(content: string) {
    setter(content, 'metadata.reward.description');
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
  <div>
    <Label class="mb-2 font-bold">{$t('course.navItem.landing_page.editor.pricing_form.currency')}</Label>
    <Select.Root type="single" value={course.currency} onValueChange={(value) => setter(value, 'currency')}>
      <Select.Trigger class="w-full">
        <p>{course.currency === 'NGN' ? 'NGN' : 'USD'}</p>
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="NGN">NGN</Select.Item>
        <Select.Item value="USD">USD</Select.Item>
      </Select.Content>
    </Select.Root>
  </div>

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
    <div class="mb-2">
      <Label class="font-bold">{$t('course.navItem.landing_page.editor.pricing_form.discount')}</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch bind:checked={showDiscount} />
      <Label class="text-gray-600">
        {showDiscount
          ? $t('course.navItem.landing_page.editor.pricing_form.yes')
          : $t('course.navItem.landing_page.editor.pricing_form.no')}
      </Label>
    </div>
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
    <div class="mb-2">
      <Label class="font-bold">Gift on Completion</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch bind:checked={giftToggled} />

      <Label class="text-gray-600">
        {giftToggled
          ? $t('course.navItem.landing_page.editor.pricing_form.yes')
          : $t('course.navItem.landing_page.editor.pricing_form.no')}
      </Label>
    </div>
  </div>

  {#if giftToggled}
    <p class="mt-5 dark:text-white">
      {$t('course.navItem.landing_page.editor.pricing_form.gift')}
    </p>

    <div class="h-2/5">
      <TextEditor
        content={get(course, 'metadata.reward.description', '')}
        onChange={(content) => handleChange(content)}
      />
    </div>
  {/if}
{/if}
