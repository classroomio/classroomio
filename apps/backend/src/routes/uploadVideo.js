const express = require('express');
const FormData = require('form-data');
const axios = require('axios');

const socketIo = require('socket.io');
const { promisify } = require('util');
const fs = require('fs');
const unlinkAsync = promisify(fs.unlink);

const { Upload } = require('@aws-sdk/lib-storage');
const {
  S3Client,
  PutObjectCommand
  // GetObjectCommand,
} = require('@aws-sdk/client-s3');

// const { getSupabase } = require('../utils/supabase');
const genUniqueId = require('../utils/genUniqueId');
const upload = require('../utils/upload');

const io = socketIo({
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');
});

let uploadProgress = 0;

const {
  CLOUDFLARE_ACCESS_KEY,
  CLOUDFLARE_SECRET_ACCESS_KEY,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_PUBLIC_ACCOUNT_ID,
  MUSE_API_KEY
} = process.env;

const router = express.Router();

const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY
  }
});

// const supabase = getSupabase();

// const museUploadQueue = new Queue('video', process.env.REDIS_API_KEY, {
//   redis: { tls: { rejectUnauthorized: false } },
// });

router.post('/', upload.single('videoFile'), async (req, res) => {
  // Set timeout for this request to 15 minutes
  req.setTimeout(900000);

  const {
    file,
    query: { lessonId }
  } = req;
  console.log('lessonId', lessonId);
  console.log('file', file);

  if (!file?.fieldname || !file?.fieldname) {
    return res.status(400).json({
      success: false,
      message: 'You must provide a file to upload'
    });
  }

  // File upload limit is 500MB
  const fileSizeInMegabytes = file?.size / (1024 * 1024);

  if (fileSizeInMegabytes > 500) {
    return res.status(400).json({
      success: false,
      type: 'FILE_TOO_LARGE',
      message: 'File is too large'
    });
  }
  const fileData = fs.readFileSync(file.path);

  const fileName = `${genUniqueId()}-${file.originalname.split(' ').join('-')}`;

  const fileUrl = `https://pub-${CLOUDFLARE_PUBLIC_ACCOUNT_ID}.r2.dev/${fileName}`;
  let metadata = {
    sizeInMb: fileSizeInMegabytes
  };

  try {
    console.log('Upload starting');

    console.time('upload');
    const parallelUploads3 = new Upload({
      client: S3,
      queueSize: 5,
      partSize: 1024 * 1024 * 20,
      leavePartsOnError: false, // optional manually handle dropped parts
      params: {
        Bucket: 'videos',
        Key: fileName,
        Body: fileData
      }
    });

    parallelUploads3.on('httpUploadProgress', (progress) => {
      const Uploadprogress = Math.round((progress.loaded / progress.total) * 100);
      // Emit progress to connected sockets
      uploadProgress = progress;
      io.emit('uploadProgress', Uploadprogress);

      console.log('progress', uploadProgress);
    });

    await parallelUploads3.done();

    console.log('Upload to done');
    console.timeEnd('upload');

    unlinkAsync(file.path);

    res.json({
      success: true,
      url: fileUrl,
      metadata,
      message: 'Uploaded successfully'
    });
  } catch (error) {
    // error handling.
    const { requestId, cfId, extendedRequestId } = error.$$metadata || {};

    console.error('Upload failed', error);
    console.log({ requestId, cfId, extendedRequestId });

    res.json({
      success: false,
      message: 'Uploaded failed: ' + error
    });
  } finally {
    // finally.
    console.log('Upload complete');

    // console.log('Add muse queue');
    // museUploadQueue.add({
    //   fileName,
    //   originalFileName: file.originalname,
    //   lessonId,
    //   fileUrl,
    //   unlinkPath: file.path,
    // });
  }
});

router.get('/', (req, res) => {
  res.send('Get upload video');
});

async function uploadToMuseNow(fileData, fileName) {
  try {
    // Add file data to form
    const form = new FormData();
    form.append('file', fileData, fileName);

    // Send to muse through axios - fetch is a pain in the ass
    const response = await axios({
      method: 'POST',
      url: 'https://api.muse.ai/api/files/upload',
      data: form,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        Key: MUSE_API_KEY
      }
    });

    return {
      metadata: response.data
    };
  } catch (error) {
    console.log('Upload to Muse failed', error?.response?.data);
    return {};
  }
}

// /**
//  * Uploads video to muse.ai and store response in DB
//  *
//  * @param {Blod} s3Data AWS s3 data
//  * @param {string} fileName Name of the file
//  * @param {string} lessonId Associated lesson this video was uploaded to
//  * @param {string} fileUrl URL to the video in s3
//  * @param {string} unlinkPath Path to mutler file to delete
//  */
// async function uploadToMuse(s3Key, fileName, lessonId, fileUrl, unlinkPath) {
//   try {
//     await unlinkAsync(unlinkPath);

//     const s3Data = await S3.send(
//       new GetObjectCommand({
//         Bucket: 'videos',
//         Key: s3Key,
//       })
//     );
//     // Add file data to form
//     const form = new FormData();
//     form.append('file', s3Data.Body, fileName);

//     // Send to muse through axios - fetch is a pain in the ass
//     const response = await axios({
//       method: 'POST',
//       url: 'https://api.muse.ai/api/files/upload',
//       data: form,
//       maxContentLength: Infinity,
//       maxBodyLength: Infinity,
//       headers: {
//         Key: MUSE_API_KEY,
//       },
//     });

//     console.log('Upload to muse complete', response.data);
//     const { data: lesson } = await supabase
//       .from('lesson')
//       .select(`*`)
//       .eq('id', lessonId)
//       .single();

//     if (lesson) {
//       console.log('Found lesson');
//       // Add Muse response to metadata
//       const videos = lesson.videos.map((v) => {
//         if (v.link === fileUrl) {
//           console.log('matches');
//           v.metadata = JSON.parse(JSON.stringify(response.data));
//         }
//         return v;
//       });

//       // Save uploaded data to DB
//       const { error } = await supabase
//         .from('lesson')
//         .update({ videos })
//         .eq('id', lessonId)
//         .select();
//       if (error) {
//         console.log('Error updating lesson', error);
//       } else {
//         console.log('Update DB complete');
//       }
//     }
//   } catch (error) {
//     console.log('Upload to Muse failed', error?.response?.data);
//   }
// }

// // Queue to Upload to muse.ai
// museUploadQueue.process(async function (job, done) {
//   console.log('Initilizing Muse Request\n\n', job.data);
//   const { fileName, originalFileName, lessonId, fileUrl, unlinkPath } =
//     job.data;

//   await uploadToMuse(fileName, originalFileName, lessonId, fileUrl, unlinkPath);

//   done();
// });

// museUploadQueue.on('completed', function (job) {
//   // Job completed with output result!
//   console.log('Completed all jobs in uploading to muse', job.data);
// });

// museUploadQueue.on('error', function (error) {
//   // Job completed with output result!
//   console.log('error on queue', error);
// });

module.exports = {
  router,
  io // Export Socket.IO instance for use in the main server file
};
