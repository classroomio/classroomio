const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cloudflareApiKey = process.env.CLOUDFLARE_API_KEY;

export const getCloudflarePdfBuffer = async (html: string, styles?: string) => {
  console.log('Generating PDF with Cloudflare API...');
  try {
    const pdfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/browser-rendering/pdf`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cloudflareApiKey}`
        },
        body: JSON.stringify({
          html: html,
          addStyleTag: [{ content: `${styles}` }]
        })
      }
    );

    console.log('PDF response status:', pdfResponse.status);
    return pdfResponse;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate PDF');
  }
};
