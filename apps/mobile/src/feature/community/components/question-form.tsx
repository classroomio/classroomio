import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { ImageSquareIcon } from 'phosphor-react-native/src/icons/ImageSquare';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { ZCommunityQuestionCreate } from '@cio/utils/validation/community';
import { Stack } from 'expo-router';
import { createContext, use, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Banner, BannerContent, BannerDescription, BannerIcon } from '@/feature/common/components/banner';
import type { SheetRef } from '@/feature/common/components/bottom-sheet';
import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { ComposerAttachments } from '@/feature/common/components/composer';
import { Field, FieldError, FieldLabel } from '@/feature/common/components/field';
import { Icon } from '@/feature/common/components/icon';
import { Input, InputGroup, InputGroupInput } from '@/feature/common/components/input';
import {
  OptionSheet,
  OptionSheetCancel,
  OptionSheetItem,
  OptionSheetTitle
} from '@/feature/common/components/option-sheet';
import { Spinner } from '@/feature/common/components/spinner';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { editorHtmlToDraft, plainTextToEditorHtml } from '@/feature/common/helpers/editor-html';
import { useImageAttachments } from '@/feature/common/helpers/use-image-attachments';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { QuestionDiscardGuard } from '@/feature/community/components/question-discard-guard';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type { en } from '@/feature/community/translations/en';
import type { CourseOption } from '@/feature/community/types/community';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export type QuestionFormValues = { title: string; body: string; courseId: string; courseTitle: string };

type FieldName = 'title' | 'courseId' | 'body';

const FIELD_ERRORS: Record<FieldName, keyof typeof en> = {
  title: 'errorTitle',
  courseId: 'errorCourse',
  body: 'errorBody'
};

type FieldErrors = Partial<Record<FieldName, keyof typeof en>>;

type QuestionFormContextValue = {
  title: string;
  setTitle: (title: string) => void;
  text: string;
  setText: (text: string) => void;
  courseId: string;
  setCourseId: (courseId: string) => void;
  courses: CourseOption[];
  coursesLoading: boolean;
  attachments: ReturnType<typeof useImageAttachments>;
  errors: FieldErrors;
  hasFormatting: boolean;
  disabled: boolean;
  submitting: boolean;
  submit: () => void;
};

const QuestionFormContext = createContext<QuestionFormContextValue | null>(null);

function useQuestionForm() {
  const context = use(QuestionFormContext);
  if (!context) throw new Error('QuestionForm parts must be used inside QuestionForm');

  return context;
}

type QuestionFormProps = {
  initial?: { title: string | null; body: string | null; courseId: string | null };
  courses: CourseOption[];
  coursesLoading?: boolean;
  submitting: boolean;
  /** Blocks editing and submitting, for example while offline. */
  disabled?: boolean;
  onSubmit: (values: QuestionFormValues) => void;
  children: ReactNode;
};

export function QuestionForm({
  initial,
  courses,
  coursesLoading = false,
  submitting,
  disabled = false,
  onSubmit,
  children
}: QuestionFormProps) {
  const [draft] = useState(() => editorHtmlToDraft(initial?.body));
  const [title, setTitle] = useState(initial?.title ?? '');
  const [text, setText] = useState(draft.text);
  const [courseId, setCourseId] = useState(initial?.courseId ?? (courses.length === 1 ? (courses[0]?.id ?? '') : ''));
  const [errors, setErrors] = useState<FieldErrors>({});
  const attachments = useImageAttachments(draft.imageUrls);
  const submitted = useRef(false);
  const edited =
    title !== (initial?.title ?? '') ||
    text !== draft.text ||
    attachments.urls.length !== draft.imageUrls.length ||
    (initial?.courseId != null && courseId !== initial.courseId);

  const submit = () => {
    const body = plainTextToEditorHtml(text, attachments.urls);
    const parsed = ZCommunityQuestionCreate.safeParse({ title, body, courseId });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'title' || field === 'courseId' || field === 'body') next[field] = FIELD_ERRORS[field];
      }
      setErrors(next);
      return;
    }

    setErrors({});
    submitted.current = true;
    const courseTitle = courses.find((course) => course.id === parsed.data.courseId)?.title ?? '';
    onSubmit({ ...parsed.data, courseTitle });
  };

  return (
    <QuestionFormContext
      value={{
        title,
        setTitle,
        text,
        setText,
        courseId,
        setCourseId,
        courses,
        coursesLoading,
        attachments,
        errors,
        hasFormatting: draft.hasFormatting,
        disabled,
        submitting,
        submit
      }}
    >
      <View style={styles.form}>{children}</View>
      <QuestionDiscardGuard active={edited && !submitting && !submitted.current} />
    </QuestionFormContext>
  );
}

function useFieldError(field: FieldName) {
  const { errors } = useQuestionForm();
  const t = useTranslations(communityCatalog);
  const key = errors[field];

  return key ? t(key) : undefined;
}

export function QuestionFormTitle() {
  const { title, setTitle, errors, disabled } = useQuestionForm();
  const t = useTranslations(communityCatalog);
  const error = useFieldError('title');

  return (
    <Field invalid={Boolean(errors.title)} disabled={disabled}>
      <FieldLabel>{t('fieldTitle')}</FieldLabel>
      <Input
        value={title}
        onChangeText={setTitle}
        placeholder={t('fieldTitlePlaceholder')}
        maxLength={200}
        returnKeyType="next"
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export function QuestionFormCourse() {
  const { colors } = useTheme();
  const { courseId, setCourseId, courses, coursesLoading, errors, disabled } = useQuestionForm();
  const t = useTranslations(communityCatalog);
  const error = useFieldError('courseId');
  const picker = useRef<SheetRef>(null);
  const selected = courses.find((course) => course.id === courseId);
  const placeholder = coursesLoading
    ? t('coursesLoading')
    : courses.length === 0
      ? t('coursesEmpty')
      : t('chooseCourse');

  return (
    <Field invalid={Boolean(errors.courseId)} disabled={disabled}>
      <FieldLabel>{t('fieldCourse')}</FieldLabel>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('fieldCourseLabel', { course: selected?.title ?? placeholder })}
        disabled={disabled || courses.length === 0}
        onPress={() => picker.current?.present()}
        style={[
          styles.select,
          { backgroundColor: colors.surface, borderColor: errors.courseId ? colors.danger : colors.border },
          disabled && styles.disabled
        ]}
      >
        <Text tone={selected ? 'ink' : 'subtle'} numberOfLines={1} style={styles.selectLabel}>
          {selected?.title ?? placeholder}
        </Text>
        <Icon icon={CaretDownIcon} size={18} tone="muted" />
      </Pressable>
      <FieldError>{error}</FieldError>
      <OptionSheet ref={picker}>
        <OptionSheetTitle>{t('fieldCourse')}</OptionSheetTitle>
        {courses.map((course) => (
          <OptionSheetItem key={course.id} selected={course.id === courseId} onSelect={() => setCourseId(course.id)}>
            {course.title}
          </OptionSheetItem>
        ))}
        <OptionSheetCancel />
      </OptionSheet>
    </Field>
  );
}

export function QuestionFormBody() {
  const { text, setText, errors, disabled } = useQuestionForm();
  const t = useTranslations(communityCatalog);
  const error = useFieldError('body');

  return (
    <Field invalid={Boolean(errors.body)} disabled={disabled}>
      <FieldLabel>{t('fieldDetails')}</FieldLabel>
      <InputGroup style={styles.bodyGroup}>
        <InputGroupInput
          value={text}
          onChangeText={setText}
          placeholder={t('fieldDetailsPlaceholder')}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
          style={styles.bodyInput}
        />
      </InputGroup>
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export function QuestionFormImages() {
  const { attachments, disabled, submitting } = useQuestionForm();
  const t = useTranslations(communityCatalog);

  return (
    <View style={styles.images}>
      <ComposerAttachments items={attachments.items} onRemove={attachments.remove} />
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || submitting}
        onPress={() => void attachments.pick()}
        style={styles.addImage}
      >
        <ButtonIcon icon={ImageSquareIcon} />
        <ButtonText>{t('addImages')}</ButtonText>
      </Button>
    </View>
  );
}

/** Shown when editing a question written with formatting from the web editor that this form cannot keep. */
export function QuestionFormFormattingNotice() {
  const { hasFormatting } = useQuestionForm();
  const t = useTranslations(communityCatalog);
  if (!hasFormatting) return null;

  return (
    <Banner tone="info">
      <BannerIcon icon={InfoIcon} />
      <BannerContent>
        <BannerDescription>{t('formattingNotice')}</BannerDescription>
      </BannerContent>
    </Banner>
  );
}

/** The form's submit action, placed in the navigation bar so it stays reachable above the keyboard. */
export function QuestionFormSubmit({ children }: { children: string }) {
  const { submit, submitting, disabled, attachments } = useQuestionForm();
  const blocked = disabled || submitting || attachments.uploading;

  return (
    <Stack.Screen
      options={{
        headerRight: () =>
          submitting ? (
            <Spinner tone="primary" />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: blocked }}
              disabled={blocked}
              hitSlop={HIT_SLOP}
              onPress={submit}
              style={({ pressed }) => [styles.headerAction, (pressed || blocked) && styles.disabled]}
            >
              <Text variant="label" tone="primary">
                {children}
              </Text>
            </Pressable>
          )
      }}
    />
  );
}

const styles = StyleSheet.create({
  form: { gap: SPACING.lg },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: 48,
    paddingHorizontal: SPACING.sm + 2,
    borderWidth: 1,
    borderRadius: RADII.input,
    borderCurve: 'continuous'
  },
  selectLabel: { flex: 1 },
  disabled: { opacity: 0.55 },
  headerAction: { paddingHorizontal: SPACING.xxs },
  bodyGroup: { alignItems: 'stretch' },
  bodyInput: { minHeight: 160 },
  images: { gap: SPACING.sm },
  addImage: { alignSelf: 'flex-start' }
});
