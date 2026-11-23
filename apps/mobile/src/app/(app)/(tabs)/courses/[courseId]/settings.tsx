import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { CaretUpDownIcon } from 'phosphor-react-native/src/icons/CaretUpDown';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { ImageIcon } from 'phosphor-react-native/src/icons/Image';
import { MAX_COURSE_DURATION_MINUTES, type TCourseLevel } from '@cio/utils/constants/course-level';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import type { SheetRef } from '@/feature/common/components/bottom-sheet';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/feature/common/components/field';
import { Icon } from '@/feature/common/components/icon';
import { InputGroup, InputGroupInput } from '@/feature/common/components/input';
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@/feature/common/components/item';
import { withModalSafeArea } from '@/feature/common/components/modal-safe-area';
import { OptionSheet, OptionSheetItem, OptionSheetTitle } from '@/feature/common/components/option-sheet';
import { ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Spinner } from '@/feature/common/components/spinner';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useUpdateCourseMutation, useUploadImageMutation } from '@/feature/staff/api/course-settings';
import { ToggleRow } from '@/feature/staff/components/toggle-row';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import { useTeachCourseQuery } from '@/feature/teach/api/teach-course';
import { HeaderTextButton } from '@/feature/teach/components/header-text-button';
import type { TeachCourse } from '@/feature/teach/types/teach';
import { showToast } from '@/feature/toast/helpers/toast-store';

type Draft = {
  title: string;
  description: string;
  bannerImage: string;
  isPublished: boolean;
  level: TCourseLevel | null;
  duration: string;
  allowSelfEnrollment: boolean;
  sequential: boolean;
  lessonDownload: boolean;
  certificateDownloadable: boolean;
};

const LEVELS: TCourseLevel[] = ['beginner', 'intermediate', 'advanced'];

function draftOf(course: TeachCourse): Draft {
  const metadata = course.metadata ?? {};

  return {
    title: course.title ?? '',
    description: course.description ?? '',
    bannerImage: course.bannerImage ?? '',
    isPublished: course.isPublished === true,
    level: metadata.level ?? null,
    duration: metadata.durationMinutes ? String(metadata.durationMinutes) : '',
    allowSelfEnrollment: metadata.allowSelfEnrollment ?? metadata.allowNewStudent ?? true,
    sequential: metadata.progressionMode === 'sequential',
    lessonDownload: metadata.lessonDownload === true,
    certificateDownloadable: course.certificate?.isDownloadable === true
  };
}

function parseDuration(text: string): number | null | 'invalid' {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return 'invalid';

  const minutes = Number(trimmed);

  return minutes >= 1 && minutes <= MAX_COURSE_DURATION_MINUTES ? minutes : 'invalid';
}

function SettingsForm({ course }: { course: TeachCourse }) {
  const t = useTranslations(staffCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const initial = useRef(draftOf(course));
  const [draft, setDraft] = useState<Draft>(initial.current);
  const [submitted, setSubmitted] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const pendingLeave = useRef<(() => void) | null>(null);
  const levelSheet = useRef<SheetRef>(null);
  const update = useUpdateCourseMutation(course.id);
  const upload = useUploadImageMutation();
  const duration = parseDuration(draft.duration);
  const titleMissing = draft.title.trim().length === 0;
  const descriptionMissing = draft.description.trim().length === 0;
  const invalid = titleMissing || descriptionMissing || duration === 'invalid';
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial.current);
  const busy = update.isPending || upload.isPending;
  const levelLabel = (level: TCourseLevel | null) =>
    level === null
      ? t('levelNotSet')
      : { beginner: t('levelBeginner'), intermediate: t('levelIntermediate'), advanced: t('levelAdvanced') }[level];

  const set = <Key extends keyof Draft>(key: Key, value: Draft[Key]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  usePreventRemove(dirty && !leaving, ({ repeat }) => {
    pendingLeave.current = repeat;
    setConfirmingDiscard(true);
  });

  useEffect(() => {
    if (!leaving) return;

    pendingLeave.current?.();
    pendingLeave.current = null;
  }, [leaving]);

  const pickImage = async () => {
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.85,
        allowsEditing: true,
        aspect: [16, 9]
      });
    } catch (error) {
      showToast({ tone: 'danger', title: t('imageUploadFailed'), description: errorMessage(error) });
      return;
    }
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    upload.mutate(
      { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName },
      {
        onSuccess: (url) => set('bannerImage', url),
        onError: (error) =>
          showToast({ tone: 'danger', title: t('imageUploadFailed'), description: errorMessage(error) })
      }
    );
  };

  const save = () => {
    setSubmitted(true);
    if (invalid || !dirty || busy) return;

    const metadata = {
      ...(course.metadata ?? {}),
      allowSelfEnrollment: draft.allowSelfEnrollment,
      progressionMode: draft.sequential ? ('sequential' as const) : ('free' as const),
      lessonDownload: draft.lessonDownload,
      level: draft.level,
      durationMinutes: duration
    };
    const certificate = { ...(course.certificate ?? {}), isDownloadable: draft.certificateDownloadable };

    update.mutate(
      {
        title: draft.title.trim(),
        description: draft.description.trim(),
        bannerImage: draft.bannerImage,
        isPublished: draft.isPublished,
        metadata,
        certificate
      },
      {
        onSuccess: () => {
          successHaptic();
          showToast({ tone: 'success', title: t('settingsSaved') });
          initial.current = draft;
          pendingLeave.current = null;
          setLeaving(true);
          router.back();
        },
        onError: (error) =>
          showToast({ tone: 'danger', title: t('settingsSaveFailed'), description: errorMessage(error) })
      }
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            update.isPending ? (
              <Spinner tone="primary" />
            ) : (
              <HeaderTextButton strong disabled={!dirty || busy} onPress={save}>
                {common('save')}
              </HeaderTextButton>
            )
        }}
      />
      <KeyboardAwareScrollView
        contentInsetAdjustmentBehavior="automatic"
        bottomOffset={SPACING.xl}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
      >
        <ScreenSection>
          <ScreenSectionHeader title={t('courseImage')} />
          <View style={[styles.image, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            {draft.bannerImage ? (
              <Image source={{ uri: draft.bannerImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <Icon icon={ImageIcon} size={32} tone="subtle" />
            )}
            {upload.isPending ? (
              <>
                <View style={[StyleSheet.absoluteFill, styles.imageDim, { backgroundColor: colors.surface }]} />
                <View style={[StyleSheet.absoluteFill, styles.imageBusy]}>
                  <Spinner />
                </View>
              </>
            ) : null}
          </View>
          <Button variant="secondary" disabled={busy} onPress={pickImage}>
            <ButtonIcon icon={ImageIcon} />
            <ButtonText>{draft.bannerImage ? t('changeImage') : t('chooseImage')}</ButtonText>
          </Button>
        </ScreenSection>

        <ScreenSection>
          <ScreenSectionHeader title={t('detailsSection')} />
          <Field invalid={submitted && titleMissing}>
            <FieldLabel>{t('titleLabel')}</FieldLabel>
            <InputGroup>
              <InputGroupInput value={draft.title} onChangeText={(value) => set('title', value)} />
            </InputGroup>
            {submitted && titleMissing ? <FieldError>{t('titleRequired')}</FieldError> : null}
          </Field>
          <Field invalid={submitted && descriptionMissing}>
            <FieldLabel>{t('descriptionLabel')}</FieldLabel>
            <InputGroup style={styles.multilineGroup}>
              <InputGroupInput
                value={draft.description}
                onChangeText={(value) => set('description', value)}
                multiline
                textAlignVertical="top"
                style={styles.multilineInput}
              />
            </InputGroup>
            {submitted && descriptionMissing ? <FieldError>{t('descriptionRequired')}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel>{t('levelLabel')}</FieldLabel>
            <ItemGroup>
              <Item onPress={() => levelSheet.current?.present()} accessibilityLabel={t('levelLabel')}>
                <ItemContent>
                  <ItemTitle numberOfLines={1}>{levelLabel(draft.level)}</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <Icon icon={CaretUpDownIcon} size={18} tone="subtle" />
                </ItemActions>
              </Item>
            </ItemGroup>
          </Field>
          <Field invalid={duration === 'invalid'}>
            <FieldLabel>{t('durationLabel')}</FieldLabel>
            <InputGroup>
              <InputGroupInput
                value={draft.duration}
                onChangeText={(value) => set('duration', value)}
                keyboardType="number-pad"
                inputMode="numeric"
              />
            </InputGroup>
            {duration === 'invalid' ? (
              <FieldError>{t('durationInvalid')}</FieldError>
            ) : (
              <FieldDescription>{t('durationDescription')}</FieldDescription>
            )}
          </Field>
          <ItemGroup>
            <ToggleRow
              label={t('publishedLabel')}
              description={t('publishedDescription')}
              value={draft.isPublished}
              onValueChange={(value) => set('isPublished', value)}
            />
          </ItemGroup>
        </ScreenSection>

        <ScreenSection>
          <ScreenSectionHeader title={t('accessSection')} />
          <ItemGroup>
            <ToggleRow
              label={t('selfEnrollLabel')}
              description={t('selfEnrollDescription')}
              value={draft.allowSelfEnrollment}
              onValueChange={(value) => set('allowSelfEnrollment', value)}
            />
            <ToggleRow
              label={t('sequentialLabel')}
              description={t('sequentialDescription')}
              value={draft.sequential}
              onValueChange={(value) => set('sequential', value)}
            />
            <ToggleRow
              label={t('downloadLabel')}
              description={t('downloadDescription')}
              value={draft.lessonDownload}
              onValueChange={(value) => set('lessonDownload', value)}
            />
          </ItemGroup>
        </ScreenSection>

        <ScreenSection>
          <ScreenSectionHeader title={t('certificateSection')} />
          <ItemGroup>
            <ToggleRow
              label={t('certificateLabel')}
              description={t('certificateDescription')}
              value={draft.certificateDownloadable}
              onValueChange={(value) => set('certificateDownloadable', value)}
            />
          </ItemGroup>
        </ScreenSection>
      </KeyboardAwareScrollView>

      <OptionSheet ref={levelSheet}>
        <OptionSheetTitle>{t('levelLabel')}</OptionSheetTitle>
        <OptionSheetItem selected={draft.level === null} onSelect={() => set('level', null)}>
          {t('levelNotSet')}
        </OptionSheetItem>
        {LEVELS.map((level) => (
          <OptionSheetItem key={level} selected={draft.level === level} onSelect={() => set('level', level)}>
            {levelLabel(level)}
          </OptionSheetItem>
        ))}
      </OptionSheet>

      <AlertDialog
        open={confirmingDiscard}
        onOpenChange={(open) => {
          setConfirmingDiscard(open);
          if (!open && !leaving) pendingLeave.current = null;
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{t('discardTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('discardDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('keepEditing')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onPress={() => {
                setLeaving(true);
                setConfirmingDiscard(false);
              }}
            >
              {t('discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CourseSettingsScreen() {
  const t = useTranslations(staffCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const { courseId = '' } = useLocalSearchParams<{ courseId: string }>();
  const course = useTeachCourseQuery(courseId);

  return (
    <BottomSheetModalProvider>
      {course.data ? (
        <SettingsForm course={course.data} />
      ) : (
        <View style={[styles.fill, styles.loading, { backgroundColor: colors.background }]}>
          {course.isError ? (
            <Empty>
              <EmptyMedia icon={GearSixIcon} />
              <EmptyTitle>{t('settingsLoadError')}</EmptyTitle>
              <EmptyDescription>{errorMessage(course.error)}</EmptyDescription>
              <EmptyContent>
                <Button variant="outline" onPress={() => course.refetch()}>
                  <ButtonIcon icon={ArrowsClockwiseIcon} />
                  <ButtonText>{common('retry')}</ButtonText>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <Skeleton height={180} radius={RADII.xl} />
              <Skeleton height={48} />
              <Skeleton height={120} />
              <Skeleton height={48} />
            </>
          )}
        </View>
      )}
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  loading: { paddingHorizontal: GUTTER, paddingTop: SPACING.lg, gap: SPACING.md },
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.xl },
  image: {
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.xl,
    borderCurve: 'continuous'
  },
  imageDim: { opacity: 0.6 },
  imageBusy: { alignItems: 'center', justifyContent: 'center' },
  multilineGroup: { alignItems: 'stretch', minHeight: 120 },
  multilineInput: { minHeight: 120 }
});

export default withModalSafeArea(CourseSettingsScreen);
