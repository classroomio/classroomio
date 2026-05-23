<script lang="ts">
  import type { CourseItem, OrgLandingPageLabels } from '../types';

  interface Props {
    course: CourseItem;
    disableCourseLinks?: boolean;
    labels?: OrgLandingPageLabels;
  }

  let { course, disableCourseLinks = false, labels }: Props = $props();

  const href = $derived.by(() => {
    if (disableCourseLinks) return undefined;
    return course.link || (course.slug ? `/course/${course.slug}` : undefined);
  });

  function slugify(c: CourseItem): string {
    if (c.slug) return c.slug;
    return c.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function priceLabel(c: CourseItem): string {
    if (c.price) return c.price;
    if (!c.cost) return labels?.freeLabel ?? 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: c.currency ?? 'USD',
      maximumFractionDigits: 0
    }).format(c.cost);
  }
</script>

<a
  {href}
  aria-disabled={disableCourseLinks}
  tabindex={disableCourseLinks ? -1 : undefined}
  class="ui:relative ui:flex ui:flex-col ui:gap-2.5 ui:p-6 ui:rounded-xl ui:no-underline ui:transition-colors ui:h-full ui:text-[var(--landing-fg)] {disableCourseLinks
    ? ''
    : 'ui:cursor-pointer'}"
  style="
    background: linear-gradient(180deg, var(--landing-card) 0%, var(--landing-bg-section) 100%);
    border: 1px solid var(--landing-border-soft);
    min-height: 180px;
    cursor: {disableCourseLinks ? 'default' : 'pointer'};
  "
  onmouseenter={(e) => !disableCourseLinks && (e.currentTarget.style.borderColor = 'var(--landing-border)')}
  onmouseleave={(e) => (e.currentTarget.style.borderColor = 'var(--landing-border-soft)')}
>
  <span class="ui:font-mono ui:text-[11px] ui:tracking-[0.04em]" style="color: var(--landing-accent);">
    $ {slugify(course)}
  </span>
  <h3
    class="ui:text-[17px] ui:font-semibold ui:leading-snug ui:m-0 ui:text-[var(--landing-fg)]"
    style="letter-spacing: -0.01em;"
  >
    {course.title}
  </h3>
  <p class="ui:text-[13.5px] ui:leading-[1.5] ui:m-0 ui:flex-1 ui:line-clamp-3 ui:text-[var(--landing-fg-muted)]">
    {course.description}
  </p>
  <div
    class="ui:flex ui:items-center ui:justify-between ui:pt-3.5 ui:font-mono ui:text-[12px]"
    style="border-top: 1px dashed var(--landing-border-soft);"
  >
    <span class="ui:text-[var(--landing-fg)]">{priceLabel(course)}</span>
    <span aria-hidden="true" class="ui:text-[var(--landing-fg-muted)]">→</span>
  </div>
</a>
