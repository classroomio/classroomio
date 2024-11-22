<script lang="ts">
  import { onMount } from 'svelte';
  import { homePage, sharedPage } from '$lib/utils/stores/pages';
  import { courses } from '$lib/utils/stores/course';
  import { getPageSection } from '$lib/utils/helpers/page';
  import Footer from '$lib/components/Footer.svelte';
  import Navigation from '$lib/components/Navigation.svelte';
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

  const seo: Section | undefined = $derived(getPageSection(data.sharedPage, 'seo'));

  $effect(() => {
    console.log('setting data in effect', data);
    homePage.set(data.page);
    sharedPage.set(data.sharedPage);
    courses.set(data.courses);
  });

  onMount(() => {
    console.log('data', data);
  });
</script>

<svelte:head>
  <title>{seo?.settings.title}</title>
  <meta name="description" content={seo?.settings.description} />
</svelte:head>

{#if data.sharedPage}
  <main class="bg-[#EEEFE9] font-matter">
    <!-- Navigation -->
    <Navigation
      seo={getPageSection(data.sharedPage, 'seo')}
      content={getPageSection(data.sharedPage, 'navigation')}
    />
    {@render children?.()}

    <Footer />
  </main>
{/if}
