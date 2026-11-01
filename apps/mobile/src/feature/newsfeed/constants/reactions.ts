import { PartyPopper, Smile, ThumbsDown, ThumbsUp } from 'lucide-react-native';

import type { ReactionOption } from '@/feature/newsfeed/types/newsfeed';

export const REACTIONS: ReactionOption[] = [
  { type: 'clap', labelKey: 'reactionClap', icon: PartyPopper },
  { type: 'smile', labelKey: 'reactionSmile', icon: Smile },
  { type: 'thumbsup', labelKey: 'reactionThumbsUp', icon: ThumbsUp },
  { type: 'thumbsdown', labelKey: 'reactionThumbsDown', icon: ThumbsDown }
];
