<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Button } from '@cio/ui/base/button';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import ListFilterIcon from '@lucide/svelte/icons/list-filter';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { courseCommentsApi } from '../api/course-comments.svelte';
  import { commentsPanel } from '../store/comments-panel.svelte';

  const isOpenChecked = $derived(commentsPanel.status.unread || commentsPanel.status.read);

  function setResolved(checked: boolean) {
    commentsPanel.status.resolved = checked;
    if (checked) void courseCommentsApi.loadResolved();
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <span class="relative inline-flex">
        <Button
          {...props}
          variant="secondary"
          size="icon-sm"
          title={$t('course_comments.panel.filter')}
          aria-label={$t('course_comments.panel.filter')}
          testId="course-comments-filter"
        >
          <ListFilterIcon class="size-4" />
        </Button>
        {#if commentsPanel.isFiltered}
          <span
            class="ui:bg-primary pointer-events-none absolute -top-0.5 -right-0.5 size-2 rounded-full"
            aria-hidden="true"
          ></span>
        {/if}
      </span>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="w-60">
    <DropdownMenu.Label>{$t('course_comments.filter.status')}</DropdownMenu.Label>
    <DropdownMenu.CheckboxItem
      checked={isOpenChecked}
      closeOnSelect={false}
      onCheckedChange={(checked) => commentsPanel.setOpenFilter(checked)}
    >
      {$t('course_comments.filter.open')}
    </DropdownMenu.CheckboxItem>
    <DropdownMenu.CheckboxItem bind:checked={commentsPanel.status.unread} closeOnSelect={false} class="pl-12">
      {$t('course_comments.filter.unread')}
    </DropdownMenu.CheckboxItem>
    <DropdownMenu.CheckboxItem bind:checked={commentsPanel.status.read} closeOnSelect={false} class="pl-12">
      {$t('course_comments.filter.read')}
    </DropdownMenu.CheckboxItem>
    <DropdownMenu.CheckboxItem
      checked={commentsPanel.status.resolved}
      closeOnSelect={false}
      onCheckedChange={setResolved}
    >
      {$t('course_comments.filter.resolved')}
    </DropdownMenu.CheckboxItem>

    <DropdownMenu.Separator />
    <DropdownMenu.Label>{$t('course_comments.filter.person')}</DropdownMenu.Label>
    <DropdownMenu.CheckboxItem
      checked={commentsPanel.people.size === 0}
      closeOnSelect={false}
      onCheckedChange={() => commentsPanel.people.clear()}
    >
      {$t('course_comments.filter.anyone')}
    </DropdownMenu.CheckboxItem>
    {#each courseCommentsApi.team as member (member.profileId)}
      <DropdownMenu.CheckboxItem
        checked={commentsPanel.people.has(member.profileId)}
        closeOnSelect={false}
        onCheckedChange={() => commentsPanel.togglePerson(member.profileId)}
      >
        <UserAvatar src={member.avatarUrl} alt={member.fullname} class="size-5" />
        <span class="truncate">
          {member.profileId === $profile.id
            ? $t('course_comments.filter.you', { name: member.fullname })
            : member.fullname}
        </span>
      </DropdownMenu.CheckboxItem>
    {/each}

    <DropdownMenu.Separator />
    <DropdownMenu.Label>{$t('course_comments.filter.show_on_content')}</DropdownMenu.Label>
    <DropdownMenu.CheckboxItem
      checked={commentsPanel.showOnContent.text}
      closeOnSelect={false}
      onCheckedChange={() => commentsPanel.toggleContentVisibility('text')}
    >
      {$t('course_comments.filter.text_highlights')}
    </DropdownMenu.CheckboxItem>
    <DropdownMenu.CheckboxItem
      checked={commentsPanel.showOnContent.time}
      closeOnSelect={false}
      onCheckedChange={() => commentsPanel.toggleContentVisibility('time')}
    >
      {$t('course_comments.filter.video_markers')}
    </DropdownMenu.CheckboxItem>
    <DropdownMenu.CheckboxItem
      checked={commentsPanel.showOnContent.point}
      closeOnSelect={false}
      onCheckedChange={() => commentsPanel.toggleContentVisibility('point')}
    >
      {$t('course_comments.filter.image_pins')}
    </DropdownMenu.CheckboxItem>
  </DropdownMenu.Content>
</DropdownMenu.Root>
