<script lang="ts">
  import * as Avatar from '../../base/avatar';

  interface Props {
    src?: string | null;
    alt?: string;
    class?: string;
    iconClass?: string;
  }

  let { src, alt = 'User', class: className = 'size-6', iconClass = '' }: Props = $props();
</script>

<Avatar.Root class={className}>
  {#if src}
    <Avatar.Image {src} {alt} />
  {/if}
  <Avatar.Fallback>
    <img src="/images/avatar.svg" alt="User avatar" class="size-10 rounded-md {iconClass}" />
  </Avatar.Fallback>
</Avatar.Root>
