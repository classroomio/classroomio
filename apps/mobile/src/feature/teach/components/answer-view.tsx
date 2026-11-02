import { ArrowSquareOutIcon } from 'phosphor-react-native/src/icons/ArrowSquareOut';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CheckSquareIcon } from 'phosphor-react-native/src/icons/CheckSquare';
import { CircleIcon } from 'phosphor-react-native/src/icons/Circle';
import { FileTextIcon } from 'phosphor-react-native/src/icons/FileText';
import { RadioButtonIcon } from 'phosphor-react-native/src/icons/RadioButton';
import { SquareIcon } from 'phosphor-react-native/src/icons/Square';
import { StarIcon } from 'phosphor-react-native/src/icons/Star';
import { ThumbsDownIcon } from 'phosphor-react-native/src/icons/ThumbsDown';
import { ThumbsUpIcon } from 'phosphor-react-native/src/icons/ThumbsUp';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { getCurrentLocale } from '@/feature/i18n/helpers/current-locale';
import { createTranslator } from '@/feature/i18n/helpers/translate';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import type { Locale } from '@/feature/i18n/types/i18n';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { GradingAnswerOf, GradingQuestion } from '@/feature/teach/types/teach';

async function openExternal(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    const t = createTranslator(teachCatalog, getCurrentLocale());
    showToast({ tone: 'danger', title: t('fileDidNotOpen'), description: t('tryAgainShortly') });
  }
}

function formatBytes(bytes: number | undefined, locale: Locale) {
  if (!bytes) return null;

  const t = createTranslator(teachCatalog, locale);
  if (bytes < 1024 * 1024) {
    return t('sizeKilobytes', { size: new Intl.NumberFormat(locale).format(Math.max(1, Math.round(bytes / 1024))) });
  }

  const megabytes = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
    bytes / (1024 * 1024)
  );

  return t('sizeMegabytes', { size: megabytes });
}

function formatDuration(seconds: number) {
  const whole = Math.max(0, Math.round(seconds));

  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function AnswerSurface({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.surface, { backgroundColor: colors.muted, borderColor: colors.border }]}>{children}</View>
  );
}

function AnswerText({ children }: { children: ReactNode }) {
  return (
    <AnswerSurface>
      <Text variant="body" tone="body" selectable>
        {children}
      </Text>
    </AnswerSurface>
  );
}

function NoAnswer() {
  const t = useTranslations(teachCatalog);

  return (
    <Text variant="caption" tone="muted">
      {t('noAnswer')}
    </Text>
  );
}

type ChoiceRowProps = {
  label: string;
  selected: boolean;
  correct: boolean;
  multiple?: boolean;
};

function ChoiceRow({ label, selected, correct, multiple = false }: ChoiceRowProps) {
  const t = useTranslations(teachCatalog);
  const { colors } = useTheme();
  const marker: AppIcon = multiple
    ? selected
      ? CheckSquareIcon
      : SquareIcon
    : selected
      ? RadioButtonIcon
      : CircleIcon;
  const verdict = correct
    ? { icon: CheckIcon, tone: 'success' as const, text: selected ? t('correct') : t('correctAnswer') }
    : selected
      ? { icon: XIcon, tone: 'danger' as const, text: t('incorrect') }
      : null;
  const state = [selected ? t('chosenByLearner') : null, verdict?.text].filter(Boolean).join(', ');

  return (
    <View
      accessible
      accessibilityLabel={state ? `${label}, ${state}` : label}
      style={[
        styles.choice,
        {
          borderColor: selected ? colors.borderStrong : colors.border,
          backgroundColor: selected ? colors.muted : colors.surface
        }
      ]}
    >
      <Icon icon={marker} size={18} tone={selected ? 'ink' : 'subtle'} />
      <Text variant={selected ? 'bodyStrong' : 'body'} style={styles.choiceLabel}>
        {label}
      </Text>
      {verdict && (
        <View style={styles.verdict}>
          <Icon icon={verdict.icon} size={15} tone={verdict.tone} />
          <Text variant="micro" tone={verdict.tone}>
            {verdict.text}
          </Text>
        </View>
      )}
    </View>
  );
}

function ChoiceList({ children }: { children: ReactNode }) {
  return <View style={styles.choices}>{children}</View>;
}

function FileAnswer({ answer }: { answer: GradingAnswerOf<'FILE_UPLOAD'> }) {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const locale = useLocale();
  const { colors } = useTheme();
  const isImage = answer.mimeType?.startsWith('image/') ?? false;
  const details = [answer.mimeType?.split('/').at(-1)?.toUpperCase(), formatBytes(answer.size, locale)]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.stack}>
      {isImage && answer.fileUrl && (
        <Image
          source={{ uri: answer.fileUrl }}
          contentFit="contain"
          transition={120}
          accessibilityLabel={answer.fileName}
          style={[styles.preview, { backgroundColor: colors.muted, borderColor: colors.border }]}
        />
      )}
      <AnswerSurface>
        <View style={styles.fileRow}>
          <Icon icon={FileTextIcon} size={22} tone="muted" />
          <View style={styles.fileCopy}>
            <Text variant="captionStrong" numberOfLines={2}>
              {answer.fileName}
            </Text>
            {details ? (
              <Text variant="micro" tone="muted">
                {details}
              </Text>
            ) : null}
          </View>
          {answer.fileUrl ? (
            <Button variant="outline" size="sm" onPress={() => openExternal(answer.fileUrl!)}>
              <ButtonText>{common('open')}</ButtonText>
            </Button>
          ) : null}
        </View>
      </AnswerSurface>
      {!answer.fileUrl && (
        <Text variant="caption" tone="muted">
          {t('fileNotLoaded')}
        </Text>
      )}
    </View>
  );
}

function VideoPlayer({ uri }: { uri: string }) {
  const { colors } = useTheme();
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
  });

  return (
    <VideoView
      player={player}
      nativeControls
      contentFit="contain"
      allowsPictureInPicture={false}
      style={[styles.video, { backgroundColor: colors.ink }]}
    />
  );
}

function VideoAnswer({ answer }: { answer: GradingAnswerOf<'VIDEO_RECORDING'> }) {
  const t = useTranslations(teachCatalog);
  const locale = useLocale();

  return (
    <View style={styles.stack}>
      {answer.playbackUrl ? (
        <VideoPlayer uri={answer.playbackUrl} />
      ) : (
        <AnswerSurface>
          <Text variant="caption" tone="muted">
            {t('recordingNotLoaded')}
          </Text>
        </AnswerSurface>
      )}
      <Text variant="micro" tone="muted">
        {[t('videoResponse', { duration: formatDuration(answer.durationSeconds) }), formatBytes(answer.size, locale)]
          .filter(Boolean)
          .join(' · ')}
      </Text>
    </View>
  );
}

function LinkAnswer({ urls }: { urls: string[] }) {
  if (urls.length === 0) return <NoAnswer />;

  return (
    <View style={styles.stack}>
      {urls.map((url) => (
        <Pressable
          key={url}
          accessibilityRole="link"
          hitSlop={HIT_SLOP}
          onPress={() => openExternal(url)}
          style={styles.linkRow}
        >
          <Text variant="captionStrong" tone="primary" numberOfLines={2} style={styles.linkText}>
            {url}
          </Text>
          <Icon icon={ArrowSquareOutIcon} size={15} tone="primary" />
        </Pressable>
      ))}
    </View>
  );
}

function NumberedList({ items }: { items: string[] }) {
  if (items.length === 0) return <NoAnswer />;

  return (
    <AnswerSurface>
      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={`${index}-${item}`} style={styles.listRow}>
            <Text variant="caption" tone="muted" style={styles.listIndex}>
              {index + 1}.
            </Text>
            <Text variant="body" tone="body" style={styles.listText}>
              {item || '–'}
            </Text>
          </View>
        ))}
      </View>
    </AnswerSurface>
  );
}

/** The learner's answer to one question, with correct choices indicated where the question has them. */
export function AnswerView({ question }: { question: GradingQuestion }) {
  const t = useTranslations(teachCatalog);
  const answer = question.answer;
  if (!answer) return <NoAnswer />;

  switch (answer.type) {
    case 'TEXTAREA':
    case 'SHORT_ANSWER':
      return answer.text.trim() ? <AnswerText>{answer.text}</AnswerText> : <NoAnswer />;
    case 'NUMERIC':
      return <AnswerText>{String(answer.value)}</AnswerText>;
    case 'RADIO':
      return (
        <ChoiceList>
          {question.options.map((option) => (
            <ChoiceRow
              key={option.id}
              label={option.label}
              selected={option.id === answer.optionId}
              correct={option.isCorrect}
            />
          ))}
        </ChoiceList>
      );
    case 'CHECKBOX':
      return (
        <ChoiceList>
          {question.options.map((option) => (
            <ChoiceRow
              key={option.id}
              multiple
              label={option.label}
              selected={answer.optionIds.includes(option.id)}
              correct={option.isCorrect}
            />
          ))}
        </ChoiceList>
      );
    case 'TRUE_FALSE':
      return (
        <ChoiceList>
          {[true, false].map((value) => (
            <ChoiceRow
              key={String(value)}
              label={value ? t('answerTrue') : t('answerFalse')}
              selected={answer.value === value}
              correct={question.correctValue === value}
            />
          ))}
        </ChoiceList>
      );
    case 'THUMBS':
      return (
        <AnswerSurface>
          <View style={styles.inline}>
            <Icon icon={answer.value ? ThumbsUpIcon : ThumbsDownIcon} size={18} tone="ink" />
            <Text variant="body">{answer.value ? t('thumbsUp') : t('thumbsDown')}</Text>
          </View>
        </AnswerSurface>
      );
    case 'STAR':
      return (
        <AnswerSurface>
          <View style={styles.inline}>
            <Icon icon={StarIcon} size={18} tone="warning" />
            <Text variant="body">{t('stars', { count: answer.value })}</Text>
          </View>
        </AnswerSurface>
      );
    case 'FILL_BLANK':
      return <NumberedList items={answer.values} />;
    case 'WORD_BANK':
      return <NumberedList items={answer.filledBlanks} />;
    case 'ORDERING':
      return <NumberedList items={answer.orderedValues} />;
    case 'MATCHING':
      return <NumberedList items={answer.pairs.map((pair) => `${pair.left} → ${pair.right}`)} />;
    case 'LINK':
      return <LinkAnswer urls={answer.urls} />;
    case 'HOTSPOT':
      return (
        <AnswerSurface>
          <Text variant="body" tone="body">
            {t('hotspotPoints', { count: answer.coordinates.length })}
          </Text>
        </AnswerSurface>
      );
    case 'FILE_UPLOAD':
      return <FileAnswer answer={answer} />;
    case 'VIDEO_RECORDING':
      return <VideoAnswer answer={answer} />;
  }
}

const styles = StyleSheet.create({
  surface: {
    padding: SPACING.sm + 2,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.md,
    borderCurve: 'continuous'
  },
  choices: { gap: SPACING.xs - 2 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 44,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.input,
    borderCurve: 'continuous'
  },
  choiceLabel: { flex: 1 },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  stack: { gap: SPACING.xs },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: RADII.md,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2
  },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  fileCopy: { flex: 1, gap: 2 },
  video: { width: '100%', aspectRatio: 16 / 9, borderRadius: RADII.md, borderCurve: 'continuous', overflow: 'hidden' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minHeight: 32 },
  linkText: { flexShrink: 1 },
  list: { gap: SPACING.xs },
  listRow: { flexDirection: 'row', gap: SPACING.xs },
  listIndex: { minWidth: 20, paddingTop: 2, fontVariant: ['tabular-nums'] },
  listText: { flex: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }
});
