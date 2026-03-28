<script lang="ts">
  import * as Avatar from '../../base/avatar';
  import UserIcon from '@lucide/svelte/icons/user';

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
    <UserIcon class="ui:text-muted-foreground {iconClass || 'h-1/2 w-1/2'}" />
  </Avatar.Fallback>
</Avatar.Root>
