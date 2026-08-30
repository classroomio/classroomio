export type NotificationKind = 'org_invite';

/** Translation key plus its params, resolved at render so a locale switch re-renders. */
export type NotificationText = {
  key: string;
  params?: Record<string, string>;
};

export type NotificationItem = {
  /** Kind-prefixed so ids from different sources cannot collide. */
  id: string;
  kind: NotificationKind;
  /** ISO string, drives both ordering and the relative timestamp. */
  createdAt: string;
  title: NotificationText;
  body: NotificationText;
  /** Null falls back to initials from `avatarName`. */
  avatarUrl: string | null;
  avatarName: string;
  /** Always true until read state exists — see prd/notification-system/README.md. */
  unread: boolean;
  /** Identifier the panel needs to act on the item, e.g. the invite id. */
  sourceId: string;
};
