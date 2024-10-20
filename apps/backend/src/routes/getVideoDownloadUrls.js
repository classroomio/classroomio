const express = require('express');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3, GetObjectCommand } = require('@aws-sdk/client-s3');

const router = express.Router();

const { CLOUDFLARE_BUCKET_DOMAIN, CLOUDFLARE_ACCESS_KEY, CLOUDFLARE_SECRET_ACCESS_KEY } =
  process.env;

const s3UploadClient = new S3({
  region: 'auto',
  endpoint: CLOUDFLARE_BUCKET_DOMAIN,
  signatureVersion: 'v4',
  credentials: {
    accessKeyId: CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY
  }
});

router.post('/', async (req, res) => {
  const { fileNames } = req.body;

  if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'File names array is required'
    });
  }

  try {
    const signedUrls = {};

    for (const fileName of fileNames) {
      const command = new GetObjectCommand({
        Bucket: 'videos',
        Key: fileName
      });

      const presignedUrl = await getSignedUrl(s3UploadClient, command, {
        expiresIn: 14400 // 4 hours
      });

      signedUrls[fileName] = presignedUrl;
    }

    res.json({
      success: true,
      urls: signedUrls,
      message: 'Video URLs retrieved successfully'
    });
  } catch (error) {
    console.error('Error Retrieving Video', error);
    res.status(500).json({
      success: false,
      message: 'Error Retrieving Video'
    });
  }
});

module.exports = router;
