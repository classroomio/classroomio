<script lang="ts">
  import LogoX from 'carbon-icons-svelte/lib/LogoX.svelte';
  import LogoDiscord from 'carbon-icons-svelte/lib/LogoDiscord.svelte';
  import LogoFacebook from 'carbon-icons-svelte/lib/LogoFacebook.svelte';
  import LogoLinkedin from 'carbon-icons-svelte/lib/LogoLinkedin.svelte';
  import LogoInstagram from 'carbon-icons-svelte/lib/LogoInstagram.svelte';
  import { LogoYoutube } from 'carbon-icons-svelte';
  import navLogo from './assets/static/logo-192.png';
  import { getPageSection } from '@/utils/helpers/page';
  import { sharedPage } from '@/utils/stores/pages';

  const content = $derived(getPageSection($sharedPage, 'footer'));
  const seo = $derived(getPageSection($sharedPage, 'seo'));
</script>

{#if content?.show}
  <nav
    class="bg-white w-full flex flex-col md:flex-row items-start md:items-center gap-4 md:justify-between py-4 px-6"
  >
    <div class="logo w-full md:w-fit flex items-center justify-between">
      <a href="/" title={`Go to ${seo?.settings.title} Home`} id="logo" data-hveid="8">
        <img
          src={seo?.settings.logo || navLogo}
          alt={`${seo?.settings.title || 'ClassroomIO'} logo`}
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
      {#if content.settings.instagram}
        <a href={content.settings.instagram} target="_blank" title="instragram"
          ><LogoInstagram class="fill-red-500 " size={24} /></a
        >
      {/if}
      {#if content.settings.twitter}
        <a href={content.settings.twitter} target="_blank" title="twitter"><LogoX /></a>
      {/if}
      {#if content.settings?.youtube}
        <a href={content.settings?.youtube} target="_blank"
          ><LogoYoutube class="fill-red-700" size={24} /></a
        >{/if}
      {#if content.settings?.discord}
        <a href={content.settings.discord} target="_blank" title="discord"
          ><LogoDiscord class="fill-blue-800" size={24} /></a
        >
      {/if}
      {#if content.settings.linkedin}
        <a href={content.settings.linkedin} target="_blank" title="linkedin"
          ><LogoLinkedin class="fill-blue-800" size={24} /></a
        >
      {/if}
      {#if content.settings.facebook}
        <a href={content.settings.facebook} target="_blank" title="facebook"
          ><LogoFacebook class="fill-blue-800" size={24} /></a
        >
      {/if}
    </ul>
    <a href="/#" class="hidden md:flex items-center gap-1">
      <p class=" text-[#0233BD] text-base underline font-semibold">Built on ClassroomIO</p>
    </a>
  </nav>
{/if}
