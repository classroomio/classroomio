<script lang="ts">
  import { UserAvatar } from '../user-avatar';
  import { Badge } from '../../base/badge';

  interface Props {
    avatarUrl?: string | null;
    fullname?: string | null;
    createdAt?: string | null;
    dateLabel?: string | null;
    roleBadge?: string | null;
    avatarSize?: string;
    class?: string;
  }

  let {
    avatarUrl,
    fullname = '',
    createdAt,
    dateLabel,
    roleBadge,
    avatarSize = 'ui:size-8',
    class: className = ''
  }: Props = $props();

  const displayDate = $derived(dateLabel || createdAt || '');
</script>

<div class="ui:flex ui:items-center ui:gap-2.5 {className}">
  <UserAvatar src={avatarUrl || undefined} alt={fullname || 'User Avatar'} class={avatarSize} />
  <div class="ui:flex ui:items-center ui:gap-2">
    {#if fullname}
      <span class="ui:text-sm ui:font-semibold ui:capitalize ui:text-foreground">{fullname}</span>
    {/if}
    {#if roleBadge}
      <Badge variant="secondary" class="ui:text-[10px] ui:px-1.5 ui:py-0.5">{roleBadge}</Badge>
    {/if}
    {#if displayDate}
      <span class="ui:text-xs ui:font-normal ui:text-muted-foreground">{displayDate}</span>
    {/if}
  </div>
</div>
<!-- HMR trigger -->
