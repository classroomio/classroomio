import FileTextIcon from '@lucide/svelte/icons/file-text';
import Gamepad2Icon from '@lucide/svelte/icons/gamepad-2';
import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
import PresentationIcon from '@lucide/svelte/icons/presentation';
import SmartphoneIcon from '@lucide/svelte/icons/smartphone';
import type { HtmlTemplate, HtmlTemplateTone } from '@cio/ui/custom/block';
import type { THtmlBlockData } from '@cio/utils/validation/block';
import { t } from '$lib/utils/functions/translations';

const TEMPLATES: { id: string; tone: HtmlTemplateTone; icon: HtmlTemplate['icon'] }[] = [
  { id: 'slides', tone: 'orange', icon: PresentationIcon },
  { id: 'dashboard', tone: 'pink', icon: LayoutDashboardIcon },
  { id: 'report', tone: 'red', icon: FileTextIcon },
  { id: 'explainer', tone: 'yellow', icon: LightbulbIcon },
  { id: 'prototype', tone: 'blue', icon: SmartphoneIcon },
  { id: 'game', tone: 'green', icon: Gamepad2Icon }
];

export function getHtmlTemplates(): HtmlTemplate[] {
  return TEMPLATES.map((template) => ({
    ...template,
    label: t.get(`course.navItem.lessons.materials.blocks.html.templates.${template.id}.label`),
    prompt: t.get(`course.navItem.lessons.materials.blocks.html.templates.${template.id}.prompt`)
  }));
}

/**
 * The signed URL the API adds to an HTML block when it reads the lesson; null before it has one.
 */
export function getHtmlContentUrl(data: THtmlBlockData): string | null {
  const url = (data as THtmlBlockData & { url?: unknown }).url;

  return typeof url === 'string' ? url : null;
}

export function getHtmlDownloadHref(contentUrl: string | null): string | undefined {
  return contentUrl ? `${contentUrl}&download=1` : undefined;
}
