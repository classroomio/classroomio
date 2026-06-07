<script lang="ts">
  import type { Component } from 'svelte';
  import { resolve } from '$app/paths';
  import get from 'lodash/get';

  import { currentOrg } from '$lib/utils/store/org';
  import { basePath } from '$lib/utils/store/app';
  import { user } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { importCourseLandingPageTheme, normalizeLandingPageSettings } from '$features/org/utils/landing-page';
  import type { Course } from '$features/course/utils/types';
  import type { AccountOrg } from '$features/app/types';
  import UploadWidget from '$features/ui/upload-widget/upload-widget.svelte';
  import { buildCourseLandingPageProps } from './utils';
  import { handleOpenWidget } from './store';

  interface Props {
    editMode?: boolean;
    courseData: Course;
    org?: AccountOrg | null;
    /** Pre-resolved theme component from the route's load function (eliminates the flash on SSR pages). */
    themeComponent?: Component | null;
  }

  let { editMode = false, courseData = $bindable(), org = null, themeComponent = null }: Props = $props();

  const activeOrg = $derived(org ?? $currentOrg);
  const landingSettings = $derived(normalizeLandingPageSettings(activeOrg.landingpage));

  const authAction = $derived(
    $user.isLoggedIn
      ? {
          label: t.get($basePath === '/lms' || $basePath === '#' ? 'navigation.goto_lms' : 'navigation.goto_dashboard'),
          href: resolve($basePath !== '#' ? $basePath : '/lms', {})
        }
      : {
          label: t.get('navigation.login'),
          href: '/login'
        }
  );

  const enrollHref = $derived.by(() => {
    const slug = typeof courseData.slug === 'string' && courseData.slug.length > 0 ? courseData.slug : '';
    return slug ? resolve(`/course/${slug}/enroll`, {}) : '#';
  });

  const enrollmentsOpen = $derived(get(courseData, 'metadata.allowNewStudent') === true);
  const enrollDisabled = $derived(editMode || !enrollmentsOpen);

  const landingProps = $derived(
    buildCourseLandingPageProps(courseData, activeOrg, {
      enrollHref,
      enrollDisabled,
      authAction
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ThemeComponent = $state<Component<any> | null>(themeComponent);

  $effect(() => {
    // Skip client-side loading if the theme was already resolved server-side.
    if (ThemeComponent) return;

    const theme = landingSettings.theme;
    let cancelled = false;

    void importCourseLandingPageTheme(theme).then((mod) => {
      if (!cancelled) {
        ThemeComponent = mod.default;
      }
    });

    return () => {
      cancelled = true;
    };
  });
</script>

{#if ThemeComponent}
  {#if editMode && $handleOpenWidget.open}
    <div class="mx-auto w-full max-w-7xl px-6 py-3">
      <UploadWidget imageURL={courseData.logo} onchange={(newLogo) => (courseData.logo = newLogo)} />
    </div>
  {/if}
  <svelte:component this={ThemeComponent} {...landingProps} />
{/if}
