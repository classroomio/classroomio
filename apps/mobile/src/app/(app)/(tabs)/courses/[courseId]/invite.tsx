import { CopyIcon } from 'phosphor-react-native/src/icons/Copy';
import { PaperPlaneTiltIcon } from 'phosphor-react-native/src/icons/PaperPlaneTilt';
import { ShareNetworkIcon } from 'phosphor-react-native/src/icons/ShareNetwork';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Banner, BannerContent, BannerDescription, BannerIcon, BannerTitle } from '@/feature/common/components/banner';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/feature/common/components/field';
import { InputGroup, InputGroupInput } from '@/feature/common/components/input';
import { withModalSafeArea } from '@/feature/common/components/modal-safe-area';
import { ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { SegmentedControl, SegmentedControlItem } from '@/feature/common/components/segmented-control';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useCourseInviteLinkQuery, useInviteByEmailMutation } from '@/feature/staff/api/course-people';
import { useStudentCapacityQuery } from '@/feature/staff/api/org-insights';
import { parseEmailList } from '@/feature/staff/helpers/email-list';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import type { InvitePreset } from '@/feature/staff/types/staff';
import { useTeachingCoursesQuery } from '@/feature/teach/api/teaching-courses';
import { showToast } from '@/feature/toast/helpers/toast-store';

const UPGRADE_REQUIRED = 'UPGRADE_REQUIRED';

function InviteScreen() {
  const t = useTranslations(staffCatalog);
  const common = useTranslations(commonCatalog);
  const format = useFormatters();
  const { colors, elevation } = useTheme();
  const { courseId = '' } = useLocalSearchParams<{ courseId: string }>();
  const course = useTeachingCoursesQuery().data?.find((candidate) => candidate.id === courseId);
  const capacity = useStudentCapacityQuery();
  const limitReached = capacity.data?.reached === true;
  const link = useCourseInviteLinkQuery(courseId);
  const invite = useInviteByEmailMutation(courseId);
  const [emailText, setEmailText] = useState('');
  const [preset, setPreset] = useState<InvitePreset>('MULTI_USE_7D');
  const [submitted, setSubmitted] = useState(false);
  const { valid, invalid } = parseEmailList(emailText);
  const canSend = valid.length > 0 && invalid.length === 0 && !invite.isPending;

  const send = () => {
    setSubmitted(true);
    if (!canSend) return;

    invite.mutate(
      { emails: valid, preset },
      {
        onSuccess: () => {
          successHaptic();
          showToast({ tone: 'success', title: t('invitesSent', { count: valid.length }), description: course?.title });
          router.back();
        },
        onError: (error) => {
          if ('code' in error && error.code === UPGRADE_REQUIRED) void capacity.refetch();

          showToast({ tone: 'danger', title: t('inviteFailed'), description: errorMessage(error) });
        }
      }
    );
  };

  const copyLink = async () => {
    if (!link.data) return;

    await Clipboard.setStringAsync(link.data.inviteLink);
    successHaptic();
    showToast({ tone: 'success', title: t('linkCopied') });
  };

  const shareLink = () => {
    if (!link.data) return;

    void Share.share({ message: course ? `${course.title}\n${link.data.inviteLink}` : link.data.inviteLink });
  };

  return (
    <KeyboardAwareScrollView
      contentInsetAdjustmentBehavior="automatic"
      bottomOffset={SPACING.xl}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      {course ? (
        <Text variant="subheading" numberOfLines={2}>
          {course.title}
        </Text>
      ) : null}

      {limitReached ? (
        <Banner tone="warning">
          <BannerIcon icon={WarningCircleIcon} />
          <BannerContent>
            <BannerTitle>{t('studentLimitTitle')}</BannerTitle>
            <BannerDescription>
              {t('studentLimitDescription', {
                used: format.number(capacity.data?.used ?? 0),
                limit: format.number(capacity.data?.limit ?? 0)
              })}
            </BannerDescription>
          </BannerContent>
        </Banner>
      ) : null}

      <ScreenSection>
        <ScreenSectionHeader title={t('inviteByEmail')} />
        <Field invalid={submitted && invalid.length > 0}>
          <FieldLabel>{t('emailsLabel')}</FieldLabel>
          <InputGroup style={styles.emailGroup}>
            <InputGroupInput
              value={emailText}
              onChangeText={setEmailText}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              textAlignVertical="top"
              placeholder={t('emailsPlaceholder')}
              style={styles.emailInput}
            />
          </InputGroup>
          {invalid.length > 0 ? (
            <FieldError>{t('invalidEmails', { count: invalid.length, emails: invalid.join(', ') })}</FieldError>
          ) : (
            <FieldDescription>{t('emailsDescription')}</FieldDescription>
          )}
        </Field>

        <Text variant="captionStrong" tone="muted">
          {t('inviteExpiry')}
        </Text>
        <SegmentedControl value={preset} onValueChange={setPreset}>
          <SegmentedControlItem value="ONE_TIME_24H">{t('expiry24h')}</SegmentedControlItem>
          <SegmentedControlItem value="MULTI_USE_7D">{t('expiry7d')}</SegmentedControlItem>
          <SegmentedControlItem value="MULTI_USE_30D">{t('expiry30d')}</SegmentedControlItem>
        </SegmentedControl>

        <Button size="lg" disabled={!canSend} onPress={send}>
          {invite.isPending ? <ButtonSpinner /> : <ButtonIcon icon={PaperPlaneTiltIcon} />}
          <ButtonText>
            {valid.length > 0 ? t('sendInvites', { count: valid.length }) : t('sendInvitesEmpty')}
          </ButtonText>
        </Button>
      </ScreenSection>

      <ScreenSection>
        <ScreenSectionHeader title={t('shareLink')} />
        <View
          style={[styles.linkCard, { backgroundColor: colors.surface, borderColor: colors.border }, elevation.raised]}
        >
          <Text variant="caption" tone="muted">
            {t('shareLinkDescription')}
          </Text>
          {link.isPending ? <Skeleton height={20} width="80%" /> : null}
          {link.isError ? (
            <Text variant="caption" tone="danger">
              {t('linkLoadErrorInline', { error: errorMessage(link.error) })}
            </Text>
          ) : null}
          {link.data ? (
            <>
              <Text variant="body" selectable numberOfLines={2}>
                {link.data.inviteLink}
              </Text>
              {link.data.isRevoked ? (
                <Text variant="caption" tone="warning">
                  {t('linkDisabled')}
                </Text>
              ) : link.data.joinCount > 0 ? (
                <Text variant="caption" tone="subtle">
                  {t('linkJoins', { count: link.data.joinCount })}
                </Text>
              ) : null}
              {!link.data.isRevoked ? (
                <View style={styles.linkActions}>
                  <Button variant="secondary" style={styles.linkAction} onPress={copyLink}>
                    <ButtonIcon icon={CopyIcon} />
                    <ButtonText>{t('copyLink')}</ButtonText>
                  </Button>
                  <Button variant="secondary" style={styles.linkAction} onPress={shareLink}>
                    <ButtonIcon icon={ShareNetworkIcon} />
                    <ButtonText>{common('share')}</ButtonText>
                  </Button>
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </ScreenSection>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.xl },
  emailGroup: { alignItems: 'stretch', minHeight: 112 },
  emailInput: { minHeight: 112 },
  linkCard: {
    gap: SPACING.sm,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.xl,
    borderCurve: 'continuous'
  },
  linkActions: { flexDirection: 'row', gap: SPACING.xs },
  linkAction: { flex: 1 }
});

export default withModalSafeArea(InviteScreen);
