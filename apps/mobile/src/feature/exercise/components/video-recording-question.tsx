import { File } from 'expo-file-system';
import { RotateCcw, Trash2, Video, X } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { useApi } from '@/feature/common/components/api-provider';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { uploadVideoRecording } from '@/feature/exercise/api/media-upload';
import { useExerciseSession, useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import {
  MediaAttachment,
  MediaAttachmentActions,
  MediaAttachmentContent,
  MediaAttachmentProgress,
  MediaAttachmentRow,
  MediaAttachmentThumb
} from '@/feature/exercise/components/media-attachment';
import { VideoRecorder, type RecordedVideo } from '@/feature/exercise/components/video-recorder';
import { formatDuration, formatFileSize } from '@/feature/exercise/helpers/format';
import { videoMaxSecondsOf } from '@/feature/exercise/helpers/question-model';
import type { ExerciseQuestion, VideoRecordingMimeType } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

function mimeTypeOf(uri: string): VideoRecordingMimeType {
  return uri.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
}

export function VideoRecordingQuestion({ question }: { question: ExerciseQuestion }) {
  const api = useApi();
  const t = useTranslations(exerciseCatalog);
  const format = useFormatters();
  const { courseId, exerciseId, uploads, startUpload, retryUpload, cancelUpload } = useExerciseSession();
  const { key, answer, setAnswer } = useQuestionAnswer(question, 'VIDEO_RECORDING');
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [takes, setTakes] = useState(answer ? (answer.retakeCount ?? 0) + 1 : 0);
  const upload = uploads[key];
  const maxSeconds = videoMaxSecondsOf(question);

  const acceptTake = (take: RecordedVideo) => {
    setRecorderOpen(false);
    const retakeCount = takes;
    setTakes(takes + 1);

    const mimeType = mimeTypeOf(take.uri);
    const extension = mimeType === 'video/quicktime' ? 'mov' : 'mp4';
    const size = new File(take.uri).size;
    const media = { uri: take.uri, name: `video-answer-${Date.now()}.${extension}`, mimeType, size };

    startUpload(key, {
      fileName: t('videoAnswer'),
      size,
      run: (onProgress, signal) =>
        uploadVideoRecording(
          {
            courseId,
            exerciseId,
            questionId: Number(question.id),
            media,
            durationSeconds: Math.round(take.durationSeconds * 10) / 10,
            recordedAt: take.recordedAt,
            retakeCount
          },
          { api, onProgress, signal }
        )
    });
  };

  const recorder = (
    <VideoRecorder
      open={recorderOpen}
      maxSeconds={maxSeconds}
      onClose={() => setRecorderOpen(false)}
      onUse={acceptTake}
    />
  );

  if (upload) {
    const failed = upload.status === 'failed';

    return (
      <MediaAttachment>
        <MediaAttachmentRow>
          <MediaAttachmentThumb icon={Video} />
          <MediaAttachmentContent
            title={t('videoAnswer')}
            description={
              failed
                ? (upload.error ?? t('uploadFailed'))
                : [formatFileSize(upload.size, t, format), t('uploading')].filter(Boolean).join(' · ')
            }
            tone={failed ? 'danger' : 'muted'}
          />
          {!failed && (
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel={t('cancelUpload')}
              onPress={() => cancelUpload(key)}
            >
              <ButtonIcon icon={X} />
            </Button>
          )}
        </MediaAttachmentRow>
        {failed ? (
          <MediaAttachmentActions>
            <Button variant="outline" size="sm" onPress={() => retryUpload(key)}>
              <ButtonIcon icon={RotateCcw} />
              <ButtonText>{t('retryUpload')}</ButtonText>
            </Button>
            <Button variant="ghost" size="sm" onPress={() => cancelUpload(key)}>
              <ButtonText>{t('discard')}</ButtonText>
            </Button>
          </MediaAttachmentActions>
        ) : (
          <MediaAttachmentProgress value={upload.progress} />
        )}
      </MediaAttachment>
    );
  }

  if (answer) {
    return (
      <View style={styles.wrap}>
        <MediaAttachment>
          <MediaAttachmentRow>
            <MediaAttachmentThumb icon={Video} />
            <MediaAttachmentContent
              title={t('videoAnswer')}
              description={[
                formatDuration(answer.durationSeconds),
                formatFileSize(answer.size, t, format),
                t('uploaded')
              ]
                .filter(Boolean)
                .join(' · ')}
            />
            <Button variant="ghost" size="icon" accessibilityLabel={t('removeVideo')} onPress={() => setAnswer(null)}>
              <ButtonIcon icon={Trash2} />
            </Button>
          </MediaAttachmentRow>
          <MediaAttachmentActions>
            <Button variant="outline" size="sm" onPress={() => setRecorderOpen(true)}>
              <ButtonIcon icon={RotateCcw} />
              <ButtonText>{t('recordAgain')}</ButtonText>
            </Button>
          </MediaAttachmentActions>
        </MediaAttachment>
        <Text variant="caption" tone="muted">
          {t('newRecordingReplaces')}
        </Text>
        {recorder}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Button variant="outline" size="lg" onPress={() => setRecorderOpen(true)}>
        <ButtonIcon icon={Video} />
        <ButtonText>{t('recordVideo')}</ButtonText>
      </Button>
      <Text variant="caption" tone="muted">
        {t('recordVideoHint', { duration: formatDuration(maxSeconds) })}
      </Text>
      {recorder}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.sm }
});
