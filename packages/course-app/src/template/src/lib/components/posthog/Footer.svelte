<script lang="ts">
  import { getPageSection } from '$lib/utils/helpers/page';
  import { sharedPage } from '$lib/utils/stores/pages';

  const content = $derived(getPageSection($sharedPage, 'footer'));
  const seo = $derived(getPageSection($sharedPage, 'seo'));

  /**
   * Constants
   */
</script>

{#if content?.show}
  <nav
    class="w-full flex flex-col md:flex-row items-start md:items-center gap-4 md:justify-between py-4 px-6"
  >
    <div class="logo">
      <a href="/" title={`Go to ${seo?.settings.title} Home`} id="logo" data-hveid="8">
        <img
          src={seo?.settings.logo}
          alt={`${seo?.settings.title} logo`}
          class="rounded w-9 inline-block mx-auto"
          data-atf="1"
        />
      </a>
    </div>
    <ul
      class="flex flex-col md:flex-row items-start md:items-center gap-4 -md:gap-8 font-semibold capitalize underline"
    >
      {#if content.settings.twitter}
        <a href={content.settings.twitter} target="_blank" title="twitter">Twitter</a>
      {/if}
      {#if content.settings?.youtube}
        <a href={content.settings?.youtube} target="_blank">Youtube</a>{/if}

      {#if content.settings.linkedin}
        <a href={content.settings.linkedin} target="_blank" title="linkedin">LinkedIn</a>
      {/if}
      {#if content.settings.facebook}
        <a href={content.settings.facebook} target="_blank" title="facebook">Facebook</a>
      {/if}
    </ul>
    <a
      href="www.classroomio.com"
      class="flex items-center hover:underline text-[#0233BD] dark:text-white gap-1"
      target="_blank"
      rel="noopener noreferrer"
    >
      <p class="text-base font-semibold">Built on ClassroomIO</p>
    </a>
  </nav>
{/if}
