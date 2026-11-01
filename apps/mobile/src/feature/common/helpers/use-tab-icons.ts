import { useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

import {
  PhosphorFill,
  PhosphorRegular,
  TAB_GLYPHS,
  TAB_ICON_SIZE,
  type TabGlyph
} from '@/feature/common/constants/phosphor-font';

type TabIconSource = { default: ImageSourcePropType; selected: ImageSourcePropType };

export type TabIcons = Partial<Record<TabGlyph, TabIconSource>>;

let rendered: TabIcons | null = null;
let rendering: Promise<TabIcons> | null = null;

async function renderTabIcon(glyph: TabGlyph) {
  const [regular, fill] = await Promise.all([
    PhosphorRegular.getImageSource(glyph, TAB_ICON_SIZE, 'white'),
    PhosphorFill.getImageSource(glyph, TAB_ICON_SIZE, 'white')
  ]);
  if (!regular || !fill) return null;

  return [glyph, { default: regular, selected: fill }] as const;
}

async function renderTabIcons() {
  const glyphs = Object.keys(TAB_GLYPHS) as TabGlyph[];
  const entries = await Promise.all(glyphs.map((glyph) => renderTabIcon(glyph).catch(() => null)));
  const icons: TabIcons = {};
  for (const entry of entries) {
    if (entry) icons[entry[0]] = entry[1];
  }
  rendered = icons;

  return icons;
}

/**
 * Tab bar glyphs rendered to images once per launch. Returns null until they are ready; the root layout waits for them
 * because the native tab bar does not re-measure every item when an icon arrives after its first layout.
 */
export function useTabIcons() {
  const [icons, setIcons] = useState(rendered);

  useEffect(() => {
    if (icons) return;

    let active = true;
    rendering ??= renderTabIcons();
    void rendering.then((result) => {
      if (active) setIcons(result);
    });

    return () => {
      active = false;
    };
  }, [icons]);

  return icons;
}
