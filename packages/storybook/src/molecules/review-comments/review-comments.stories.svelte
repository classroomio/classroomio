<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Button } from '@cio/ui/base/button';
  import { Textarea } from '@cio/ui/base/textarea';
  import { LiveCursor, ReviewAnchorChip, ReviewPin, ReviewStatusTag, ReviewThreadCard, TypingPreview } from '@cio/ui';
  import { FIELDS } from './fields';

  const ADA = { fullname: 'Ada Lovelace', avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=ada' };
  const GRACE = { fullname: 'Grace Hopper', avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=grace' };
  const DELETED = { fullname: 'Deleted user', avatarUrl: null };

  const MENTION_BODY = [
    { kind: 'text', text: 'Can ' },
    { kind: 'mention', text: '@Grace Hopper' },
    { kind: 'text', text: ' check the pricing example? See ' },
    { kind: 'link', text: 'https://example.com/pricing', href: 'https://example.com/pricing' }
  ];
  const INACTIVE_MENTION_BODY = [
    { kind: 'text', text: 'Asked ' },
    { kind: 'mention', text: '@Tunde Bello', inactive: true },
    { kind: 'text', text: ' about this before they left.' }
  ];
  const REPLY_BODY = [{ kind: 'text', text: 'Fixed the numbers, thanks.' }];
  const LONG_BODY = [
    {
      kind: 'text',
      text: 'This paragraph runs long on purpose so the card shows how a big comment wraps.\n\nIt keeps line breaks, and very long words like supercalifragilisticexpialidocious-and-then-some-more-text-without-spaces wrap instead of overflowing the panel.'
    }
  ];

  const { Story } = defineMeta({
    title: 'Molecules/ReviewComments',
    component: ReviewThreadCard.Root,
    args: { active: false, unread: false, resolved: false, hovered: false, label: 'Thread by Ada Lovelace' },
    parameters: {
      layout: 'padded',
      controls: { include: FIELDS }
    },
    argTypes: {
      onSelect: { control: false },
      onHoverChange: { control: false },
      children: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Collapsed">
  {#snippet template(args)}
    <div class="w-full max-w-sm">
      <ReviewThreadCard.Root {...args} onSelect={() => console.log('select')}>
        <ReviewThreadCard.Header copyLinkLabel="Copy link" onCopyLink={() => console.log('copy')}>
          <ReviewAnchorChip kind="text" label="Note" />
        </ReviewThreadCard.Header>
        <ReviewThreadCard.Quote text="Yet most founders guess their price in an afternoon" />
        <ReviewThreadCard.Comment author={ADA} badge="Admin" dateLabel="2 h ago" segments={MENTION_BODY} />
        <p class="ui:text-muted-foreground text-xs">2 replies</p>
      </ReviewThreadCard.Root>
    </div>
  {/snippet}
</Story>

<Story name="ActiveWithReplies" args={{ active: true }}>
  {#snippet template(args)}
    <div class="w-full max-w-sm">
      <ReviewThreadCard.Root {...args}>
        <ReviewThreadCard.Header copyLinkLabel="Copy link" onCopyLink={() => console.log('copy')}>
          <ReviewAnchorChip kind="time" label="Video · 1:24" />
        </ReviewThreadCard.Header>
        <ReviewThreadCard.Comment
          author={ADA}
          badge="Admin"
          dateLabel="2 h ago"
          segments={MENTION_BODY}
          canEdit
          canDelete
          onEdit={() => console.log('edit')}
          onDelete={() => console.log('delete')}
          editLabel="Edit"
          deleteLabel="Delete"
        />
        <ReviewThreadCard.Comment author={GRACE} badge="Tutor" dateLabel="1 h ago · edited" segments={REPLY_BODY} />
        <TypingPreview name="Grace Hopper" colorIndex={2} label="Grace is typing…" text="One more thing about the" />
        <Textarea class="mt-2" placeholder="Reply, or @ to mention" rows={2} />
        <ReviewThreadCard.Footer>
          <Button size="sm" variant="outline">Resolve</Button>
        </ReviewThreadCard.Footer>
      </ReviewThreadCard.Root>
    </div>
  {/snippet}
</Story>

<Story name="Unread" args={{ unread: true }}>
  {#snippet template(args)}
    <div class="w-full max-w-sm">
      <ReviewThreadCard.Root {...args}>
        <ReviewThreadCard.Header>
          <ReviewAnchorChip kind="slide" label="Slide 3" />
          <ReviewStatusTag variant="new" label="2 new" />
        </ReviewThreadCard.Header>
        <ReviewThreadCard.Comment author={GRACE} badge="Tutor" dateLabel="5 min ago" segments={REPLY_BODY} />
      </ReviewThreadCard.Root>
    </div>
  {/snippet}
</Story>

<Story name="Resolved" args={{ resolved: true, active: true }}>
  {#snippet template(args)}
    <div class="w-full max-w-sm">
      <ReviewThreadCard.Root {...args}>
        <ReviewThreadCard.Header>
          <ReviewAnchorChip kind="question" label="Question" />
          <ReviewStatusTag variant="resolved" label="Resolved" />
        </ReviewThreadCard.Header>
        <ReviewThreadCard.Comment author={ADA} badge="Admin" dateLabel="Yesterday" segments={REPLY_BODY} />
        <ReviewThreadCard.Footer statusLabel="Resolved by Grace Hopper · 1 h ago">
          <Button size="sm" variant="outline">Reopen</Button>
        </ReviewThreadCard.Footer>
      </ReviewThreadCard.Root>
    </div>
  {/snippet}
</Story>

<Story name="ContentRemoved">
  {#snippet template(args)}
    <div class="w-full max-w-sm">
      <ReviewThreadCard.Root {...args}>
        <ReviewThreadCard.Header>
          <ReviewAnchorChip kind="text" label="Note" />
          <ReviewStatusTag variant="removed" label="Original text was removed" />
        </ReviewThreadCard.Header>
        <ReviewThreadCard.Quote text="This sentence was deleted from the lesson" removed />
        <ReviewThreadCard.Comment author={ADA} dateLabel="3 d ago" segments={REPLY_BODY} />
      </ReviewThreadCard.Root>
    </div>
  {/snippet}
</Story>

<Story name="FormerAndDeletedAuthors">
  {#snippet template(args)}
    <div class="w-full max-w-sm">
      <ReviewThreadCard.Root {...args}>
        <ReviewThreadCard.Header>
          <ReviewAnchorChip kind="course" label="Whole course" />
        </ReviewThreadCard.Header>
        <ReviewThreadCard.Comment
          author={GRACE}
          badge="Former member"
          dateLabel="2 w ago"
          segments={INACTIVE_MENTION_BODY}
        />
        <ReviewThreadCard.Comment author={DELETED} dateLabel="1 w ago" segments={REPLY_BODY} />
      </ReviewThreadCard.Root>
    </div>
  {/snippet}
</Story>

<Story name="EditingAndLongBody" args={{ active: true }}>
  {#snippet template(args)}
    <div class="w-full max-w-sm">
      <ReviewThreadCard.Root {...args}>
        <ReviewThreadCard.Header>
          <ReviewAnchorChip kind="page" label="Lesson" />
        </ReviewThreadCard.Header>
        <ReviewThreadCard.Comment author={ADA} dateLabel="Now" segments={LONG_BODY} />
        <ReviewThreadCard.Comment author={GRACE} dateLabel="Now" segments={REPLY_BODY}>
          {#snippet editor()}
            <Textarea value="Fixed the numbers, thanks." rows={2} />
          {/snippet}
        </ReviewThreadCard.Comment>
      </ReviewThreadCard.Root>
    </div>
  {/snippet}
</Story>

<Story name="AnchorChipsAndTags">
  {#snippet template()}
    <div class="flex max-w-md flex-wrap gap-2">
      <ReviewAnchorChip kind="course" label="Whole course" />
      <ReviewAnchorChip kind="page" label="Lesson" />
      <ReviewAnchorChip kind="text" label="Note" />
      <ReviewAnchorChip kind="block" label="Document" />
      <ReviewAnchorChip kind="time" label="Video · 0:42" />
      <ReviewAnchorChip kind="slide" label="Slide 3" />
      <ReviewAnchorChip kind="point" label="Image" />
      <ReviewAnchorChip kind="question" label="Question" />
      <ReviewStatusTag variant="removed" label="Video has changed" />
      <ReviewStatusTag variant="resolved" label="Resolved" />
      <ReviewStatusTag variant="new" label="3 new" />
      <ReviewStatusTag variant="former_member" label="Former member" />
      <ReviewStatusTag variant="pinned" label="Pinned" />
      <ReviewStatusTag variant="neutral" label="Neutral" />
    </div>
  {/snippet}
</Story>

<Story name="Pins">
  {#snippet template()}
    <div class="ui:bg-muted relative h-56 w-full max-w-md rounded-lg">
      <ReviewPin x={20} y={30} number={1} label="Comment 1" />
      <ReviewPin x={50} y={60} number={2} label="Comment 2" active />
      <ReviewPin x={75} y={35} number={3} label="Comment 3" hovered />
      <ReviewPin x={85} y={80} label="New comment" draft />
    </div>
  {/snippet}
</Story>

<Story name="LiveCursors">
  {#snippet template()}
    <div class="relative h-56 w-full max-w-md">
      <LiveCursor x={40} y={40} name="Ada Lovelace" colorIndex={0} />
      <LiveCursor x={220} y={110} name="Grace Hopper" colorIndex={2} typingText="Should we split this lesson?" />
    </div>
  {/snippet}
</Story>
