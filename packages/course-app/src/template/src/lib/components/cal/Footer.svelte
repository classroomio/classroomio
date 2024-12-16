<script lang="ts">
  import Logo from '$lib/components/ui/_custom/Logo.svelte';
  import { getPageSection } from '$lib/utils/helpers/page';
  import { sharedPage } from '$lib/utils/stores/pages';

  const content = $derived(getPageSection($sharedPage, 'footer'));
  const seo = $derived(getPageSection($sharedPage, 'seo'));
</script>

{#if content?.show}
  <nav class="w-full bg-[#F4F4F4] px-4 py-4 lg:px-14">
    <div
      class="flex w-full flex-col items-start gap-4 rounded-lg bg-[#2E2E2F] p-4 text-white md:flex-row md:items-center md:justify-between"
    >
      <Logo
        src={seo?.settings.logo}
        alt={seo?.settings.title}
        className="bg-white rounded-lg p-2 w-28"
      />

      <ul
        class="-md:gap-8 flex flex-col items-start gap-4 font-semibold capitalize underline md:flex-row md:items-center"
      >
        {#if content.settings.twitter}
          <a href={content.settings.twitter} target="_blank" title="twitter">Twitter</a>
        {/if}
        {#if content.settings.youtube}
          <a href={content.settings.youtube} target="_blank">Youtube</a>{/if}

        {#if content.settings.linkedin}
          <a href={content.settings.linkedin} target="_blank" title="linkedin">LinkedIn</a>
        {/if}
        {#if content.settings.facebook}
          <a href={content.settings.facebook} target="_blank" title="facebook">facebook</a>
        {/if}
      </ul>
      <a
        href="https://git.new/cio-template"
        target="_blank noopener noreferrer"
        class="flex w-full items-center justify-center gap-1 text-white hover:underline md:w-fit lg:justify-start"
      >
        <p class="text-base font-bold">Built with ❤️ by ClassroomIO</p>
      </a>
    </div>
  </nav>
{/if}
