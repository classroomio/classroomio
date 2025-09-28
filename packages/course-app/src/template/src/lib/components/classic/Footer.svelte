<script lang="ts">
  import LogoX from 'carbon-icons-svelte/lib/LogoX.svelte';
  import LogoDiscord from 'carbon-icons-svelte/lib/LogoDiscord.svelte';
  import LogoFacebook from 'carbon-icons-svelte/lib/LogoFacebook.svelte';
  import LogoLinkedin from 'carbon-icons-svelte/lib/LogoLinkedin.svelte';
  import LogoInstagram from 'carbon-icons-svelte/lib/LogoInstagram.svelte';
  import { LogoYoutube } from 'carbon-icons-svelte';
  import Logo from '$lib/components/ui/_custom/Logo.svelte';

  import { getPageSection } from '@/utils/helpers/page';
  import { sharedPage } from '@/utils/stores/pages';
  import { SECTION } from '@/utils/constants/page';

  const content = $derived(getPageSection($sharedPage, SECTION.FOOTER));
  const seo = $derived(getPageSection($sharedPage, SECTION.SEO));
</script>

{#if content?.show}
  <nav
    class="flex w-full flex-col items-start gap-4 bg-white px-6 py-4 md:flex-row md:items-center md:justify-between"
  >
    <div class="logo flex w-full items-center justify-between md:w-fit">
      <Logo src={seo?.settings.logo} alt={seo?.settings.title} />

      <a
        href="https://classroomio.com"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1 md:hidden"
      >
        <p class="text-base font-semibold text-[#0233BD] underline">Built on ClassroomIO</p>
      </a>
    </div>
    <ul
      class="mx-auto my-4 flex flex-row items-center justify-center gap-8 rounded-full border px-6 py-2 underline md:my-0"
    >
      {#if content.settings.instagram}
        <a href={content.settings.instagram} target="_blank" title="instragram">
          <LogoInstagram class="fill-red-500 " size={24} />
        </a>
      {/if}
      {#if content.settings.twitter}
        <a href={content.settings.twitter} target="_blank" title="twitter"><LogoX /></a>
      {/if}
      {#if content.settings?.youtube}
        <a href={content.settings?.youtube} target="_blank">
          <LogoYoutube class="fill-red-700" size={24} />
        </a>
      {/if}
      {#if content.settings?.discord}
        <a href={content.settings.discord} target="_blank" title="discord">
          <LogoDiscord class="fill-blue-800" size={24} />
        </a>
      {/if}
      {#if content.settings.linkedin}
        <a href={content.settings.linkedin} target="_blank" title="linkedin">
          <LogoLinkedin class="fill-blue-800" size={24} />
        </a>
      {/if}
      {#if content.settings.facebook}
        <a href={content.settings.facebook} target="_blank" title="facebook">
          <LogoFacebook class="fill-blue-800" size={24} />
        </a>
      {/if}
    </ul>
    <a
      href="https://classroomio.com"
      target="_blank"
      rel="noopener noreferrer"
      class="hidden items-center gap-1 md:flex"
    >
      <p class="text-base font-semibold text-[#0233BD] underline">Built on ClassroomIO</p>
    </a>
  </nav>
{/if}
