import { ScrollIcon } from 'phosphor-react-native/src/icons/Scroll';
import { SparkleIcon } from 'phosphor-react-native/src/icons/Sparkle';
import { offlineMediaKey } from '@cio/utils/functions/offline-media';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { VideoPlayer } from 'expo-video';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SheetRef } from '@/feature/common/components/bottom-sheet';
import { OfflineNotice } from '@/feature/common/components/offline-notice';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { CourseLink, CourseLinks } from '@/feature/course/components/course-links';
import { lessonKindLabel } from '@/feature/course/helpers/content-copy';
import { isAccessible } from '@/feature/course/helpers/course-content';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { CourseContentItem } from '@/feature/course/types/course-detail';
import { LessonDownloadHeaderButton } from '@/feature/downloads/components/download-header-button';
import { useOfflineLesson, useOfflineLessonHtml } from '@/feature/downloads/helpers/use-offline-lesson';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useCompleteLessonMutation } from '@/feature/lesson/api/lesson';
import { LessonContent } from '@/feature/lesson/components/lesson-content';
import { LessonDocuments } from '@/feature/lesson/components/lesson-documents';
import {
  LessonCompleteMoment,
  type LessonCompleteMomentProps
} from '@/feature/lesson/components/lesson-complete-moment';
import { LessonCompletion, LessonFooter, LessonNavigation } from '@/feature/lesson/components/lesson-footer';
import { LessonHeaderTitle } from '@/feature/lesson/components/lesson-header-title';
import { LessonPager, LessonSwipeExclusion } from '@/feature/lesson/components/lesson-pager';
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
import { openNeighbor, replaceAnimationOf, type LessonDirection } from '@/feature/lesson/helpers/open-neighbor';
import { useLessonPlayer } from '@/feature/lesson/helpers/use-lesson-player';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import { isNetworkError } from '@/feature/offline/helpers/network-error';
import { useCompletionPending } from '@/feature/offline/helpers/sync-queue';
import { useQueueLessonCompletion } from '@/feature/offline/helpers/use-offline-progress';
import { showToast } from '@/feature/toast/helpers/toast-store';

export default function LessonScreen() {
  const { courseId, lessonId, from } = useLocalSearchParams<{ courseId: string; lessonId: string; from?: string }>();
  const t = useTranslations(lessonCatalog);
  const courseT = useTranslations(courseCatalog);
  const { colors } = useTheme();
  const view = useLessonPlayer(courseId, lessonId);
  const completion = useCompleteLessonMutation(courseId, lessonId);
  const [player, setPlayer] = useState<VideoPlayer | null>(null);
  const transcriptSheet = useRef<SheetRef>(null);
  const tutorSheet = useRef<SheetRef>(null);
  const [moment, setMoment] = useState<
    Omit<LessonCompleteMomentProps, 'onFinish'> & { advance: (() => void) | null }
  >();
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
        animationTypeForReplace: replaceAnimationOf(from),
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

  const openItem = (target: CourseContentItem, direction: LessonDirection) => openNeighbor(courseId, target, direction);
  const next = view.next;

  const completeOnDevice = async () => {
    try {
      await queueCompletion();
    } catch (error) {
      showToast({ tone: 'danger', title: t('progressNotSaved'), description: errorMessage(error) });
      return;
    }

    setMoment({
      description: t('savedOnDeviceDescription'),
      advance: next && isAccessible(next) ? () => openItem(next, 'next') : null
    });
  };

  const setComplete = (isComplete: boolean) => {
    if (isComplete && offline) {
      void completeOnDevice();
      return;
    }

    completion.mutate(isComplete, {
      onSuccess: () => {
        if (!isComplete) return;

        setMoment({
          description: next ? t('nextItem', { title: next.title }) : null,
          advance: next ? () => openItem(next, 'next') : null
        });
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
      <LessonPager previous={view.previous} next={next} onNavigate={openItem} onRefresh={() => view.lesson.refetch()}>
        {view.videos.map(({ source, video }, index) => (
          <LessonSwipeExclusion key={`${source.kind}-${index}`}>
            <LessonVideo
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
          </LessonSwipeExclusion>
        ))}

        <LiveSessionCard
          callUrl={lesson.callUrl}
          lessonAt={lesson.lessonAt}
          sessionDurationMinutes={lesson.sessionDurationMinutes}
          recordingUrl={lesson.recordingUrl}
          offline={offline}
        />

        <View style={styles.heading}>
          {meta ? (
            <Text variant="captionStrong" tone="muted">
              {meta}
            </Text>
          ) : null}
          <Text variant="display" accessibilityRole="header">
            {title}
          </Text>
        </View>

        {view.body && content.html ? <LessonContent html={content.html} lang={view.body.locale} /> : null}

        {view.slides.length > 0 ? (
          <ScreenSection>
            <ScreenSectionHeader title={t('slides')} />
            {offline ? (
              <OfflineNotice title={t('slidesNeedConnection')} description={t('slidesNeedConnectionDescription')} />
            ) : (
              <LessonSwipeExclusion>
                <LessonSlides decks={view.slides} />
              </LessonSwipeExclusion>
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
                icon={ScrollIcon}
                title={t('transcript')}
                description={
                  player && primaryVideo?.source.kind !== 'embed' ? t('transcriptTapToPlay') : t('transcriptReadAlong')
                }
                onPress={() => transcriptSheet.current?.present()}
              />
            ) : null}
            {view.tutor.enabled ? (
              <CourseLink
                icon={SparkleIcon}
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
                    : tutorSheet.current?.present()
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
            next={next}
            items={items}
            onOpen={(target) => openItem(target, target.id === view.previous?.id ? 'previous' : 'next')}
          />
        </LessonFooter>
      </LessonPager>

      {view.transcript ? (
        <TranscriptSheet
          ref={transcriptSheet}
          segments={view.transcript.segments}
          player={primaryVideo?.source.kind === 'embed' ? null : player}
        />
      ) : null}

      {view.tutor.enabled ? (
        <TutorSheet
          ref={tutorSheet}
          courseId={courseId}
          lessonId={lessonId}
          lessonTitle={title}
          allowance={view.tutor.allowance}
          unavailable={view.tutor.unavailable}
          onOpenTranscript={view.transcript ? () => transcriptSheet.current?.present() : undefined}
        />
      ) : null}

      {moment ? (
        <LessonCompleteMoment
          description={moment.description}
          onFinish={() => (moment.advance ? moment.advance() : setMoment(undefined))}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  heading: { gap: SPACING.xs }
});
