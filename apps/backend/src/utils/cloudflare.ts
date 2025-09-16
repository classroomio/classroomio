import { CLOUDFLARE } from '$src/constants';

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
