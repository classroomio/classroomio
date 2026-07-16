<script lang="ts">
  import { PoweredBy } from '$features/ui';
  import { TextEditor } from '$features/ui';
  import { displayNoteTitle } from '$features/notes/utils/note-list-utils';

  let { data } = $props();

  const noteTitle = $derived(displayNoteTitle(data.note.title));
  const updatedLabel = $derived(
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(new Date(data.note.updatedAt))
  );
</script>

<PoweredBy />

<article class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
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
