import type { HtmlBlockLabels, HtmlSourceDialogLabels } from '@cio/ui/custom/block';
import { t } from '$lib/utils/functions/translations';

const KEY = 'course.navItem.lessons.materials.blocks.html';

export function getHtmlBlockLabels(): HtmlBlockLabels {
  return {
    frameTitle: t.get(`${KEY}.frame_title`),
    interact: t.get(`${KEY}.interact`),
    fullScreen: t.get(`${KEY}.full_screen`),
    more: t.get(`${KEY}.more`),
    change: t.get(`${KEY}.change`),
    download: t.get(`${KEY}.download`),
    resizeWidth: t.get(`${KEY}.resize_width`),
    resizeHeight: t.get(`${KEY}.resize_height`),
    editWithAi: t.get(`${KEY}.edit_with_ai`),
    aiPlaceholder: t.get(`${KEY}.ai_edit_placeholder`),
    aiSubmit: t.get(`${KEY}.ai_edit_submit`),
    generating: t.get(`${KEY}.generating`)
  };
}

export function getHtmlSourceDialogLabels(): HtmlSourceDialogLabels {
  return {
    title: t.get(`${KEY}.dialog_title`),
    addTab: t.get(`${KEY}.add_tab`),
    codeTab: t.get(`${KEY}.code_tab`),
    upload: t.get(`${KEY}.upload`),
    uploadHint: t.get(`${KEY}.upload_hint`),
    createWithAi: t.get(`${KEY}.create_with_ai`),
    describePlaceholder: t.get(`${KEY}.describe_placeholder`),
    beta: t.get(`${KEY}.beta`),
    generate: t.get(`${KEY}.generate`),
    generating: t.get(`${KEY}.generating`),
    removeTemplate: t.get(`${KEY}.remove_template`),
    codePlaceholder: t.get(`${KEY}.code_placeholder`),
    insert: t.get(`${KEY}.insert`)
  };
}
