<script lang="ts">
  interface Props {
    name?: string;
    src?: string;
    className?: string;
    shape?: string;
    width?: string;
    height?: string;
  }

  let {
    name = '',
    src = '',
    className = '',
    shape = 'rounded-full',
    width = 'w-10',
    height = 'h-10'
  }: Props = $props();
</script>

<img alt={name} {src} class="{className} {width} {height} {shape}" />
