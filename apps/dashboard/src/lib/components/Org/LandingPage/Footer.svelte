<script>
  import { t } from '$lib/utils/functions/translations';
  import { landingPageSettings } from '../Settings/store';

  export let logo;
  export let orgName;
</script>

{#if $landingPageSettings.footer.show}
  <nav class="bg-white w-full flex items-center justify-between py-4 px-6">
    <div class="logo">
      <a href="/" title={`Go to ${orgName} Home`} id="logo" data-hveid="8">
        <img
          src={logo || '/logo-192.png'}
          alt={`${orgName || 'ClassroomIO'} logo`}
          class="rounded w-9 inline-block mx-auto"
          data-atf="1"
        />
      </a>
    </div>
    <ul class="flex items-center space-x-8 underline text-[#0542CC]">
      {#if $landingPageSettings.footer.twitter}
        <a
          href={$landingPageSettings.footer.twitter}
          target="_blank"
          title={$t('settings.landing_page.footer.twitter')}>Twitter</a
        >
      {/if}
      {#if $landingPageSettings.footer?.youtube}
        <a href={$landingPageSettings.footer?.youtube} target="_blank">Youtube</a>{/if}

      {#if $landingPageSettings.footer.linkedin}
        <a
          href={$landingPageSettings.footer.linkedin}
          target="_blank"
          title={$t('settings.landing_page.footer.linkedin')}>LinkedIn</a
        >
      {/if}
      {#if $landingPageSettings.footer.facebook}
        <a
          href={$landingPageSettings.footer.facebook}
          target="_blank"
          title={$t('settings.landing_page.footer.facebook')}>facebook</a
        >
      {/if}
    </ul>
    <a href="/#" class="flex items-center gap-1">
      <p class=" text-[#0233BD] text-base underline font-semibold">Built on ClassroomIO</p>
    </a>
  </nav>
{/if}
