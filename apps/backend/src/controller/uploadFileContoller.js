const { promisify } = require('util');
const fs = require('fs');
const unlinkAsync = promisify(fs.unlink);
const { Upload } = require('@aws-sdk/lib-storage');
const {
  S3Client,
  PutObjectCommand
  // GetObjectCommand,
} = require('@aws-sdk/client-s3');
const genUniqueId = require('../utils/genUniqueId');

const {
  CLOUDFLARE_ACCESS_KEY,
  CLOUDFLARE_SECRET_ACCESS_KEY,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_PUBLIC_ACCOUNT_ID
} = process.env;

const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY
  }
});

module.exports.UploadFileController = async (req, res) => {
  console.log(req);

  const {
    file,
    query: { lessonId }
  } = req;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'You must provide a file to upload'
    });
  }

  // params for s3 upload
  const fileData = fs.readFileSync(file.path);
  const fileName = `${genUniqueId()}-${file.originalname}`;

  const params = {
    Bucket: 'videos',
    Key: fileName,
    Body: fileData
  };
  const fileUrl = `https://pub-${CLOUDFLARE_PUBLIC_ACCOUNT_ID}.r2.dev/${fileName}`;
  let metadata = {};
  try {
    // upload file to s3 parallelly in chunks
    // it supports min 5MB of file size
    const uploadParallel = new Upload({
      client: S3,
      queueSize: 4, // optional concurrency configuration
      partSize: 5542880, // optional size of each part
      leavePartsOnError: false, // optional manually handle dropped parts
      params
    });

    // checking progress of upload
    uploadParallel.on('httpUploadProgress', (progress) => {
      console.log(progress);
    });

    // after completion of upload
    uploadParallel.done().then((data) => {
      console.log('upload completed!', { data });
      unlinkAsync(file.path);
      res.json({
        success: true,
        url: fileUrl,
        metadata,
        message: 'Uploaded successfully'
      });
      //   res.send(data);
    });
  } catch (error) {
    unlinkAsync(file.path);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
};
