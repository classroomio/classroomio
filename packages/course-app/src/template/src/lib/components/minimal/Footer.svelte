<script lang="ts">
  import { getPageSection } from '@/utils/helpers/page';
  import { sharedPage } from '@/utils/stores/pages';
  import Logo from '$lib/components/ui/_custom/Logo.svelte';
  import { SECTION } from '@/utils/constants/page';

  const content = $derived(getPageSection($sharedPage, SECTION.FOOTER));
  const seo = $derived(getPageSection($sharedPage, SECTION.SEO));
</script>

{#if content?.show}
  <nav
    class="flex w-full flex-col items-start gap-4 bg-white px-6 py-10 md:flex-row md:items-center md:justify-between"
  >
    <Logo src={seo?.settings.logo} alt={seo?.settings.title} />

    <ul
      class="-md:gap-8 flex flex-col items-start gap-4 font-semibold capitalize underline md:flex-row md:items-center"
    >
      {#if content.settings.twitter}
        <a href={content.settings.twitter} target="_blank" title="twitter">Twitter</a>
      {/if}
      {#if content.settings?.youtube}
        <a href={content.settings?.youtube} target="_blank">Youtube</a>
      {/if}

      {#if content.settings.linkedin}
        <a href={content.settings.linkedin} target="_blank" title="linkedin">LinkedIn</a>
      {/if}
      {#if content.settings.facebook}
        <a href={content.settings.facebook} target="_blank" title="facebook">Facebook</a>
      {/if}
    </ul>
    <a
      href="https://classroomio.com"
      target="_blank"
      rel="noopener noreferrer"
      class="text-minimal flex items-center gap-1 hover:underline dark:text-white"
    >
      <p class="text-base font-semibold">Built on ClassroomIO</p>
    </a>
  </nav>
{/if}
