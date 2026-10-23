<script lang="ts">
  interface Props {
    values: Array<number | null>;
    label: string;
  }

  let { values, label }: Props = $props();

  const WIDTH = 88;
  const HEIGHT = 26;
  const PADDING = 3;

  const points = $derived(
    values.flatMap((value, index) => {
      if (value === null) return [];

      const x = PADDING + (index * (WIDTH - 2 * PADDING)) / Math.max(values.length - 1, 1);
      const y = PADDING + (1 - value / 100) * (HEIGHT - 2 * PADDING);

      return [{ x, y }];
    })
  );
  const path = $derived(
    points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  );
  const lastPoint = $derived(points.at(-1));
</script>

{#if points.length >= 2 && lastPoint}
  <svg
    viewBox="0 0 {WIDTH} {HEIGHT}"
    width={WIDTH}
    height={HEIGHT}
    role="img"
    aria-label={label}
    class="ui:text-primary"
  >
    <path d={path} fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" />
    <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" fill="currentColor" />
  </svg>
{:else}
  <span class="ui:text-muted-foreground">–</span>
{/if}
