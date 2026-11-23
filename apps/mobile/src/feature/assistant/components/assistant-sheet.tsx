import { SparkleIcon } from 'phosphor-react-native/src/icons/Sparkle';
import { SquareIcon } from 'phosphor-react-native/src/icons/Square';
import { BottomSheetScrollView as SheetScrollView, type BottomSheetScrollViewMethods } from '@gorhom/bottom-sheet';
import { useRef, useState, type Ref } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAssistantChat } from '@/feature/assistant/helpers/use-assistant-chat';
import { assistantCatalog } from '@/feature/assistant/translations/catalog';
import type { en } from '@/feature/assistant/translations/en';
import type { AssistantUnavailableReason } from '@/feature/assistant/types/assistant';
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetHeader,
  SheetHeading,
  SheetTitle,
  type SheetRef
} from '@/feature/common/components/bottom-sheet';
import { Composer, ComposerInput, ComposerRow, ComposerSend } from '@/feature/common/components/composer';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { GUTTER, HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { KeyboardSpacer, TutorBubble } from '@/feature/lesson/components/tutor-sheet';

const UNAVAILABLE_KEYS = {
  cap_reached: { title: 'capReachedTitle', description: 'capReachedDescription' },
  pool_exhausted: { title: 'poolExhaustedTitle', description: 'poolExhaustedDescription' },
  disabled: { title: 'disabledTitle', description: 'disabledDescription' },
  not_configured: { title: 'notConfiguredTitle', description: 'notConfiguredDescription' },
  no_courses: { title: 'noCoursesTitle', description: 'noCoursesDescription' }
} as const satisfies Record<AssistantUnavailableReason, { title: keyof typeof en; description: keyof typeof en }>;

/** The learner's assistant for questions about their courses, deadlines and goals. */
export function AssistantSheet({ ref }: { ref: Ref<SheetRef> }) {
  return (
    <Sheet ref={ref} size="tall">
      <AssistantConversation />
    </Sheet>
  );
}

function AssistantConversation() {
  const { colors } = useTheme();
  const t = useTranslations(assistantCatalog);
  const chat = useAssistantChat();
  const [draft, setDraft] = useState('');
  const scroll = useRef<BottomSheetScrollViewMethods>(null);
  const unavailable = chat.unavailable;

  const submit = () => {
    const text = draft;
    setDraft('');
    void chat.ask(text);
  };

  return (
    <>
      <SheetHeader>
        <View style={[styles.badge, { backgroundColor: colors.primaryTint }]}>
          <Icon icon={SparkleIcon} size={17} tone="primary" />
        </View>
        <SheetHeading>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeading>
        <SheetClose />
      </SheetHeader>

      <SheetScrollView
        ref={scroll}
        style={styles.fill}
        contentContainerStyle={styles.messages}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        {chat.messages.length === 0 && !unavailable ? (
          <Empty>
            <EmptyMedia icon={SparkleIcon} />
            <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
          </Empty>
        ) : null}
        {chat.messages.map((message) => (
          <TutorBubble
            key={message.id}
            message={message}
            pending={chat.streaming && message.role === 'assistant' && !message.text}
          />
        ))}
        {chat.error ? (
          <Text variant="caption" tone="danger" style={styles.error}>
            {chat.error}
          </Text>
        ) : null}
        {unavailable ? (
          <Empty>
            <EmptyMedia icon={SparkleIcon} />
            <EmptyTitle>{t(UNAVAILABLE_KEYS[unavailable].title)}</EmptyTitle>
            <EmptyDescription>{t(UNAVAILABLE_KEYS[unavailable].description)}</EmptyDescription>
          </Empty>
        ) : null}
        <KeyboardSpacer />
      </SheetScrollView>

      {unavailable ? null : (
        <Composer value={draft} onChangeText={setDraft} onSubmit={submit} submitting={chat.streaming}>
          <ComposerRow>
            <ComposerInput
              placeholder={t('placeholder')}
              accessibilityLabel={t('inputLabel')}
              returnKeyType="send"
              submitBehavior="submit"
              onSubmitEditing={submit}
            />
            {chat.streaming ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('stop')}
                hitSlop={HIT_SLOP}
                onPress={chat.stop}
                style={[styles.stop, { backgroundColor: colors.mutedStrong }]}
              >
                <Icon icon={SquareIcon} size={14} tone="ink" weight="fill" />
              </Pressable>
            ) : (
              <ComposerSend accessibilityLabel={t('send')} />
            )}
          </ComposerRow>
        </Composer>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  messages: { paddingHorizontal: GUTTER, paddingBottom: SPACING.md, gap: SPACING.xs },
  badge: {
    width: 32,
    height: 32,
    borderRadius: RADII.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center'
  },
  error: { textAlign: 'center', paddingVertical: SPACING.xs },
  stop: { width: 36, height: 36, marginBottom: 2, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }
});
