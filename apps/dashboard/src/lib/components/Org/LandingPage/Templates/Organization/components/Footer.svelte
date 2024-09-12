<script>
  import { t } from '$lib/utils/functions/translations';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  // import LogoX from "carbon-icons-svelte/lib/LogoX.svelte";
  import LogoDiscord from 'carbon-icons-svelte/lib/LogoDiscord.svelte';
  import LogoFacebook from 'carbon-icons-svelte/lib/LogoFacebook.svelte';
  import LogoLinkedin from 'carbon-icons-svelte/lib/LogoLinkedin.svelte';
  import LogoInstagram from 'carbon-icons-svelte/lib/LogoInstagram.svelte';
  import { LogoYoutube } from 'carbon-icons-svelte';

  export let logo;
  export let orgName;
</script>

{#if $landingPageSettings.footer.show}
  <nav
    class="bg-white w-full flex flex-col md:flex-row items-start md:items-center gap-4 md:justify-between py-4 px-6"
  >
    <div class="logo w-full md:w-fit flex items-center justify-between">
      <a href="/" title={`Go to ${orgName} Home`} id="logo" data-hveid="8">
        <img
          src={logo || '/logo-192.png'}
          alt={`${orgName || 'ClassroomIO'} logo`}
          class="rounded w-9 inline-block mx-auto"
          data-atf="1"
        />
      </a>

      <a href="/#" class="md:hidden flex items-center gap-1">
        <p class=" text-[#0233BD] text-base underline font-semibold">Built on ClassroomIO</p>
      </a>
    </div>
    <ul
      class="my-4 md:my-0 mx-auto flex flex-row items-center justify-center gap-8 underline border rounded-full px-6 py-2"
    >
      {#if $landingPageSettings.footer?.instagram}
        <a
          href={$landingPageSettings.footer.instagram}
          target="_blank"
          title={$t('settings.landing_page.footer.twitter')}
          ><LogoInstagram class="fill-red-500 " size={24} /></a
        >
      {/if}
      <!-- {#if $landingPageSettings.footer.twitter}
        <a
          href={$landingPageSettings.footer.twitter}
          target="_blank"
          title={$t('settings.landing_page.footer.twitter')}><LogoX /></a
        >
      {/if} -->
      {#if $landingPageSettings.footer?.youtube}
        <a href={$landingPageSettings.footer?.youtube} target="_blank"
          ><LogoYoutube class="fill-red-700" size={24} /></a
        >{/if}
      {#if $landingPageSettings.footer?.discord}
        <a
          href={$landingPageSettings.footer.discord}
          target="_blank"
          title={$t('settings.landing_page.footer.linkedin')}
          ><LogoDiscord class="fill-blue-800" size={24} /></a
        >
      {/if}
      {#if $landingPageSettings.footer.linkedin}
        <a
          href={$landingPageSettings.footer.linkedin}
          target="_blank"
          title={$t('settings.landing_page.footer.linkedin')}
          ><LogoLinkedin class="fill-blue-800" size={24} /></a
        >
      {/if}
      {#if $landingPageSettings.footer.facebook}
        <a
          href={$landingPageSettings.footer.facebook}
          target="_blank"
          title={$t('settings.landing_page.footer.facebook')}
          ><LogoFacebook class="fill-blue-800" size={24} /></a
        >
      {/if}
    </ul>
    <a href="/#" class="hidden md:flex items-center gap-1">
      <p class=" text-[#0233BD] text-base underline font-semibold">Built on ClassroomIO</p>
    </a>
  </nav>
{/if}
