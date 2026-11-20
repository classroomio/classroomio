<script lang="ts">
  import { cn } from '../../tools';

  interface OwnerEditBarLink {
    href: string;
    label: string;
    primary?: boolean;
  }

  interface Props {
    label: string;
    regionLabel: string;
    links: OwnerEditBarLink[];
    testId?: string;
    class?: string;
  }

  let { label, regionLabel, links, testId = 'academy-edit-bar', class: className = '' }: Props = $props();
</script>

<div
  role="region"
  aria-label={regionLabel}
  data-testid={testId}
  class={cn(
    'ui:bg-background/90 ui:text-foreground ui:border-foreground/10 ui:fixed ui:bottom-4 ui:left-1/2 ui:z-50 ui:flex ui:w-max ui:max-w-[calc(100vw-32px)] ui:-translate-x-1/2 ui:flex-wrap ui:items-center ui:justify-center ui:gap-1.5 ui:rounded-[22px] ui:border ui:py-1.5 ui:pr-1.5 ui:pl-3.5 ui:text-[13px] ui:shadow-[0_8px_24px_rgb(23_20_15/0.16)] ui:backdrop-blur-md ui:backdrop-saturate-150',
    className
  )}
>
  <span class="ui:text-muted-foreground ui:font-medium ui:whitespace-nowrap">{label}</span>
  {#each links as link (link.href)}
    <a
      href={link.href}
      data-testid="academy-edit-bar-link"
      class={cn(
        'ui:focus-visible:ring-ring ui:inline-flex ui:items-center ui:rounded-full ui:px-3 ui:py-1.5 ui:font-medium ui:whitespace-nowrap ui:no-underline ui:transition-colors ui:focus-visible:ring-2 ui:focus-visible:outline-none ui:motion-reduce:transition-none',
        link.primary
          ? 'ui:bg-foreground ui:text-background ui:hover:bg-foreground/85'
          : 'ui:text-foreground ui:hover:bg-foreground/[0.08]'
      )}
    >
      {link.label}
    </a>
  {/each}
</div>
