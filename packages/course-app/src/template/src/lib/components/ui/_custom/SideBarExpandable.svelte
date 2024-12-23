<script lang="ts">
  import { page } from '$app/stores';
  import Folder from '$lib/components/ui/folder/folder.svelte';
  import type { Section } from '$lib/utils/types/course';

  interface Props {
    sections: Section[];
    onFileClick: () => void;
  }

  let { sections, onFileClick }: Props = $props();

  let [, courseSlug, sectionSlug, lessonSlug] = $derived($page.url.pathname.split('/').slice(1));

  let root = $derived(
    sections.map((section) => ({
      type: 'folder',
      name: section.title,
      expanded: section.sectionSlug === sectionSlug,
      isPublished: section.published,
      files: section.children.map((lesson) => ({
        type: 'file',
        name: lesson.title,
        isActive: lesson.filename === lessonSlug && section.sectionSlug === sectionSlug,
        href: `/course/${courseSlug}/${section.sectionSlug}/${lesson.filename}`
      }))
    }))
  );
</script>

<div class="h-full">
  <Folder name="Lessons" files={root} {onFileClick} />
</div>
