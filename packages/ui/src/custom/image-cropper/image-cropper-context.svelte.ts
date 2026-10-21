import type { CropArea, DispatchEvents } from 'svelte-easy-crop';

import { Context } from 'runed';
import type { ImageCropperRootStateProps } from './types';
import { getCroppedImg } from './utils';

// https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#supported_image_formats
export const VALID_IMAGE_TYPES = [
  'image/apng',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp'
];

class ImageCropperRootState {
  #createdUrls = $state<string[]>([]);
  open = $state(false);
  tempUrl = $state<string>();
  pixelCrop = $state<CropArea>();
  error = $state<string>();
  processing = $state(false);

  constructor(readonly opts: ImageCropperRootStateProps) {
    this.onUpload = this.onUpload.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onCrop = this.onCrop.bind(this);
    this.dispose = this.dispose.bind(this);
  }

  get disabled() {
    return this.opts.disabled?.current ?? false;
  }

  onUpload(file: File) {
    // Don't upload if disabled
    if (this.disabled) {
      return;
    }

    this.error = undefined;

    // Check file size first if maxFileSize is specified
    if (this.opts.maxFileSize?.current !== undefined) {
      const maxFileSize = this.opts.maxFileSize.current;
      if (file.size > maxFileSize) {
        this.opts.onUnsupportedFile.current(file);
        return;
      }
    }

    // Check file type
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      this.opts.onUnsupportedFile.current(file);
      return;
    }

    if (this.opts.skipCrop?.current) {
      const onFileSelected = this.opts.onFileSelected?.current;
      if (onFileSelected) {
        onFileSelected(file);
        return;
      }

      this.tempUrl = URL.createObjectURL(file);
      this.#createdUrls.push(this.tempUrl);
      void this.onUseOriginal();
      return;
    }

    this.tempUrl = URL.createObjectURL(file);
    this.#createdUrls.push(this.tempUrl);
    this.open = true;
  }

  onCancel() {
    this.tempUrl = undefined;
    this.open = false;
    this.pixelCrop = undefined;
    this.error = undefined;
  }

  async onUseOriginal() {
    if (!this.tempUrl || this.processing) return;

    this.error = undefined;
    this.processing = true;

    try {
      const originalUrl = this.tempUrl;
      this.opts.src.current = originalUrl;

      await this.opts.onCropped.current(originalUrl);
      this.onCancel();
    } catch (error) {
      console.error('Image crop callback failed:', error);
      this.error = error instanceof Error ? error.message : 'Failed to use this image. Please try again.';
      this.open = true;
    } finally {
      this.processing = false;
    }
  }

  async onCrop() {
    if (!this.pixelCrop || !this.tempUrl || this.processing) return;

    this.error = undefined;
    this.processing = true;

    try {
      const outputFormat = this.opts.outputFormat?.current;
      const croppedUrl = await getCroppedImg(this.tempUrl, this.pixelCrop, 0, outputFormat);
      this.opts.src.current = croppedUrl;

      await this.opts.onCropped.current(croppedUrl);
      this.onCancel();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to crop this image. Please try again.';
    } finally {
      this.processing = false;
    }
  }

  get src() {
    return this.opts.src.current;
  }

  get id() {
    return this.opts.id.current;
  }

  dispose() {
    for (const url of this.#createdUrls) {
      URL.revokeObjectURL(url);
    }
  }
}

class ImageCropperTriggerState {
  constructor(readonly rootState: ImageCropperRootState) {}
}

class ImageCropperPreviewState {
  constructor(readonly rootState: ImageCropperRootState) {}
}

class ImageCropperDialogState {
  constructor(readonly rootState: ImageCropperRootState) {}
}

class ImageCropperCropperState {
  constructor(readonly rootState: ImageCropperRootState) {
    this.onCropComplete = this.onCropComplete.bind(this);
  }

  onCropComplete(e: DispatchEvents['cropcomplete']) {
    this.rootState.pixelCrop = e.pixels;
  }
}

class ImageCropperCropState {
  constructor(readonly rootState: ImageCropperRootState) {
    this.onclick = this.onclick.bind(this);
  }

  async onclick() {
    await this.rootState.onCrop();
  }
}

class ImageCropperCancelState {
  constructor(readonly rootState: ImageCropperRootState) {
    this.onclick = this.onclick.bind(this);
  }

  onclick() {
    this.rootState.onCancel();
  }
}

class ImageCropperUseOriginalState {
  constructor(readonly rootState: ImageCropperRootState) {
    this.onclick = this.onclick.bind(this);
  }

  async onclick() {
    await this.rootState.onUseOriginal();
  }
}

const ImageCropperRootContext = new Context<ImageCropperRootState>('ImageCropper.Root');

export const useImageCropperRoot = (props: ImageCropperRootStateProps) => {
  return ImageCropperRootContext.set(new ImageCropperRootState(props));
};

export const useImageCropperTrigger = () => {
  const rootState = ImageCropperRootContext.get();

  return new ImageCropperTriggerState(rootState);
};

export const useImageCropperPreview = () => {
  const rootState = ImageCropperRootContext.get();

  return new ImageCropperPreviewState(rootState);
};

export const useImageCropperDialog = () => {
  const rootState = ImageCropperRootContext.get();

  return new ImageCropperDialogState(rootState);
};

export const useImageCropperCropper = () => {
  const rootState = ImageCropperRootContext.get();

  return new ImageCropperCropperState(rootState);
};

export const useImageCropperCrop = () => {
  const rootState = ImageCropperRootContext.get();

  return new ImageCropperCropState(rootState);
};

export const useImageCropperCancel = () => {
  const rootState = ImageCropperRootContext.get();

  return new ImageCropperCancelState(rootState);
};

export const useImageCropperUseOriginal = () => {
  const rootState = ImageCropperRootContext.get();

  return new ImageCropperUseOriginalState(rootState);
};
