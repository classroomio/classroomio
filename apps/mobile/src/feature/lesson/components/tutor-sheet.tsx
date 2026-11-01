import { BottomSheetScrollView as SheetScrollView, type BottomSheetScrollViewMethods } from '@gorhom/bottom-sheet';
import { Sparkles, Square } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetHeading,
  BottomSheetTitle,
  useBottomSheetClose
} from '@/feature/common/components/bottom-sheet';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Composer, ComposerInput, ComposerRow, ComposerSend } from '@/feature/common/components/composer';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Icon } from '@/feature/common/components/icon';
import { Spinner } from '@/feature/common/components/spinner';
import { Text } from '@/feature/common/components/text';
import { GUTTER, HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useTutorChat } from '@/feature/lesson/helpers/use-tutor-chat';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import type { en } from '@/feature/lesson/translations/en';
import type { TutorMessage, TutorUnavailableReason } from '@/feature/lesson/types/tutor';

const UNAVAILABLE_KEYS = {
  cap_reached: { title: 'tutorCapReachedTitle', description: 'tutorCapReachedDescription' },
  pool_exhausted: { title: 'tutorPoolExhaustedTitle', description: 'tutorPoolExhaustedDescription' },
  disabled: { title: 'tutorDisabledTitle', description: 'tutorDisabledDescription' },
  not_configured: { title: 'tutorNotConfiguredTitle', description: 'tutorNotConfiguredDescription' }
} as const satisfies Record<TutorUnavailableReason, { title: keyof typeof en; description: keyof typeof en }>;

export type TutorAllowance = { remaining: number; cap: number } | null;

type TutorSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  allowance: TutorAllowance;
  /** Set when the tutor status already reports that no question can be asked. */
  unavailable: TutorUnavailableReason | null;
  onOpenTranscript?: () => void;
};

export function TutorSheet({ open, onOpenChange, ...props }: TutorSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent size="tall">
        <TutorConversation {...props} />
      </BottomSheetContent>
    </BottomSheet>
  );
}

function TutorConversation({
  courseId,
  lessonId,
  lessonTitle,
  allowance,
  unavailable: statusUnavailable,
  onOpenTranscript
}: Omit<TutorSheetProps, 'open' | 'onOpenChange'>) {
  const { colors } = useTheme();
  const t = useTranslations(lessonCatalog);
  const chat = useTutorChat(courseId, lessonId);
  const [draft, setDraft] = useState('');
  const scroll = useRef<BottomSheetScrollViewMethods>(null);
  const unavailable = chat.unavailable ?? (allowance && allowance.remaining <= 0 ? 'cap_reached' : statusUnavailable);
  const close = useBottomSheetClose();

  const submit = () => {
    const text = draft;
    setDraft('');
    void chat.ask(text);
  };

  return (
    <>
      <BottomSheetHeader>
        <View style={[styles.badge, { backgroundColor: colors.primaryTint }]}>
          <Icon icon={Sparkles} size={17} tone="primary" />
        </View>
        <BottomSheetHeading>
          <BottomSheetTitle>{t('tutorTitle')}</BottomSheetTitle>
          <BottomSheetDescription>
            {allowance
              ? `${t('tutorAboutLesson')} · ${t('tutorQuestionsLeft', { remaining: allowance.remaining, count: allowance.cap })}`
              : t('tutorAboutLesson')}
          </BottomSheetDescription>
        </BottomSheetHeading>
        <BottomSheetClose />
      </BottomSheetHeader>

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
            <EmptyMedia icon={Sparkles} />
            <EmptyTitle>{t('tutorEmptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('tutorEmptyDescription', { title: lessonTitle })}</EmptyDescription>
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
            <EmptyMedia icon={Sparkles} />
            <EmptyTitle>{t(UNAVAILABLE_KEYS[unavailable].title)}</EmptyTitle>
            <EmptyDescription>{t(UNAVAILABLE_KEYS[unavailable].description)}</EmptyDescription>
            {onOpenTranscript ? (
              <EmptyContent>
                <Button
                  variant="outline"
                  onPress={() => {
                    close();
                    onOpenTranscript();
                  }}
                >
                  <ButtonText>{t('openTranscript')}</ButtonText>
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : null}
        <KeyboardSpacer />
      </SheetScrollView>

      {unavailable ? null : (
        <Composer value={draft} onChangeText={setDraft} onSubmit={submit} submitting={chat.streaming}>
          <ComposerRow>
            <ComposerInput
              placeholder={t('tutorPlaceholder')}
              accessibilityLabel={t('tutorInputLabel')}
              returnKeyType="send"
              submitBehavior="submit"
              onSubmitEditing={submit}
            />
            {chat.streaming ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('tutorStop')}
                hitSlop={HIT_SLOP}
                onPress={chat.stop}
                style={[styles.stop, { backgroundColor: colors.sandStrong }]}
              >
                <Icon icon={Square} size={14} tone="ink" strokeWidth={2.4} />
              </Pressable>
            ) : (
              <ComposerSend accessibilityLabel={t('tutorAsk')} />
            )}
          </ComposerRow>
        </Composer>
      )}
    </>
  );
}

function TutorBubble({ message, pending }: { message: TutorMessage; pending: boolean }) {
  const { colors } = useTheme();
  const t = useTranslations(lessonCatalog);
  const mine = message.role === 'user';

  return (
    <View
      style={[
        styles.bubble,
        mine
          ? [styles.mine, { backgroundColor: colors.primary }]
          : [styles.theirs, { backgroundColor: colors.surface, borderColor: colors.border }]
      ]}
    >
      {pending ? (
        <View style={styles.pending}>
          <Spinner />
          <Text variant="caption" tone="muted">
            {t('tutorThinking')}
          </Text>
        </View>
      ) : (
        <Text variant="caption" tone={mine ? 'onPrimary' : 'body'} selectable style={styles.bubbleText}>
          {message.text}
        </Text>
      )}
    </View>
  );
}

function KeyboardSpacer() {
  const insets = useSafeAreaInsets();
  const { height } = useReanimatedKeyboardAnimation();
  const animatedStyle = useAnimatedStyle(() => ({ height: Math.max(0, Math.abs(height.get()) - insets.bottom) }));

  return <Animated.View style={animatedStyle} />;
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
  bubble: {
    maxWidth: '86%',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 1,
    borderRadius: 16,
    borderCurve: 'continuous'
  },
  mine: { alignSelf: 'flex-end', borderBottomRightRadius: 5 },
  theirs: { alignSelf: 'flex-start', borderBottomLeftRadius: 5, borderWidth: StyleSheet.hairlineWidth * 2 },
  bubbleText: { lineHeight: 20 },
  pending: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  error: { textAlign: 'center', paddingVertical: SPACING.xs },
  stop: { width: 36, height: 36, marginBottom: 2, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }
});
