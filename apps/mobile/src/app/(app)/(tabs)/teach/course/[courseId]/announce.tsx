import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Field, FieldDescription, FieldLabel } from '@/feature/common/components/field';
import { InputGroup, InputGroupInput } from '@/feature/common/components/input';
import { Spinner } from '@/feature/common/components/spinner';
import { Switch } from '@/feature/common/components/switch';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { useCreateAnnouncementMutation } from '@/feature/teach/api/course-newsfeed';
import { useTeachingCoursesQuery } from '@/feature/teach/api/teaching-courses';
import { HeaderTextButton } from '@/feature/teach/components/header-text-button';
import { plainTextToEditorHtml } from '@/feature/common/helpers/editor-html';
import { teachCatalog } from '@/feature/teach/translations/catalog';

export default function AnnounceScreen() {
  const t = useTranslations(teachCatalog);
  const { colors, elevation } = useTheme();
  const { courseId = '' } = useLocalSearchParams<{ courseId: string }>();
  const course = useTeachingCoursesQuery().data?.find((candidate) => candidate.id === courseId);
  const createAnnouncement = useCreateAnnouncementMutation(courseId);
  const [message, setMessage] = useState('');
  const [pinned, setPinned] = useState(false);
  const canPost = message.trim().length > 0 && !createAnnouncement.isPending;

  const post = () => {
    if (!canPost) return;

    createAnnouncement.mutate(
      { content: plainTextToEditorHtml(message), isPinned: pinned },
      {
        onSuccess: () => {
          showToast({ tone: 'success', title: t('announcementPosted'), description: course?.title });
          router.back();
        },
        onError: (error) =>
          showToast({ tone: 'danger', title: t('announcementNotPosted'), description: errorMessage(error) })
      }
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            createAnnouncement.isPending ? (
              <Spinner tone="primary" />
            ) : (
              <HeaderTextButton strong disabled={!canPost} onPress={post}>
                {t('post')}
              </HeaderTextButton>
            )
        }}
      />
      <KeyboardAwareScrollView
        bottomOffset={SPACING.xl}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
      >
        {course ? (
          <Text variant="caption" tone="muted">
            {t('announceNote', { course: course.title })}
          </Text>
        ) : null}

        <Field>
          <FieldLabel>{t('message')}</FieldLabel>
          <InputGroup style={styles.messageGroup}>
            <InputGroupInput
              value={message}
              onChangeText={setMessage}
              multiline
              autoFocus
              textAlignVertical="top"
              placeholder={t('messagePlaceholder')}
              style={styles.messageInput}
            />
          </InputGroup>
        </Field>

        <View
          style={[styles.toggle, { backgroundColor: colors.surface, borderColor: colors.border }, elevation.raised]}
        >
          <View style={styles.toggleCopy}>
            <Text variant="bodyStrong">{t('pinToTop')}</Text>
            <FieldDescription>{t('pinDescription')}</FieldDescription>
          </View>
          <Switch value={pinned} onValueChange={setPinned} accessibilityLabel={t('pinToTop')} />
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  messageGroup: { alignItems: 'stretch', minHeight: 180 },
  messageInput: { minHeight: 180 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.xl,
    borderCurve: 'continuous'
  },
  toggleCopy: { flex: 1, gap: 2 }
});
