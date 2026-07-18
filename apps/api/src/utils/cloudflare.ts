import { CLOUDFLARE } from '@api/constants';

export type ScreenshotViewport = {
  width: number;
  height: number;
  deviceScaleFactor?: number;
};

export const getCloudflarePdfBuffer = async (html: string, styles?: string) => {
  console.log('Generating PDF with Cloudflare API...');
  try {
    const pdfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE.CONFIGS.ACCOUNT_ID}/browser-rendering/pdf`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CLOUDFLARE.CONFIGS.RENDERING_API_KEY}`
        },
        body: JSON.stringify({
          html: html,
          addStyleTag: [{ content: `${styles}` }]
        })
      }
    );

    console.log('PDF response status:', pdfResponse.status);
    const arrayBuffer = await pdfResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate PDF');
  }
};

/**
 * Renders HTML to a PNG via Cloudflare Browser Rendering's `/screenshot` endpoint.
 * Defaults to 1100x780 for certificate canvases; pass a custom viewport for other assets.
 */
export const getCloudflarePngBuffer = async (
  html: string,
  styles?: string,
  viewport: ScreenshotViewport = { width: 1100, height: 780, deviceScaleFactor: 2 }
) => {
  console.log('Generating PNG with Cloudflare API...');
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE.CONFIGS.ACCOUNT_ID}/browser-rendering/screenshot`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CLOUDFLARE.CONFIGS.RENDERING_API_KEY}`
        },
        body: JSON.stringify({
          html,
          addStyleTag: styles ? [{ content: styles }] : undefined,
          viewport: {
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: viewport.deviceScaleFactor ?? 2
          },
          screenshotOptions: { type: 'png', omitBackground: false, fullPage: false }
        })
      }
    );

    console.log('PNG response status:', response.status);
    const arrayBuffer = await response.arrayBuffer();

    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error generating PNG:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate PNG');
  }
};
