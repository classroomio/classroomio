import { ChatCircleIcon } from 'phosphor-react-native/src/icons/ChatCircle';
import { ChatsCircleIcon } from 'phosphor-react-native/src/icons/ChatsCircle';
import { PushPinIcon } from 'phosphor-react-native/src/icons/PushPin';
import { PushPinSlashIcon } from 'phosphor-react-native/src/icons/PushPinSlash';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useRef, useState } from 'react';

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
  PostAction,
  PostActions,
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
import { Icon } from '@/feature/common/components/icon';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { useDeletePostMutation, usePinPostMutation } from '@/feature/teach/api/course-newsfeed';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { AGO_KEYS, elapsedCopy } from '@/feature/teach/helpers/relative-time';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { NewsfeedPost } from '@/feature/teach/types/teach';

type CourseFeedPostProps = { courseId: string; post: NewsfeedPost; onOpenComments: (post: NewsfeedPost) => void };

export function CourseFeedPost({ courseId, post, onOpenComments }: CourseFeedPostProps) {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const menu = useRef<SheetRef>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const pinPost = usePinPostMutation(courseId);
  const deletePost = useDeletePostMutation(courseId);
  const author = post.authorFullname || post.authorUsername || t('courseTeam');
  const comments = t('commentCount', { count: post.commentCount });

  const togglePin = () =>
    pinPost.mutate(
      { feedId: post.id, isPinned: !post.isPinned },
      {
        onSuccess: () => showToast({ tone: 'success', title: post.isPinned ? t('postUnpinned') : t('postPinned') }),
        onError: (error) => showToast({ tone: 'danger', title: t('postNotUpdated'), description: errorMessage(error) })
      }
    );

  const confirmDelete = () =>
    deletePost.mutate(post.id, {
      onSuccess: () => {
        setConfirmingDelete(false);
        showToast({ tone: 'success', title: t('postDeleted') });
      },
      onError: (error) => {
        setConfirmingDelete(false);
        showToast({ tone: 'danger', title: t('postNotDeleted'), description: errorMessage(error) });
      }
    });

  return (
    <>
      <Post>
        <PostHeader>
          <PostAvatar name={author} uri={post.authorAvatarUrl} />
          <PostAuthor>
            <PostAuthorName>{author}</PostAuthorName>
            <PostMeta>
              {[elapsedCopy(t, AGO_KEYS, post.createdAt), post.isPinned ? t('pinned') : null]
                .filter(Boolean)
                .join(' · ')}
            </PostMeta>
          </PostAuthor>
          <PostHeaderAction>
            {post.isPinned && <Icon icon={PushPinIcon} size={15} tone="muted" />}
            <PostMenuButton onPress={() => menu.current?.present()} accessibilityLabel={t('moderatePost')} />
          </PostHeaderAction>
        </PostHeader>
        <PostBody html={post.content} />
        <PostActions>
          <PostAction
            icon={ChatCircleIcon}
            onPress={() => onOpenComments(post)}
            accessibilityLabel={`${comments}, ${common('open')}`}
          >
            {comments}
          </PostAction>
        </PostActions>
      </Post>

      <OptionSheet ref={menu}>
        <OptionSheetTitle>{t('postBy', { name: author })}</OptionSheetTitle>
        <OptionSheetItem icon={post.isPinned ? PushPinSlashIcon : PushPinIcon} onSelect={togglePin}>
          {post.isPinned ? t('unpinPost') : t('pinToTop')}
        </OptionSheetItem>
        <OptionSheetItem icon={ChatsCircleIcon} onSelect={() => onOpenComments(post)}>
          {t('moderateComments')}
        </OptionSheetItem>
        <OptionSheetItem icon={TrashIcon} destructive onSelect={() => setConfirmingDelete(true)}>
          {t('deletePost')}
        </OptionSheetItem>
        <OptionSheetCancel />
      </OptionSheet>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete} busy={deletePost.isPending}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('deletePostTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deletePostDescription', { count: post.commentCount })}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction variant="destructive" loading={deletePost.isPending} onPress={confirmDelete}>
              {common('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
