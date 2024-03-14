const AWS = require('aws-sdk');
const { orderBy } = require('lodash');
const {
  S3Client,
  PutObjectCommand
  // GetObjectCommand,
} = require('@aws-sdk/client-s3');
const fs = require('fs');

const {
  CLOUDFLARE_ACCESS_KEY,
  CLOUDFLARE_SECRET_ACCESS_KEY,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_PUBLIC_ACCOUNT_ID
} = process.env;

const S3 = new AWS.S3({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = 'videos';

const UploadController = {
  initializeMultipartUpload: async (req, res) => {
    const { name } = req.body;

    const multipartParams = {
      Bucket: BUCKET_NAME,
      Key: `${name}`,
      ACL: 'public-read'
    };

    const multipartUpload = await S3.createMultipartUpload(multipartParams).promise();

    res.send({
      fileId: multipartUpload.UploadId,
      fileKey: multipartUpload.Key,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  },

  getMultipartPreSignedUrls: async (req, res) => {
    const { fileKey, fileId, parts } = req.body;

    const multipartParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      UploadId: fileId
    };

    const promises = [];

    for (let index = 0; index < parts; index++) {
      promises.push(
        S3.getSignedUrlPromise('uploadPart', {
          ...multipartParams,
          PartNumber: index + 1
        })
      );
    }

    const signedUrls = await Promise.all(promises);

    const partSignedUrlList = signedUrls.map((signedUrl, index) => {
      return {
        signedUrl: signedUrl,
        PartNumber: index + 1
      };
    });

    res.send({
      parts: partSignedUrlList
    });
  },

  finalizeMultipartUpload: async (req, res) => {
    const { fileId, fileKey, parts } = req.body;

    const multipartParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      UploadId: fileId,
      MultipartUpload: {
        // ordering the parts to make sure they are in the right order
        Parts: orderBy(parts, ['PartNumber'], ['asc'])
      }
    };

    await S3.completeMultipartUpload(multipartParams).promise();

    const fileUrl = `https://pub-${CLOUDFLARE_PUBLIC_ACCOUNT_ID}.r2.dev/${fileKey}`;
    let metadata = {};

    res.json({
      success: true,
      url: fileUrl,
      metadata,
      message: 'Uploaded successfully'
    });
    res.send();
  }
};

module.exports = { UploadController };
