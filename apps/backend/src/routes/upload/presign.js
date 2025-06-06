const express = require('express');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('../../utils/s3');

const authMiddleware = require('../../middlewares/auth');

const router = express.Router();

const { generateFileKey } = require('../../utils/upload');
const { CLOUDFLARE } = require('../../constants');

const ALLOWED_CONTENT_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska'
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

router.post('/upload', authMiddleware, async (req, res) => {
  const { fileName, fileType, fileSize } = req.body;

  if (fileSize > MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      type: 'FILE_TOO_LARGE',
      message: 'File is too large. Maximum size is 500MB'
    });
  }

  if (!fileName) {
    return res.status(400).json({
      success: false,
      type: 'MISSING_FILENAME',
      message: 'File name is required'
    });
  }

  if (!fileType || !ALLOWED_CONTENT_TYPES.includes(fileType)) {
    return res.status(400).json({
      success: false,
      type: 'INVALID_CONTENT_TYPE',
      message: `Invalid content type. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`
    });
  }

  const fileKey = generateFileKey(fileName);

  try {
    const command = new PutObjectCommand({
      Bucket: CLOUDFLARE.R2.BUCKET,
      Key: fileKey,
      ContentType: fileType
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600
    });

    res.json({
      success: true,
      url: presignedUrl,
      fileKey,
      message: 'Pre-signed URL generated successfully'
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);

    if (error.name === 'SignatureDoesNotMatch') {
      return res.status(403).json({
        success: false,
        type: 'SIGNATURE_ERROR',
        message: 'Invalid signature for the request'
      });
    }

    res.status(500).json({
      success: false,
      type: 'INTERNAL_ERROR',
      message: 'Error generating pre-signed URL'
    });
  }
});

router.post('/download', authMiddleware, async (req, res) => {
  const { fileNames } = req.body;

  if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'File names array is required'
    });
  }

  try {
    const signedUrls = {};

    await Promise.all(
      fileNames.map(async (fileName) => {
        const command = new GetObjectCommand({
          Bucket: CLOUDFLARE.R2.BUCKET,
          Key: fileName
        });

        const presignedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 60 * 60 * 3 // 3 hours
        });

        signedUrls[fileName] = presignedUrl;
      })
    );

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
