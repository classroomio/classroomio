<script lang="ts">
  interface Props {
    sm?: number;
    md?: number;
    lg?: number;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { sm = 8, md = 8, lg = 8, class: className = '', children }: Props = $props();

  const getColSpan = (cols: number) => {
    const spanMap = {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12',
      13: 'col-span-13',
      14: 'col-span-14',
      15: 'col-span-15',
      16: 'col-span-16'
    };
    return spanMap[cols] || 'col-span-full';
  };

  const smClass = getColSpan(sm);
  const mdClass = `md:${getColSpan(md)}`;
  const lgClass = `lg:${getColSpan(lg)}`;
</script>

<div class="{smClass} {mdClass} {lgClass} {className} grid">
  {@render children?.()}
</div>
