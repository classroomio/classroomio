<script lang="ts">
  import { layoutChangelogTitle } from '@cio/utils/functions/changelog-cover';
  import { cn } from '../../tools';

  interface Props {
    title: string;
    label?: string;
    footer?: string;
    class?: string;
  }

  let { title, label = 'Changelog', footer = '', class: className }: Props = $props();

  const TITLE_TOP = 200;
  const TITLE_AREA_HEIGHT = 460;
  const SANS = 'Geist, ui-sans-serif, system-ui, sans-serif';
  const MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

  const layout = $derived(layoutChangelogTitle(title));
  const firstBaseline = $derived(
    TITLE_TOP + (TITLE_AREA_HEIGHT - layout.lines.length * layout.lineHeight) / 2 + layout.fontSize * 0.8
  );
</script>

<svg
  class={cn('ui:block ui:h-full ui:w-full', className)}
  viewBox="0 0 1600 838"
  preserveAspectRatio="xMidYMin slice"
  role="img"
  aria-label={title}
>
  <rect width="1600" height="838" fill="#F1EEE7" />

  <g transform="translate(100 100) scale(0.078) translate(-55 -180)" fill="#0233BD">
    <path d="M385 180 H518 Q528 180 528 190 V836 Q528 846 518 846 H385 A333 333 0 0 1 385 180 Z" />
    <circle cx="796" cy="353" r="173" />
    <path
      d="M748 595 H961 Q971 595 971 605 V836 Q971 846 961 846 H601 Q591 846 591 836 V752 A157 157 0 0 1 748 595 Z"
    />
  </g>
  <text
    x="188"
    y="140"
    font-family={SANS}
    font-size="38"
    font-weight="700"
    fill="#17140F"
    style="letter-spacing: -0.03em"
  >
    classroomio
  </text>
  {#if label}
    <text
      x="1500"
      y="136"
      text-anchor="end"
      font-family={MONO}
      font-size="24"
      fill="#6B6152"
      style="letter-spacing: 0.12em; text-transform: uppercase"
    >
      {label}
    </text>
  {/if}

  <text font-family={SANS} font-size={layout.fontSize} font-weight="800" fill="#17140F" style="letter-spacing: -0.05em">
    {#each layout.lines as line, index (index)}
      <tspan x="100" y={firstBaseline + index * layout.lineHeight}>{line}</tspan>
    {/each}
  </text>

  <line x1="100" y1="704" x2="1500" y2="704" stroke="#CFC5B3" stroke-width="2" />
  {#if footer}
    <text
      x="100"
      y="748"
      font-family={MONO}
      font-size="24"
      fill="#6B6152"
      style="letter-spacing: 0.12em; text-transform: uppercase"
    >
      {footer}
    </text>
  {/if}
</svg>
