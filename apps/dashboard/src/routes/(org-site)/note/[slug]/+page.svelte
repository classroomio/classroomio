<script lang="ts">
  import { page } from '$app/state';
  import { PublicCourse } from '@cio/ui';
  import { TextEditor } from '$features/ui';
  import NoteSubpages from '$features/notes/components/note-subpages.svelte';
  import { displayNoteTitle } from '$features/notes/utils/note-list-utils';
  import { t } from '$lib/utils/functions/translations';
  import type { PublicCourseOrgData } from '@cio/ui/custom/public-course';

  let { data } = $props();

  const note = $derived(data.note);
  const noteTitle = $derived(displayNoteTitle(note.title));
  const org = $derived<PublicCourseOrgData>({
    id: note.org.id,
    name: note.org.name,
    siteName: note.org.siteName,
    avatarUrl: note.org.avatarUrl
  });

  const updatedLabel = $derived(
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(new Date(note.updatedAt))
  );

  const signInHref = $derived(`/login?redirect=${encodeURIComponent(page.url.pathname + page.url.search)}`);

  const hrefForSlug = (slug: string) => `/note/${slug}`;

  /** Ancestors only — current page title lives in the article H1. */
  const breadcrumbs = $derived(
    note.breadcrumbs.slice(0, -1).map((crumb) => ({
      label: displayNoteTitle(crumb.title),
      href: hrefForSlug(crumb.slug)
    }))
  );

  const subpages = $derived(
    note.children.map((child) => ({
      id: child.id,
      title: child.title,
      sortOrder: child.sortOrder
    }))
  );
</script>

<PublicCourse.PublicSiteShell
  {org}
  {breadcrumbs}
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
      {#if note.ownerFullname}
        <p class="ui:text-muted-foreground text-sm">
          {note.org.name} · {note.ownerFullname}
        </p>
      {/if}
    </header>

    <TextEditor content={note.content} editable={false} showToolBar={false} class="border-0" />

    <NoteSubpages
      noteId={note.id}
      children={subpages}
      noteHref={(childId) => {
        const child = note.children.find((item) => item.id === childId);
        return child ? hrefForSlug(child.slug) : hrefForSlug(note.slug);
      }}
    />
  </article>
</PublicCourse.PublicSiteShell>
