<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CommentTree } from '@cio/ui';
  import { FIELDS } from './fields';

  const LABELS = {
    collapse: 'Collapse thread',
    expand: 'Expand thread',
    continueThread: 'Continue this thread',
    moreReplies: (count) => `${count} more ${count === 1 ? 'reply' : 'replies'}`,
    collapsedSummary: (count) => `${count} ${count === 1 ? 'reply' : 'replies'} hidden`
  };

  const AUTHORS = [
    { fullname: 'Ada Lovelace', avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=ada' },
    { fullname: 'Grace Hopper', avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=grace' },
    { fullname: 'Alan Turing', avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=alan' },
    { fullname: 'Radia Perlman', avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=radia' }
  ];

  const BODIES = {
    1: 'Least privilege is a process, not a configuration.',
    2: 'Agreed — the grants that bite us were correct when issued.',
    3: 'So the fix is a review cadence with an owner, not another policy doc.',
    4: 'Who owns it today?',
    5: 'Nobody, which is the finding.',
    6: 'One word answers only from here.',
    7: 'Noted.'
  };

  const comment = (id) => ({
    id,
    fullname: AUTHORS[(id - 1) % AUTHORS.length].fullname,
    avatarUrl: AUTHORS[(id - 1) % AUTHORS.length].avatarUrl,
    content: BODIES[id] ?? `Reply number ${id}.`,
    dateLabel: `${id} h ago`
  });

  /** depth/children/counts mirror what the API returns per node. */
  const node = (id, depth, children = [], directReplyCount = children.length, descendantCount = children.length) => ({
    id,
    depth,
    children,
    directReplyCount,
    descendantCount,
    isLoading: false
  });

  const NESTED = node(1, 0, [node(2, 1, [node(3, 2, [node(4, 3, [node(5, 4)])])]), node(6, 1, [node(7, 2)])]);

  const DEEP = node(1, 0, [node(2, 1, [node(3, 2, [node(4, 3, [node(5, 4, [node(6, 5, [node(7, 6)])])])])])]);

  const TRUNCATED = node(1, 0, [node(2, 1), node(3, 1)], 60, 74);

  const { Story } = defineMeta({
    title: 'Molecules/CommentTree',
    component: CommentTree.Node,
    args: {
      node: NESTED,
      indentCap: 5,
      indentStep: 24,
      labels: LABELS
    },
    parameters: {
      layout: 'padded',
      controls: { include: FIELDS }
    },
    argTypes: {
      isCollapsed: { control: false },
      onToggleCollapse: { control: false },
      onLoadMoreChildren: { control: false },
      onContinueThread: { control: false },
      body: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script>
  import { SvelteSet } from 'svelte/reactivity';

  const collapsed = new SvelteSet();
  const toggle = (id) => (collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id));
  const isCollapsed = (id) => collapsed.has(id);

  const preCollapsed = new SvelteSet([2]);
  const togglePreCollapsed = (id) => (preCollapsed.has(id) ? preCollapsed.delete(id) : preCollapsed.add(id));
</script>

{#snippet commentBody({ node: current })}
  {@const data = comment(current.id)}
  <div class="ui:flex ui:w-full ui:flex-col ui:gap-1">
    <CommentTree.Header
      avatarUrl={data.avatarUrl}
      fullname={data.fullname}
      dateLabel={data.dateLabel}
      avatarSize={current.depth === 0 ? 'ui:size-8' : 'ui:size-7'}
      canEdit
      canDelete
      onEdit={() => console.log('edit', current.id)}
      onDelete={() => console.log('delete', current.id)}
    />
    <div class="pl-10">
      <CommentTree.Content content={data.content} />
      <CommentTree.Actions replyLabel="Reply" onReply={() => console.log('reply', current.id)} />
    </div>
  </div>
{/snippet}

<Story name="NestedThread">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-2xl">
      <CommentTree.Root>
        <CommentTree.Node
          node={NESTED}
          labels={LABELS}
          {isCollapsed}
          onToggleCollapse={toggle}
          onLoadMoreChildren={(id) => console.log('load more children of', id)}
          onContinueThread={(id) => console.log('continue thread at', id)}
          body={commentBody}
        />
      </CommentTree.Root>
    </div>
  {/snippet}
</Story>

<Story name="IndentCapAndContinueThread">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-2xl">
      <p class="ui:mb-3 ui:text-xs ui:text-muted-foreground">
        Indent stops at depth 5. Deeper replies are reached through “Continue this thread”, which re-roots the tree.
      </p>
      <CommentTree.Root>
        <CommentTree.Node
          node={DEEP}
          indentCap={5}
          labels={LABELS}
          {isCollapsed}
          onToggleCollapse={toggle}
          onContinueThread={(id) => console.log('continue thread at', id)}
          body={commentBody}
        />
      </CommentTree.Root>
    </div>
  {/snippet}
</Story>

<Story name="MoreRepliesToLoad">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-2xl">
      <p class="ui:mb-3 ui:text-xs ui:text-muted-foreground">
        Two of 60 direct replies are loaded, so the count reflects the whole hidden subtree rather than just siblings.
      </p>
      <CommentTree.Root>
        <CommentTree.Node
          node={TRUNCATED}
          labels={LABELS}
          {isCollapsed}
          onToggleCollapse={toggle}
          onLoadMoreChildren={(id) => console.log('load more children of', id)}
          body={commentBody}
        />
      </CommentTree.Root>
    </div>
  {/snippet}
</Story>

<Story name="CollapsedSubtree">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-2xl">
      <CommentTree.Root>
        <CommentTree.Node
          node={NESTED}
          labels={LABELS}
          isCollapsed={(id) => preCollapsed.has(id)}
          onToggleCollapse={togglePreCollapsed}
          body={commentBody}
        />
      </CommentTree.Root>
    </div>
  {/snippet}
</Story>

<Story name="Header">
  {#snippet template()}
    <div class="ui:flex ui:w-full ui:max-w-xl ui:flex-col ui:gap-4">
      <CommentTree.Header avatarUrl={AUTHORS[0].avatarUrl} fullname="Ada Lovelace" dateLabel="2 h ago" />
      <CommentTree.Header
        avatarUrl={AUTHORS[1].avatarUrl}
        fullname="Grace Hopper"
        dateLabel="5 h ago"
        roleBadge="Tutor"
      />
      <CommentTree.Header
        avatarUrl={AUTHORS[2].avatarUrl}
        fullname="Alan Turing"
        dateLabel="1 d ago"
        canEdit
        canDelete
        onEdit={() => console.log('edit')}
        onDelete={() => console.log('delete')}
      />
      <CommentTree.Header
        avatarUrl={AUTHORS[3].avatarUrl}
        fullname="Radia Perlman"
        dateLabel="3 d ago"
        avatarSize="ui:size-7"
        canDelete
        onDelete={() => console.log('delete')}
      />
      <CommentTree.Header
        avatarUrl={AUTHORS[0].avatarUrl}
        fullname="Ada Lovelace"
        dateLabel="4 h ago"
        canReport
        onReport={() => console.log('report')}
        reportLabel="Report"
      />
      <CommentTree.Header
        avatarUrl={AUTHORS[1].avatarUrl}
        fullname="Grace Hopper"
        dateLabel="6 h ago"
        canEdit
        canDelete
        canReport
        onEdit={() => console.log('edit')}
        onDelete={() => console.log('delete')}
        onReport={() => console.log('report')}
        editLabel="Edit"
        deleteLabel="Delete"
        reportLabel="Report"
      />
    </div>
  {/snippet}
</Story>

<Story name="ContentAndActions">
  {#snippet template()}
    <div class="ui:flex ui:w-full ui:max-w-xl ui:flex-col ui:gap-4">
      <CommentTree.Content content="Plain text comment body." />
      <CommentTree.Content
        content="<p>Rich content is sanitized before render: <strong>bold</strong>, <em>italic</em> and <a href='https://classroomio.com'>links</a>.</p>"
      />
      <CommentTree.Actions replyLabel="Reply" onReply={() => console.log('reply')} />
      <CommentTree.Actions
        replyLabel="Reply"
        deleteLabel="Delete"
        canDelete
        onReply={() => console.log('reply')}
        onDelete={() => console.log('delete')}
      />
    </div>
  {/snippet}
</Story>

<Story name="ReplyingToLegacyRows">
  {#snippet template()}
    <div class="ui:flex ui:w-full ui:max-w-xl ui:flex-col ui:gap-2">
      <p class="ui:text-xs ui:text-muted-foreground">
        Shown only for comments written before replies carried a real parent, where the visual parent is the thread root
        rather than the comment being answered.
      </p>
      <CommentTree.ReplyingTo label="Replying to @Ada Lovelace" />
      <CommentTree.Content content="Couldn’t have said it better myself." />
    </div>
  {/snippet}
</Story>

<Story name="Controls">
  {#snippet template()}
    <div class="ui:flex ui:w-full ui:max-w-xl ui:flex-col ui:gap-6">
      <div class="ui:flex ui:items-center ui:gap-3">
        <CommentTree.CollapseToggle
          controls="demo-expanded"
          collapseLabel="Collapse thread"
          expandLabel="Expand thread"
          onclick={() => console.log('toggle')}
        />
        <span class="ui:text-xs ui:text-muted-foreground">Expanded</span>
      </div>
      <div class="ui:flex ui:items-center ui:gap-3">
        <CommentTree.CollapseToggle
          collapsed
          controls="demo-collapsed"
          collapseLabel="Collapse thread"
          expandLabel="Expand thread"
          onclick={() => console.log('toggle')}
        />
        <span class="ui:text-xs ui:text-muted-foreground">Collapsed</span>
      </div>
      <CommentTree.MoreReplies label="12 more replies" onclick={() => console.log('load more')} />
      <CommentTree.MoreReplies label="12 more replies" loading onclick={() => console.log('load more')} />
      <CommentTree.MoreReplies kind="continue" label="Continue this thread" onclick={() => console.log('continue')} />
      <div class="ui:relative ui:h-16 ui:pl-6">
        <CommentTree.ThreadLine label="Collapse thread" onclick={() => console.log('rail click')} />
        <span class="ui:text-xs ui:text-muted-foreground">Thread line — click to collapse the branch</span>
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Input">
  {#snippet template()}
    <div class="ui:flex ui:w-full ui:max-w-xl ui:flex-col ui:gap-8">
      <CommentTree.Input
        authorAvatarUrl={AUTHORS[0].avatarUrl}
        placeholder="Add class comment"
        onSubmit={(text) => console.log('submit', text)}
      />
      <CommentTree.Input
        authorAvatarUrl={AUTHORS[0].avatarUrl}
        placeholder="Add class comment"
        replyingToUser="Grace Hopper"
        replyingToSnippet="Agreed — the grants that bite us were correct when issued."
        cancelLabel="Cancel"
        onCancelReply={() => console.log('cancel reply')}
        onSubmit={(text) => console.log('submit', text)}
      />
      <CommentTree.Input
        authorAvatarUrl={AUTHORS[0].avatarUrl}
        placeholder="Add class comment"
        isSubmitting
        onSubmit={(text) => console.log('submit', text)}
      />
    </div>
  {/snippet}
</Story>
