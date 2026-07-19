<script lang="ts">
  import { page } from '$app/state';
  import { PublicCourse } from '@cio/ui';
  import { TextEditor } from '$features/ui';
  import { displayNoteTitle } from '$features/notes/utils/note-list-utils';
  import { t } from '$lib/utils/functions/translations';
  import type { PublicCourseOrgData } from '@cio/ui/custom/public-course';

  let { data } = $props();

  const noteTitle = $derived(displayNoteTitle(data.note.title));
  const org = $derived<PublicCourseOrgData>({
    id: data.note.org.id,
    name: data.note.org.name,
    siteName: data.note.org.siteName,
    avatarUrl: data.note.org.avatarUrl
  });

  const updatedLabel = $derived(
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(new Date(data.note.updatedAt))
  );

  const signInHref = $derived(`/login?redirect=${encodeURIComponent(page.url.pathname + page.url.search)}`);
</script>

<PublicCourse.PublicSiteShell
  {org}
  pageTitle={noteTitle}
  homeHref="/"
  exploreHref="/"
  exploreLabel={$t('public_course.header.view_academy')}
  {signInHref}
  signInLabel={$t('public_course.header.sign_in')}
  poweredByLabel={$t('public_course.powered_by.label')}
  poweredByBrand={$t('public_course.powered_by.brand')}
>
  <article class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
    <header class="space-y-2 text-center">
      <p class="ui:text-muted-foreground text-sm">{updatedLabel}</p>
      <h1 class="text-3xl font-bold tracking-tight">{noteTitle}</h1>
      {#if data.note.ownerFullname}
        <p class="ui:text-muted-foreground text-sm">
          {data.note.org.name} · {data.note.ownerFullname}
        </p>
      {/if}
    </header>

    <TextEditor content={data.note.content} editable={false} showToolBar={false} class="border-0" />
  </article>
</PublicCourse.PublicSiteShell>
