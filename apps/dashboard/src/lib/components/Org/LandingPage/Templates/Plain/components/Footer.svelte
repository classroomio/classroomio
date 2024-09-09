<script>
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { t } from '$lib/utils/functions/translations';
  import { LogoFacebook, LogoLinkedin, LogoTwitter } from 'carbon-icons-svelte';

  export let org = {};
</script>

{#if $landingPageSettings.footer.show}
  <footer
    id="footer"
    class="flex justify-center items-center flex-col my-10 w-full px-5 py-10 md:py-3 border-b-0 border-r-0 border-t border-l-0 border-gray-300"
  >
    <ul class="flex w-11/12 items-center flex-col sm:flex-row">
      <div class="logo">
        <a
          href="/"
          title={`Go to ${org.name} Home`}
          id="logo"
          data-hveid="8"
          class="flex items-center"
        >
          <img
            src={org.avatar_url || '/logo-192.png'}
            alt={`${org.name} logo`}
            class="rounded max-h-10 w-10 inline-block mx-auto"
            data-atf="1"
          />
          <h3 class="text-black ml-3 text-xl">{org.name}</h3>
        </a>
      </div>

      <span class="flex-grow" />

      <div class="flex mt-5 sm:mt-0 gap-2">
        {#if $landingPageSettings.footer.facebook}
          <li>
            <a
              href={$landingPageSettings.footer.facebook}
              target="_blank"
              title={$t('settings.landing_page.footer.facebook')}
              id="logo-fb"
              data-hveid="8"
            >
              <LogoFacebook size={24} />
            </a>
          </li>
        {/if}
        {#if $landingPageSettings.footer.twitter}
          <li>
            <a
              href={$landingPageSettings.footer.twitter}
              target="_blank"
              title={$t('settings.landing_page.footer.twitter')}
              id="logo-tw"
              data-hveid="8"
            >
              <LogoTwitter size={24} />
            </a>
          </li>
        {/if}

        {#if $landingPageSettings.footer.linkedin}
          <li>
            <a
              href={$landingPageSettings.footer.linkedin}
              target="_blank"
              title={$t('settings.landing_page.footer.linkedin')}
              id="logo-ln"
              data-hveid="8"
            >
              <LogoLinkedin size={24} />
            </a>
          </li>
        {/if}
      </div>
    </ul>
  </footer>
{/if}
