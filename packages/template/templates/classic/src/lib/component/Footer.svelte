<script lang="ts">
  import LogoX from 'carbon-icons-svelte/lib/LogoX.svelte';
  import LogoDiscord from 'carbon-icons-svelte/lib/LogoDiscord.svelte';
  import LogoFacebook from 'carbon-icons-svelte/lib/LogoFacebook.svelte';
  import LogoLinkedin from 'carbon-icons-svelte/lib/LogoLinkedin.svelte';
  import LogoInstagram from 'carbon-icons-svelte/lib/LogoInstagram.svelte';
  import { LogoYoutube } from 'carbon-icons-svelte';
  interface Props {
    logo?: string;
    orgName?: string;
    data: any;
  }

  let { logo = '', orgName = '', data }: Props = $props();
</script>

{#if data.footer.show}
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
      {#if data.footer?.instagram}
        <a href={data.footer.instagram} target="_blank" title="instragram"
          ><LogoInstagram class="fill-red-500 " size={24} /></a
        >
      {/if}
      {#if data.footer.twitter}
        <a href={data.footer.twitter} target="_blank" title="twitter"><LogoX /></a>
      {/if}
      {#if data.footer?.youtube}
        <a href={data.footer?.youtube} target="_blank"
          ><LogoYoutube class="fill-red-700" size={24} /></a
        >{/if}
      {#if data.footer?.discord}
        <a href={data.footer.discord} target="_blank" title="discord"
          ><LogoDiscord class="fill-blue-800" size={24} /></a
        >
      {/if}
      {#if data.footer.linkedin}
        <a href={data.footer.linkedin} target="_blank" title="linkedin"
          ><LogoLinkedin class="fill-blue-800" size={24} /></a
        >
      {/if}
      {#if data.footer.facebook}
        <a href={data.footer.facebook} target="_blank" title="facebook"
          ><LogoFacebook class="fill-blue-800" size={24} /></a
        >
      {/if}
    </ul>
    <a href="/#" class="hidden md:flex items-center gap-1">
      <p class=" text-[#0233BD] text-base underline font-semibold">Built on ClassroomIO</p>
    </a>
  </nav>
{/if}
