<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    /** Course slug for attribution (passed as ?utm_source=...&utm_content=...). */
    courseSlug?: string | null;
    /** Org siteName (or org name) for attribution. */
    orgSlug?: string | null;
    /** Localized label. */
    label?: string;
    /** Localized "ClassroomIO" brand label. */
    brand?: string;
    class?: string;
  }

  let {
    courseSlug = null,
    orgSlug = null,
    label = 'Powered by',
    brand = 'ClassroomIO',
    class: className
  }: Props = $props();

  const href = $derived.by(() => {
    const url = new URL('https://classroomio.com');

    url.searchParams.set('utm_source', 'public-course');
    url.searchParams.set('utm_medium', 'powered-by');

    if (orgSlug) url.searchParams.set('utm_campaign', orgSlug);
    if (courseSlug) url.searchParams.set('utm_content', courseSlug);

    return url.toString();
  });
</script>

<div
  class={cn(
    'ui:px-3 ui:flex ui:items-center ui:justify-center ui:gap-1 ui:py-3 ui:text-xs ui:text-muted-foreground ui:w-full',
    className
  )}
>
  <img src="/logo-192.png" class="ui:size-6" alt="ClassroomIO" />
  {label}
  <a
    {href}
    target="_blank"
    rel="noopener noreferrer"
    class="ui:font-medium ui:text-muted-foreground ui:underline-offset-2 ui:hover:text-foreground ui:underline"
  >
    {brand}
  </a>
</div>
