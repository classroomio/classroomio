import type { ExerciseQuestionOption } from '@cio/question-types';

export function getOptionImageUrl(option: ExerciseQuestionOption): string | null {
  const settings = option.settings;
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return null;
  }

  const imageUrl = settings.imageUrl;
  if (typeof imageUrl !== 'string') {
    return null;
  }

  const trimmedImageUrl = imageUrl.trim();
  return trimmedImageUrl.length > 0 ? trimmedImageUrl : null;
}

export function hasOptionImages(options: ExerciseQuestionOption[] | undefined | null): boolean {
  return (options ?? []).some((opt) => getOptionImageUrl(opt) !== null);
}

export function mergeOptionSettings(
  option: ExerciseQuestionOption,
  nextSettings: Record<string, unknown>
): ExerciseQuestionOption {
  const currentSettings =
    option.settings && typeof option.settings === 'object' && !Array.isArray(option.settings) ? option.settings : {};

  return {
    ...option,
    settings: {
      ...currentSettings,
      ...nextSettings
    }
  };
}

export function removeOptionSetting(option: ExerciseQuestionOption, key: string): ExerciseQuestionOption {
  const currentSettings =
    option.settings && typeof option.settings === 'object' && !Array.isArray(option.settings) ? option.settings : {};
  const nextSettings = { ...currentSettings };
  delete nextSettings[key];

  return {
    ...option,
    settings: nextSettings
  };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (!reader.result) {
        reject(new Error('Failed to read image file'));
        return;
      }

      resolve(String(reader.result));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read image file'));
    };

    reader.readAsDataURL(file);
  });
}
