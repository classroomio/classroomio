import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import {
  OptionSheet,
  OptionSheetCancel,
  OptionSheetItem,
  OptionSheetTitle
} from '@/feature/common/components/option-sheet';
import {
  Post,
  PostAuthor,
  PostAuthorName,
  PostAvatar,
  PostBody,
  PostHeader,
  PostHeaderAction,
  PostMenuButton,
  PostMeta
} from '@/feature/common/components/post';
import type { SheetRef } from '@/feature/common/components/bottom-sheet';
import { SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { useDeleteCommentMutation } from '@/feature/teach/api/course-newsfeed';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { AGO_KEYS, elapsedCopy } from '@/feature/teach/helpers/relative-time';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { NewsfeedCommentThread } from '@/feature/teach/types/teach';

type FeedCommentProps = {
  courseId: string;
  feedId: string;
  comment: NewsfeedCommentThread['items'][number];
};

const MAX_INDENT_DEPTH = 3;

export function FeedComment({ courseId, feedId, comment }: FeedCommentProps) {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const menu = useRef<SheetRef>(null);
  const [confirming, setConfirming] = useState(false);
  const deleteComment = useDeleteCommentMutation(courseId, feedId);
  const author = comment.authorFullname || comment.authorUsername || t('courseMember');
  const depth = Math.min(comment.depth, MAX_INDENT_DEPTH);
  const replies = comment.descendantCount;

  const confirmDelete = () =>
    deleteComment.mutate(comment.id, {
      onSuccess: () => {
        setConfirming(false);
        showToast({ tone: 'success', title: t('commentDeleted') });
      },
      onError: (error) => {
        setConfirming(false);
        showToast({ tone: 'danger', title: t('commentNotDeleted'), description: errorMessage(error) });
      }
    });

  return (
    <View
      style={[
        styles.row,
        depth > 0 && {
          marginLeft: depth * SPACING.md,
          paddingLeft: SPACING.sm,
          borderLeftColor: colors.border,
          borderLeftWidth: 2
        }
      ]}
    >
      <Post variant="plain" density="compact">
        <PostHeader>
          <PostAvatar name={author} uri={comment.authorAvatarUrl} />
          <PostAuthor>
            <PostAuthorName>{author}</PostAuthorName>
            <PostMeta>
              {[
                elapsedCopy(t, AGO_KEYS, comment.createdAt),
                comment.replyToAuthorFullname ? t('replyingTo', { name: comment.replyToAuthorFullname }) : null
              ]
                .filter(Boolean)
                .join(' · ')}
            </PostMeta>
          </PostAuthor>
          <PostHeaderAction>
            <PostMenuButton
              onPress={() => menu.current?.present()}
              accessibilityLabel={t('moderateCommentBy', { name: author })}
            />
          </PostHeaderAction>
        </PostHeader>
        <PostBody html={comment.content} preserveLineBreaks />
      </Post>

      <OptionSheet ref={menu}>
        <OptionSheetTitle>{t('commentBy', { name: author })}</OptionSheetTitle>
        <OptionSheetItem icon={TrashIcon} destructive onSelect={() => setConfirming(true)}>
          {t('deleteComment')}
        </OptionSheetItem>
        <OptionSheetCancel />
      </OptionSheet>

      <AlertDialog open={confirming} onOpenChange={setConfirming} busy={deleteComment.isPending}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('deleteCommentTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {replies > 0
              ? t('deleteCommentWithReplies', { name: author, count: replies })
              : t('deleteCommentDescription', { name: author })}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction variant="destructive" loading={deleteComment.isPending} onPress={confirmDelete}>
              {common('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: SPACING.xs }
});
