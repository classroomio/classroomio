import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import FormData from 'form-data';
import axios from 'axios';
import { fail } from '@sveltejs/kit';
import genUniqueId from '$lib/utils/functions/genUniqueId.js';
import { getSupabase } from '$lib/utils/functions/supabase';

import {
  CLOUDFLARE_ACCESS_KEY,
  CLOUDFLARE_SECRET_ACCESS_KEY,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_PUBLIC_ACCOUNT_ID,
  MUSE_API_KEY
} from '$env/static/private';

// Set the runtime to edge for best performance
export const config = {
  runtime: 'edge'
};

const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY
  }
});

const supabase = getSupabase();

const uploadToMuse = (s3Data, fileName, lessonId, fileUrl) => {
  const form = new FormData();
  form.append('file', s3Data, fileName);

  axios({
    method: 'POST',
    url: 'https://api.muse.ai/api/files/upload',
    data: form,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {
      Key: MUSE_API_KEY
    }
  })
    .then(async function (response) {
      console.log('Upload to muse complete', response.data);

      const { data: lesson } = await supabase
        .from('lesson')
        .select(`*`)
        .eq('id', lessonId)
        .single();

      if (lesson) {
        // Add Muse response to metadata
        const videos = lesson.videos.map((v) => {
          if (v.link === fileUrl) {
            console.log('matches');
            v.metadata = JSON.parse(JSON.stringify(response.data));
          }
          return v;
        });

        const { error, data } = await supabase
          .from('lesson')
          .update({ videos })
          .eq('id', lessonId)
          .select();
        if (error) {
          console.log('Error updating lesson', error);
        }
        console.log('update data', data);
      }
    })
    .catch(function (error) {
      console.log('Upload to Muse failed', error);
    });
};

export const load = ({ params = { id: '' } }) => {
  const { id: courseId, lessonParams = [] } = params;
  const splitparams = lessonParams.split('/');
  const [lessonId, exerciseRouteName, exerciseId] = splitparams;

  return {
    courseId,
    lessonId,
    exerciseRouteName,
    exerciseId,
    isMaterialsTabActive: !exerciseRouteName
  };
};

export const actions = {
  create: async ({ request }) => {
    const formData = Object.fromEntries(await request.formData());
    console.log('formData', formData);

    if (!formData.file?.name || formData.file?.name === 'undefined') {
      return fail(400, {
        success: false,
        message: 'You must provide a file to upload'
      });
    }

    if (formData.file?.size > 20 * 1024 * 1024) {
      return fail(400, {
        success: false,
        type: 'FILE_TOO_LARGE',
        message: 'File is too large'
      });
    }

    const { file, lessonId } = formData;
    console.log('file', file);
    console.log('lessonId', lessonId);

    const stream = await file.arrayBuffer();
    const fileName = `${genUniqueId()}-${file.name}`;
    const params = {
      Bucket: 'videos',
      Key: fileName,
      Body: stream,
      ContentLength: stream.length
    };
    console.log('params', params);

    let upload;

    const fileUrl = `https://pub-${CLOUDFLARE_PUBLIC_ACCOUNT_ID}.r2.dev/${fileName}`;

    try {
      upload = await S3.send(new PutObjectCommand(params));
      // process data.
    } catch (error) {
      // error handling.
      const { requestId, cfId, extendedRequestId } = error.$$metadata;
      console.error('Error uploading file');
      console.log({ requestId, cfId, extendedRequestId });
    } finally {
      // finally.
      console.log('File upload complete', upload);

      console.log('\n\nInitilizing Muse Request');

      const data = await S3.send(
        new GetObjectCommand({
          Bucket: 'videos',
          Key: fileName
        })
      );
      // console.log('GetObjectCommand', data);
      uploadToMuse(data.Body, file.name, lessonId, fileUrl);
    }

    return {
      success: true,
      url: fileUrl,
      message: 'Uploaded successfully'
    };
  }
};
