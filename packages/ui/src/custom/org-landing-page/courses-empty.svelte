<script lang="ts">
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';
  import { Empty } from '../empty';
  import type { OrgLandingPageLabels } from './types';

  interface Props {
    labels?: OrgLandingPageLabels;
    class?: string;
  }

  let { labels, class: className = '' }: Props = $props();

  const title = $derived(labels?.catalogEmptyTitle ?? 'No courses published yet');
  const description = $derived(labels?.catalogEmptyDescription ?? 'Check back soon for new programs.');
</script>

<div
  class="ui:[&_[data-slot=empty-title]]:text-[var(--landing-fg)] ui:[&_[data-slot=empty-description]]:text-[var(--landing-fg-muted)] {className}"
>
  <Empty
    icon={LibraryBigIcon}
    {title}
    {description}
    variant="page"
    class="ui:border-[var(--landing-border)] ui:bg-[var(--landing-card-soft)]/40"
    iconClass="ui:text-[var(--landing-fg-muted)]"
  />
</div>
