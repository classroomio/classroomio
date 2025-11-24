<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
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

<Avatar.Root class="flex size-8 items-center justify-center rounded-lg">
  <Avatar.Image {src} alt={name} class="{className} {width} {height} {shape}" />
</Avatar.Root>
