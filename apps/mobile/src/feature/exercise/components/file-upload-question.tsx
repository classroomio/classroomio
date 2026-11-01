import { normalizeAcceptedFileTypes, formatAcceptedFileTypes, resolveFileUploadMimeType } from '@cio/utils/file-upload';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Camera, FileText, FolderOpen, Image as ImageIcon, RotateCcw, Trash2, X } from 'lucide-react-native';
import { Linking, StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { useApi } from '@/feature/common/components/api-provider';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { uploadExerciseFile, type LocalMedia } from '@/feature/exercise/api/media-upload';
import { useExerciseSession, useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import {
  MediaAttachment,
  MediaAttachmentActions,
  MediaAttachmentContent,
  MediaAttachmentProgress,
  MediaAttachmentRow,
  MediaAttachmentThumb
} from '@/feature/exercise/components/media-attachment';
import { formatFileSize } from '@/feature/exercise/helpers/format';
import { numberSetting, settingsOf } from '@/feature/exercise/helpers/question-model';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const BYTES_PER_MB = 1024 * 1024;

type PickedFile = { uri: string; name: string; mimeType?: string | null; size?: number | null };

export function FileUploadQuestion({ question }: { question: ExerciseQuestion }) {
  const api = useApi();
  const t = useTranslations(exerciseCatalog);
  const format = useFormatters();
  const { uploads, startUpload, retryUpload, cancelUpload } = useExerciseSession();
  const { key, answer, setAnswer } = useQuestionAnswer(question, 'FILE_UPLOAD');
  const upload = uploads[key];
  const acceptedTypes = normalizeAcceptedFileTypes(settingsOf(question).acceptedTypes);
  const maxSizeMb = numberSetting(question, 'maxSizeMb');
  const allowsImages = acceptedTypes.length === 0 || acceptedTypes.some((type) => type.startsWith('image/'));

  const begin = (picked: PickedFile) => {
    const mimeType = resolveFileUploadMimeType({ name: picked.name, type: picked.mimeType ?? '' }, acceptedTypes);
    if (!mimeType) {
      showToast({
        tone: 'warning',
        title: t('fileTypeNotAccepted'),
        description:
          acceptedTypes.length > 0 ? t('acceptedTypes', { types: formatAcceptedFileTypes(acceptedTypes) }) : undefined
      });
      return;
    }

    const size = picked.size ?? 0;
    if (maxSizeMb !== null && maxSizeMb > 0 && size > maxSizeMb * BYTES_PER_MB) {
      showToast({
        tone: 'warning',
        title: t('fileTooLarge'),
        description: t('fileSizeLimit', { size: format.number(maxSizeMb) })
      });
      return;
    }

    const media: LocalMedia = { uri: picked.uri, name: picked.name, mimeType, size };
    startUpload(key, {
      fileName: media.name,
      size: media.size,
      previewUri: mimeType.startsWith('image/') ? media.uri : undefined,
      run: (onProgress, signal) => uploadExerciseFile(media, acceptedTypes, { api, onProgress, signal })
    });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: acceptedTypes.length > 0 ? acceptedTypes : '*/*',
      copyToCacheDirectory: true
    });
    const asset = result.canceled ? null : result.assets[0];
    if (asset) begin({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size });
  };

  const pickImage = async (source: 'library' | 'camera') => {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showToast({
          tone: 'warning',
          title: t('cameraAccessOff'),
          description: t('cameraAccessOffDescription')
        });
        if (!permission.canAskAgain) void Linking.openSettings();
        return;
      }
    }

    const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.85 };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    const name = asset.fileName ?? `photo-${Date.now()}.jpg`;
    begin({ uri: asset.uri, name, mimeType: asset.mimeType ?? 'image/jpeg', size: asset.fileSize });
  };

  const hint = [
    answer ? t('replaceFileHint') : null,
    acceptedTypes.length > 0 ? t('acceptedTypes', { types: formatAcceptedFileTypes(acceptedTypes) }) : null,
    maxSizeMb ? t('maxFileSize', { size: format.number(maxSizeMb) }) : null
  ]
    .filter(Boolean)
    .join(' ');

  if (upload) {
    const failed = upload.status === 'failed';

    return (
      <MediaAttachment>
        <MediaAttachmentRow>
          <MediaAttachmentThumb uri={upload.previewUri} icon={FileText} />
          <MediaAttachmentContent
            title={upload.fileName}
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

  return (
    <View style={styles.wrap}>
      {answer && (
        <MediaAttachment>
          <MediaAttachmentRow>
            <MediaAttachmentThumb
              uri={answer.mimeType?.startsWith('image/') ? answer.fileUrl : undefined}
              icon={FileText}
            />
            <MediaAttachmentContent
              title={answer.fileName}
              description={[formatFileSize(answer.size, t, format), t('uploaded')].filter(Boolean).join(' · ')}
            />
            <Button variant="ghost" size="icon" accessibilityLabel={t('removeFile')} onPress={() => setAnswer(null)}>
              <ButtonIcon icon={Trash2} />
            </Button>
          </MediaAttachmentRow>
        </MediaAttachment>
      )}

      <View style={styles.sources}>
        <Button variant="outline" style={styles.source} onPress={() => void pickDocument()}>
          <ButtonIcon icon={FolderOpen} />
          <ButtonText>{t('sourceFiles')}</ButtonText>
        </Button>
        {allowsImages && (
          <Button variant="outline" style={styles.source} onPress={() => void pickImage('library')}>
            <ButtonIcon icon={ImageIcon} />
            <ButtonText>{t('sourcePhotos')}</ButtonText>
          </Button>
        )}
        {allowsImages && (
          <Button variant="outline" style={styles.source} onPress={() => void pickImage('camera')}>
            <ButtonIcon icon={Camera} />
            <ButtonText>{t('sourceCamera')}</ButtonText>
          </Button>
        )}
      </View>

      {hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.sm },
  sources: { flexDirection: 'row', gap: SPACING.xs },
  source: { flex: 1, paddingHorizontal: SPACING.xs }
});
