import type { ImageLightboxLabels, LightboxImage } from '@cio/ui/custom/image-lightbox';

function screenshotSvg(title: string, accent: string): string {
  const rows = Array.from({ length: 6 }, (_, rowIndex) => {
    const y = 220 + rowIndex * 70;
    return `<rect x="300" y="${y}" width="900" height="50" rx="6" fill="#ffffff" stroke="#e3e7ef"/>
      <text x="324" y="${y + 32}" font-size="20" fill="#1f2a44">Row ${rowIndex + 1} · Quote Q-2026-01${40 + rowIndex}</text>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800" font-family="Helvetica, Arial, sans-serif">
    <rect width="1280" height="800" fill="#f4f6fa"/>
    <rect width="260" height="800" fill="#16233f"/>
    <rect x="16" y="120" width="228" height="40" rx="6" fill="${accent}"/>
    <text x="300" y="150" font-size="34" font-weight="700" fill="#16233f">${title}</text>
    ${rows}
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const SCREENSHOTS: LightboxImage[] = [
  { src: screenshotSvg('Quotes', '#2f6fed'), alt: 'Quotes list' },
  { src: screenshotSvg('New quote', '#0f766e'), alt: 'Quote editor' },
  { src: screenshotSvg('Settings', '#b45309'), alt: 'VAT settings' }
];

export const LIGHTBOX_LABELS: ImageLightboxLabels = {
  close: 'Close',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  previous: 'Previous image',
  next: 'Next image'
};
