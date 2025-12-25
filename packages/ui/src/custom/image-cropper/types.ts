import type { AvatarRootProps, DialogContentProps, WithChildren, WithoutChild, WithoutChildren } from 'bits-ui';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';

import type { CropperProps } from 'svelte-easy-crop';
import type { Snippet } from 'svelte';

export type ImageCropperRootPropsWithoutHTML = WithChildren<{
  id?: string;
  src?: string;
  onCropped?: (url: string) => void;
  onUnsupportedFile?: (file: File) => void;
  maxFileSize?: number; // Maximum file size in bytes
}>;

export type ImageCropperRootProps = ImageCropperRootPropsWithoutHTML & HTMLInputAttributes;

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
