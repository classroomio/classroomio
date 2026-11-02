import { ConfettiIcon } from 'phosphor-react-native/src/icons/Confetti';
import { SmileyIcon } from 'phosphor-react-native/src/icons/Smiley';
import { ThumbsDownIcon } from 'phosphor-react-native/src/icons/ThumbsDown';
import { ThumbsUpIcon } from 'phosphor-react-native/src/icons/ThumbsUp';

import type { ReactionOption } from '@/feature/newsfeed/types/newsfeed';

export const REACTIONS: ReactionOption[] = [
  { type: 'clap', labelKey: 'reactionClap', icon: ConfettiIcon },
  { type: 'smile', labelKey: 'reactionSmile', icon: SmileyIcon },
  { type: 'thumbsup', labelKey: 'reactionThumbsUp', icon: ThumbsUpIcon },
  { type: 'thumbsdown', labelKey: 'reactionThumbsDown', icon: ThumbsDownIcon }
];
