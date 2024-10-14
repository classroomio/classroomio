const express = require('express');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const {
    S3,
    PutObjectCommand
} = require('@aws-sdk/client-s3');

const router = express.Router();

const {
    CLOUDFLARE_BUCKET_DOMAIN,
    CLOUDFLARE_ACCESS_KEY,
    CLOUDFLARE_SECRET_ACCESS_KEY,
    CLOUDFLARE_BUCKET_ID,
} = process.env;

const genUniqueId = require('../utils/genUniqueId');

const s3UploadClient = new S3({
    region: "auto",
    endpoint: CLOUDFLARE_BUCKET_DOMAIN,
    signatureVersion: "v4",
    credentials: {
        accessKeyId: CLOUDFLARE_ACCESS_KEY,
        secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY,
    },
});


router.post('/', async (req, res) => {
    const { fileName, fileType, fileSize } = req.body;

    // File upload limit is 500MB
    const fileSizeInMegabytes = fileSize / (1024 * 1024);

    if (fileSizeInMegabytes > 500) {
        return res.status(400).json({
            success: false,
            type: 'FILE_TOO_LARGE',
            message: 'File is too large'
        });
    }


    if (!fileName) {
        return res.status(400).json({
            success: false,
            message: 'File name is required'
        });
    }

    const fileKey = `${genUniqueId()}-${fileName.split(' ').join('-')}`;
    const fileOrigin = CLOUDFLARE_BUCKET_DOMAIN ?? `https://pub-${CLOUDFLARE_BUCKET_ID}.r2.dev`;
    const fileUrl = `${fileOrigin}/${fileKey}`;

    try {
        const command = new PutObjectCommand({
            Bucket: 'meleti', //TODO: Change to 'videos'
            Key: fileKey,
            ContentType: fileType
        });

        const presignedUrl = await getSignedUrl(s3UploadClient, command, { expiresIn: 3600 });

        res.setHeader(
            "Access-Control-Allow-Origin",
            "http://localhost:5173"
        );
        res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST");
        res.setHeader("Access-Control-Allow-Headers", "*");

        res.json({
            success: true,
            url: presignedUrl,
            fileName,
            fileUrl,
            fileKey,
            message: 'Pre-signed URL generated successfully'
        });
    } catch (error) {
        console.error('Error generating pre-signed URL', error);
        res.status(500).json({
            success: false,
            message: 'Error generating pre-signed URL'
        });
    }
});

module.exports = router;