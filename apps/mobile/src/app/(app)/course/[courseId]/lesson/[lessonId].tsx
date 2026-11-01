import { offlineMediaKey } from '@cio/utils/functions/offline-media';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { VideoPlayer } from 'expo-video';
import { ScrollText, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OfflineNotice } from '@/feature/common/components/offline-notice';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { CourseLink, CourseLinks } from '@/feature/course/components/course-links';
import { lessonKindLabel } from '@/feature/course/helpers/content-copy';
import { isAccessible } from '@/feature/course/helpers/course-content';
import { openContentItem } from '@/feature/course/helpers/open-content';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { LessonDownloadHeaderButton } from '@/feature/downloads/components/download-header-button';
import { useOfflineLesson, useOfflineLessonHtml } from '@/feature/downloads/helpers/use-offline-lesson';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useCompleteLessonMutation } from '@/feature/lesson/api/lesson';
import { LessonContent } from '@/feature/lesson/components/lesson-content';
import { LessonDocuments } from '@/feature/lesson/components/lesson-documents';
import { LessonCompletion, LessonFooter, LessonNavigation } from '@/feature/lesson/components/lesson-footer';
import { LessonHeaderTitle } from '@/feature/lesson/components/lesson-header-title';
import { LessonSlides } from '@/feature/lesson/components/lesson-slides';
import {
  LessonError,
  LessonLocked,
  LessonNeedsConnection,
  LessonSkeleton
} from '@/feature/lesson/components/lesson-state';
import { LessonVideo } from '@/feature/lesson/components/lesson-video';
import { LiveSessionCard } from '@/feature/lesson/components/live-session-card';
import { TranscriptSheet } from '@/feature/lesson/components/transcript-sheet';
import { TutorSheet } from '@/feature/lesson/components/tutor-sheet';
import { languageName } from '@/feature/lesson/helpers/lesson-locale';
import { useLessonPlayer } from '@/feature/lesson/helpers/use-lesson-player';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import { isNetworkError } from '@/feature/offline/helpers/network-error';
import { useCompletionPending } from '@/feature/offline/helpers/sync-queue';
import { useQueueLessonCompletion } from '@/feature/offline/helpers/use-offline-progress';
import { showToast } from '@/feature/toast/helpers/toast-store';

export default function LessonScreen() {
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const t = useTranslations(lessonCatalog);
  const courseT = useTranslations(courseCatalog);
  const view = useLessonPlayer(courseId, lessonId);
  const completion = useCompleteLessonMutation(courseId, lessonId);
  const [player, setPlayer] = useState<VideoPlayer | null>(null);
  const [sheet, setSheet] = useState<'transcript' | 'tutor' | null>(null);
  const lesson = view.lesson.data;
  const title = lesson?.title ?? view.item?.title ?? t('lessonFallbackTitle');
  const offline = useIsOffline();
  const local = useOfflineLesson(courseId, lessonId);
  const content = useOfflineLessonHtml(lessonId, view.body?.html ?? null, local.files);
  const completionPending = useCompletionPending(lessonId);
  const queueCompletion = useQueueLessonCompletion({
    courseId,
    lessonId,
    lessonTitle: title,
    courseTitle: view.course.data?.title
  });

  const header = (
    <Stack.Screen
      options={{
        headerTitle: () => <LessonHeaderTitle position={view.position} title={title} />,
        headerRight: lesson ? () => <LessonDownloadHeaderButton courseId={courseId} lessonId={lessonId} /> : undefined
      }}
    />
  );

  if (view.locked) {
    return (
      <>
        {header}
        <ScreenScrollView>
          <LessonLocked reason={view.lockReason} />
        </ScreenScrollView>
      </>
    );
  }

  if (view.lesson.isPending && offline) {
    return (
      <>
        {header}
        <ScreenScrollView>
          <LessonNeedsConnection onRetry={() => view.lesson.refetch()} />
        </ScreenScrollView>
      </>
    );
  }

  if (view.lesson.isPending || !local.ready) {
    return (
      <>
        {header}
        <ScreenScrollView scrollEnabled={false}>
          <LessonSkeleton />
        </ScreenScrollView>
      </>
    );
  }

  if (!lesson) {
    return (
      <>
        {header}
        <ScreenScrollView>
          <LessonError message={errorMessage(view.lesson.error)} onRetry={() => view.lesson.refetch()} />
        </ScreenScrollView>
      </>
    );
  }

  const complete = Boolean(view.item?.isComplete || lesson.watchProgress?.isComplete || completionPending);
  const items = view.outline?.items ?? [];
  const meta = [view.item ? lessonKindLabel(view.item, courseT) : null, languageName(view.body?.locale ?? null)]
    .filter(Boolean)
    .join(' · ');
  const primaryVideo = view.videos[0];

  const completeOnDevice = async () => {
    try {
      await queueCompletion();
    } catch (error) {
      showToast({ tone: 'danger', title: t('progressNotSaved'), description: errorMessage(error) });
      return;
    }

    successHaptic();
    showToast({ tone: 'success', title: t('savedOnDevice'), description: t('savedOnDeviceDescription') });
    if (view.next && isAccessible(view.next)) openContentItem(courseId, view.next, 'replace');
  };

  const setComplete = (isComplete: boolean) => {
    if (isComplete && offline) {
      void completeOnDevice();
      return;
    }

    completion.mutate(isComplete, {
      onSuccess: () => {
        if (!isComplete) return;

        successHaptic();
        if (view.next) openContentItem(courseId, view.next, 'replace');
        else showToast({ tone: 'success', title: t('lessonComplete') });
      },
      onError: (error) => {
        if (isComplete && isNetworkError(error)) {
          void completeOnDevice();
          return;
        }

        showToast({ tone: 'danger', title: t('progressNotSaved'), description: errorMessage(error) });
      }
    });
  };

  return (
    <>
      {header}
      <ScreenScrollView refreshing={view.lesson.isRefetching} onRefresh={() => view.lesson.refetch()}>
        {view.videos.map(({ source, video }, index) => (
          <LessonVideo
            key={`${source.kind}-${index}`}
            source={source}
            courseId={courseId}
            lessonId={lessonId}
            lessonTitle={title}
            courseTitle={view.course.data?.title}
            localUri={
              local.files.get(
                source.kind === 'hls'
                  ? offlineMediaKey({ assetId: source.assetId, link: video.link })
                  : offlineMediaKey(video)
              )?.uri ?? null
            }
            offline={offline}
            watchProgress={lesson.watchProgress}
            segments={index === 0 ? view.transcript?.segments : undefined}
            onPlayerChange={index === 0 ? setPlayer : undefined}
          />
        ))}

        <LiveSessionCard
          callUrl={lesson.callUrl}
          lessonAt={lesson.lessonAt}
          sessionDurationMinutes={lesson.sessionDurationMinutes}
          recordingUrl={lesson.recordingUrl}
          offline={offline}
        />

        <View style={styles.heading}>
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
          {meta ? (
            <Text variant="caption" tone="muted">
              {meta}
            </Text>
          ) : null}
        </View>

        {view.body && content.html ? <LessonContent html={content.html} lang={view.body.locale} /> : null}

        {view.slides.length > 0 ? (
          <ScreenSection>
            <ScreenSectionHeader title={t('slides')} />
            {offline ? (
              <OfflineNotice title={t('slidesNeedConnection')} description={t('slidesNeedConnectionDescription')} />
            ) : (
              <LessonSlides decks={view.slides} />
            )}
          </ScreenSection>
        ) : null}

        {lesson.documents && lesson.documents.length > 0 ? (
          <ScreenSection>
            <ScreenSectionHeader title={t('documents')} />
            <LessonDocuments documents={lesson.documents} localFiles={local.files} />
          </ScreenSection>
        ) : null}

        {view.transcript || view.tutor.enabled ? (
          <CourseLinks>
            {view.transcript ? (
              <CourseLink
                icon={ScrollText}
                title={t('transcript')}
                description={
                  player && primaryVideo?.source.kind !== 'embed' ? t('transcriptTapToPlay') : t('transcriptReadAlong')
                }
                onPress={() => setSheet('transcript')}
              />
            ) : null}
            {view.tutor.enabled ? (
              <CourseLink
                icon={Sparkles}
                title={t('askTutor')}
                description={
                  offline
                    ? t('needsConnection')
                    : view.tutor.allowance
                      ? t('tutorQuestionsLeft', {
                          remaining: view.tutor.allowance.remaining,
                          count: view.tutor.allowance.cap
                        })
                      : t('tutorAboutLesson')
                }
                onPress={() =>
                  offline
                    ? showToast({
                        tone: 'info',
                        title: t('tutorNeedsConnectionTitle'),
                        description: t('tutorNeedsConnectionDescription')
                      })
                    : setSheet('tutor')
                }
              />
            ) : null}
          </CourseLinks>
        ) : null}

        <LessonFooter>
          <LessonCompletion
            policy={lesson.completionPolicy}
            complete={complete}
            threshold={lesson.videoWatchThreshold}
            watchedPercent={lesson.watchProgress?.watchedPercent ?? null}
            hasNext={Boolean(view.next)}
            pending={completion.isPending}
            syncPending={completionPending && !view.item?.isComplete}
            onComplete={() => setComplete(true)}
            onUndo={() => setComplete(false)}
          />
          <LessonNavigation
            previous={view.previous}
            next={view.next}
            items={items}
            onOpen={(target) => openContentItem(courseId, target, 'replace')}
          />
        </LessonFooter>
      </ScreenScrollView>

      {view.transcript ? (
        <TranscriptSheet
          open={sheet === 'transcript'}
          onOpenChange={(open) => setSheet(open ? 'transcript' : null)}
          segments={view.transcript.segments}
          player={primaryVideo?.source.kind === 'embed' ? null : player}
        />
      ) : null}

      {view.tutor.enabled ? (
        <TutorSheet
          open={sheet === 'tutor'}
          onOpenChange={(open) => setSheet(open ? 'tutor' : null)}
          courseId={courseId}
          lessonId={lessonId}
          lessonTitle={title}
          allowance={view.tutor.allowance}
          unavailable={view.tutor.unavailable}
          onOpenTranscript={view.transcript ? () => setTimeout(() => setSheet('transcript'), 280) : undefined}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  heading: { gap: SPACING.xxs }
});
