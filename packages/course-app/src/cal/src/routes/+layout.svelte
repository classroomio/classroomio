<script lang="ts">
  import { page } from '$app/stores';
  import { homePage, sharedPage } from '$lib/utils/stores/pages';
  import { courses } from '$lib/utils/stores/course';
  import { getPageSection } from '$lib/utils/helpers/page';
  import Footer from '$lib/components/Footer.svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  import Transition from '$lib/components/Transition.svelte';
  import type { Page, Section } from '$lib/utils/types/page';
  import type { Course } from '$lib/utils/types/course';

  import '../app.css';

  interface Props {
    children: import('svelte').Snippet;
    data: {
      page: Page;
      sharedPage: Page;
      courses: Course[];
    };
  }

  let { data, children }: Props = $props();

  let seo: Section | undefined;

  $effect.pre(() => {
    homePage.set(data.page);
    sharedPage.set(data.sharedPage);
    courses.set(data.courses);

    seo = getPageSection(data.sharedPage, 'seo');
  });
</script>

<svelte:head>
  <title>{seo?.settings.title}</title>
  <meta name="description" content={seo?.settings.description} />
</svelte:head>

{#if data.sharedPage}
  <main class="bg-[#EEEFE9] font-matter">
    <Transition>
      <!-- Navigation -->
      {#if !$page.url.pathname.includes('course/')}
        <Navigation
          seo={getPageSection(data.sharedPage, 'seo')}
          content={getPageSection(data.sharedPage, 'navigation')}
        />
      {/if}

      {@render children?.()}

      {#if !$page.url.pathname.includes('course/')}
        <Footer />
      {/if}
    </Transition>
  </main>
{/if}
