import type { AvatarRootProps, DialogContentProps, WithChildren, WithoutChild, WithoutChildren } from 'bits-ui';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';

import type { CropperProps } from 'svelte-easy-crop';
import type { Snippet } from 'svelte';
import type { ReadableBoxedValues, WritableBoxedValues } from 'svelte-toolbelt';

export type ImageCropperRootPropsWithoutHTML = WithChildren<{
  id?: string;
  src?: string;
  onCropped?: (url: string) => void | Promise<void>;
  onUnsupportedFile?: (file: File) => void;
  onFileSelected?: (file: File) => void;
  maxFileSize?: number; // Maximum file size in bytes
  /** Skip the crop dialog and use the original file immediately. */
  skipCrop?: boolean;
  outputFormat?: 'image/png' | 'image/webp';
}>;

export type ImageCropperRootProps = ImageCropperRootPropsWithoutHTML & HTMLInputAttributes;

export type ImageCropperRootStateProps = WritableBoxedValues<{
  src: string;
}> &
  ReadableBoxedValues<{
    id: string;
    onCropped: (url: string) => void | Promise<void>;
    onUnsupportedFile: (file: File) => void;
    onFileSelected?: (file: File) => void;
    maxFileSize?: number;
    disabled?: boolean;
    skipCrop?: boolean;
    outputFormat?: 'image/png' | 'image/webp';
  }>;

export type ImageCropperTriggerProps = ReadableBoxedValues<{
  id?: string;
}>;

export type ImageCropperDialogProps = DialogContentProps;

export type ImageCropperCropperProps = Omit<Partial<CropperProps>, 'oncropcomplete' | 'image'>;

export type ImageCropperControlsWithoutHTML = WithChildren<{
  ref?: HTMLDivElement | null;
}>;

export type ImageCropperControlsProps = ImageCropperControlsWithoutHTML &
  WithoutChildren<HTMLAttributes<HTMLDivElement>>;

export type ImageCropperPreviewPropsWithoutHTML = {
  child?: Snippet<[{ src: string }]>;
};

export type ImageCropperPreviewProps = ImageCropperPreviewPropsWithoutHTML & WithoutChild<AvatarRootProps>;

export type ImageCropperUploadTriggerPropsWithoutHTML = WithChildren<{
  ref?: HTMLLabelElement | null;
}>;

export type ImageCropperUploadTriggerProps = ImageCropperUploadTriggerPropsWithoutHTML &
  WithoutChildren<HTMLAttributes<HTMLLabelElement>>;
