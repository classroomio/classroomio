const { S3Client } = require('@aws-sdk/client-s3');

const { CLOUDFLARE } = require('../constants');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE.CONFIGS.ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE.CONFIGS.ACCESS_KEY,
    secretAccessKey: CLOUDFLARE.CONFIGS.SECRET_ACCESS_KEY
  },
  forcePathStyle: false
});

module.exports = {
  s3Client
};
