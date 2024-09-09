<script lang="ts">
  import TextField from '$lib/components/Form/TextField.svelte';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';

  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { fade } from 'svelte/transition';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';

  export let success = false;
  export let isAdding = false;
  export let handleSubmit = () => {};
  export let email: string | undefined;
</script>

{#if $landingPageSettings.mailinglist.show}
  <section id="waitlist" transition:fade class="my-10 mx-auto max-w-6xl w-[95%]">
    <div
      class="bg-primary-700 rounded-lg flex flex-col lg:flex-row lg:items-center px-4 md:px-10 py-14"
    >
      <div class="w-full md:w-[65%] md:mr-4">
        <h1 class="text-4xl font-bold mb-5 mt-0 text-white">
          {$landingPageSettings.mailinglist.title}
        </h1>
        <p class="text-lg text-white">
          {$landingPageSettings.mailinglist.subtitle}
        </p>
      </div>
      <form on:submit|preventDefault={handleSubmit} class="my-4 w-full md:w-fit">
        <div class="flex items-center flex-col sm:flex-row">
          {#if success}
            <p class="text-white">{$t('course.navItem.landing_page.successful_sub')}</p>
          {:else}
            <TextField
              bind:value={email}
              type="email"
              placeholder={$t('course.navItem.landing_page.enter')}
              className="sm:mr-3 my-0 w-full md:w-fit"
              isRequired={true}
              isDisabled={isAdding}
              inputClassName="py-2"
            />
            <PrimaryButton
              className="my-1 w-full mt-2"
              variant={VARIANTS.CONTAINED_LIGHT}
              type="submit"
              isLoading={isAdding}>{$landingPageSettings.mailinglist.buttonLabel}</PrimaryButton
            >
          {/if}
        </div>
      </form>
    </div>
  </section>
{/if}
