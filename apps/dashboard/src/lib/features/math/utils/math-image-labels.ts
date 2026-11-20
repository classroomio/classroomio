import type { MathImageLabels } from '@cio/ui/custom/math-text';

type Translate = (key: string) => string;

export function getMathImageLabels(translate: Translate): MathImageLabels {
  return {
    fromImage: translate('math_vision.image.from_image'),
    photoTab: translate('math_vision.image.photo_tab'),
    drawTab: translate('math_vision.image.draw_tab'),
    upload: translate('math_vision.image.upload'),
    takePhoto: translate('math_vision.image.take_photo'),
    photoHint: translate('math_vision.image.photo_hint'),
    cropHint: translate('math_vision.image.crop_hint'),
    resetCrop: translate('math_vision.image.reset_crop'),
    convert: translate('math_vision.image.convert'),
    converting: translate('math_vision.image.converting'),
    drawHint: translate('math_vision.image.draw_hint'),
    clear: translate('math_vision.image.clear'),
    original: translate('math_vision.image.original'),
    converted: translate('math_vision.image.converted'),
    insert: translate('math_vision.image.insert'),
    noMathFound: translate('math_vision.image.no_math_found'),
    parseFailed: translate('math_vision.image.parse_failed'),
    invalidMath: translate('math_vision.image.invalid_math'),
    unsupportedFile: translate('math_vision.image.unsupported_file'),
    imageTooLarge: translate('math_vision.image.image_too_large'),
    conversionFailed: translate('math_vision.image.conversion_failed')
  };
}
