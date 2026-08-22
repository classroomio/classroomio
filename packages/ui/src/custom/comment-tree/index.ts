import Root from './comment-tree-root.svelte';
import Item from './comment-tree-item.svelte';
import Header from './comment-tree-header.svelte';
import Content from './comment-tree-content.svelte';
import Actions from './comment-tree-actions.svelte';
import Input from './comment-tree-input.svelte';
import Replies from './comment-tree-replies.svelte';
import ReplyingTo from './comment-tree-replying-to.svelte';
import Node from './comment-tree-node.svelte';
import CollapseToggle from './comment-tree-collapse-toggle.svelte';
import ThreadLine from './comment-tree-thread-line.svelte';
import MoreReplies from './comment-tree-more-replies.svelte';

export * from './types';

export {
  Root,
  Item,
  Header,
  Content,
  Actions,
  Input,
  Replies,
  ReplyingTo,
  Node,
  CollapseToggle,
  ThreadLine,
  MoreReplies,
  // Alias names
  Root as CommentRoot,
  Item as CommentItem,
  Header as CommentHeader,
  Content as CommentContent,
  Actions as CommentActions,
  Input as CommentInput,
  Replies as CommentReplies,
  ReplyingTo as CommentReplyingTo,
  Node as CommentNode
};
