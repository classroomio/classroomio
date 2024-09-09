<script>
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { t } from '$lib/utils/functions/translations';
  import { Column, Grid, Row } from 'carbon-components-svelte';
  import { Email, LocationFilled, Phone, Rocket } from 'carbon-icons-svelte';
  import { fade } from 'svelte/transition';

  export let contact = {};
  export let contactError = {};
  export let handleContactSubmit = () => {};
  export let successContactSaved = false;
  export let isContactSubmiting = false;
</script>

{#if $landingPageSettings.contact.show}
  <section id="contact" transition:fade class="my-10 w-full bg-primary-50">
    <div class="mx-auto max-w-6xl w-full">
      <div class="max-w-[500px] mx-auto w-11/12 py-10">
        <h1 class="text-4xl md:text-5xl lg:text-6xl text-center my-4 font-bold">
          {$landingPageSettings.contact.title}
          <span class="text-primary-600">{$landingPageSettings.contact.titleHighlight}</span>
        </h1>
        <p class="text-md text-center">{$landingPageSettings.contact.subtitle}</p>
      </div>
      <Grid class="max-w-[700px] pb-10">
        <!-- Contact Details -->
        <Row>
          <Column
            class="flex items-center flex-col justify-center break-all text-center cursor-pointer hover:shadow-xl rounded-lg transition-all duration-500 py-2 mx-2"
          >
            <LocationFilled size={32} />
            <p class="text-xs md:text-sm mt-3 max-w-[200px]">
              {$landingPageSettings.contact.address}
            </p>
          </Column>
          <Column
            class="flex items-center flex-col justify-center break-all text-center cursor-pointer hover:shadow-xl rounded-lg transition-all duration-500 py-2 mx-2"
          >
            <Phone size={32} />
            <p class="text-xs md:text-sm mt-3">{$landingPageSettings.contact.phone}</p>
          </Column>
          <Column
            class="flex items-center flex-col justify-center break-all text-center cursor-pointer hover:shadow-xl rounded-lg transition-all duration-500 py-2 mx-2"
          >
            <Email size={32} />
            <p class="text-xs md:text-sm mt-3">{$landingPageSettings.contact.email}</p>
          </Column>
        </Row>

        <!-- Contact Form -->
        <div class="mt-8 bg-white p-7 rounded-lg">
          {#if successContactSaved}
            <div class="w-full flex items-center justify-center">
              {$t('course.navItem.landing_page.thank_you')}
            </div>
          {:else}
            <form on:submit|preventDefault={handleContactSubmit}>
              <div class="w-full flex justify-between flex-col md:flex-row">
                <div class="w-full md:w-2/4 mr-5">
                  <TextField
                    label={$t('course.navItem.landing_page.name')}
                    bind:value={contact.name}
                    errorMessage={contactError.name}
                    className="mb-5"
                    labelClassName="font-bold"
                    placeholder="Elon Musk"
                  />
                  <TextField
                    label={$t('course.navItem.landing_page.email')}
                    bind:value={contact.email}
                    errorMessage={contactError.email}
                    className="text-xs font-normal mb-5"
                    placeholder="musk@x.com"
                  />
                  <TextField
                    label={$t('course.navItem.landing_page.phone')}
                    bind:value={contact.phone}
                    errorMessage={contactError.phone}
                    className="text-xs font-normal mb-5"
                    placeholder="+1194802480"
                  />
                </div>
                <div class="w-full md:w-2/4">
                  <TextArea
                    label={$t('course.navItem.landing_page.message')}
                    bind:value={contact.message}
                    errorMessage={contactError.message}
                    rows="9"
                    maxRows={15}
                    placeholder={$t('course.navItem.landing_page.your_message')}
                  />
                </div>
              </div>

              <PrimaryButton
                className="w-full mx-auto mt-5 md:mt-0"
                type="submit"
                isLoading={isContactSubmiting}
              >
                <span class="mr-2 text-md">{$t('course.navItem.landing_page.submit')}</span>
                <Rocket size={24} />
              </PrimaryButton>
            </form>
          {/if}
        </div>
      </Grid>
    </div>
  </section>
{/if}
