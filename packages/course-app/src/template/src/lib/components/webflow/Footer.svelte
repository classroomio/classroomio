<script lang="ts">
  import { getPageSection } from '$lib/utils/helpers/page';
  import { sharedPage } from '$lib/utils/stores/pages';
  import Logo from '$lib/components/ui/_custom/Logo.svelte';
  import { SECTION } from '@/utils/constants/page';

  const content = $derived(getPageSection($sharedPage, SECTION.FOOTER));
  const seo = $derived(getPageSection($sharedPage, SECTION.SEO));
</script>

{#if content?.show}
  <nav
    class="flex w-full flex-col items-start gap-4 bg-black px-6 py-4 text-white md:flex-row-reverse md:items-center md:justify-between"
  >
    <div class="w-fit rounded-md bg-white p-2">
      <Logo src={seo?.settings.logo} alt={seo?.settings.title} />
    </div>
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
      class="flex items-center gap-1 text-blue-600 hover:underline dark:text-white"
    >
      <p class="text-base font-semibold">Built on ClassroomIO</p>
    </a>
  </nav>
{/if}
