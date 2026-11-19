import FileTextIcon from '@lucide/svelte/icons/file-text';
import Gamepad2Icon from '@lucide/svelte/icons/gamepad-2';
import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
import PresentationIcon from '@lucide/svelte/icons/presentation';
import SmartphoneIcon from '@lucide/svelte/icons/smartphone';
import type { HtmlTemplate, HtmlTemplateTone } from '@cio/ui/custom/block';
import { HTML_BLOCK_NAME_MAX_LENGTH } from '@cio/utils/validation/block';
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
 * A file name for a page: its <title> as a slug, or `fallback` when it has none.
 */
export function deriveHtmlName(html: string, fallback: string): string {
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? '';
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const name = slug ? `${slug}.html` : fallback;

  return name.slice(0, HTML_BLOCK_NAME_MAX_LENGTH);
}
