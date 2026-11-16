export type ReviewAnchorKind = 'course' | 'page' | 'text' | 'block' | 'time' | 'slide' | 'point' | 'question';

export type ReviewStatusTagVariant = 'removed' | 'resolved' | 'new' | 'former_member' | 'pinned' | 'neutral';

/** A piece of a rendered comment body. Mentions of people who left the team are `inactive`. */
export type ReviewCommentSegment =
  | { kind: 'text'; text: string }
  | { kind: 'mention'; text: string; inactive?: boolean }
  | { kind: 'link'; text: string; href: string };

export interface ReviewCommentAuthor {
  fullname: string | null;
  avatarUrl: string | null;
}
