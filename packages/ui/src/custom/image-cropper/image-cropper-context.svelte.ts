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
      this.onUseOriginal();
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

  onUseOriginal() {
    if (!this.tempUrl) return;

    this.opts.src.current = this.tempUrl;
    this.open = false;
    this.error = undefined;

    const onCroppedResult = this.opts.onCropped.current(this.tempUrl);
    void Promise.resolve(onCroppedResult).catch((error) => {
      console.error('Image crop callback failed:', error);
    });

    this.tempUrl = undefined;
    this.pixelCrop = undefined;
  }

  async onCrop() {
    if (!this.pixelCrop || !this.tempUrl) return;

    this.error = undefined;

    const outputFormat = this.opts.outputFormat?.current;
    this.opts.src.current = await getCroppedImg(this.tempUrl, this.pixelCrop, 0, outputFormat);

    this.open = false;

    await this.opts.onCropped.current(this.opts.src.current);
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
    try {
      await this.rootState.onCrop();
    } catch (error) {
      console.error('Image crop failed:', error);
      this.rootState.error = 'Failed to crop image. Please try again.';
    }
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

  onclick() {
    this.rootState.onUseOriginal();
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
