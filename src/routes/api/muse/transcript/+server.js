import { json } from '@sveltejs/kit';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

import {
  CLOUDFLARE_ACCESS_KEY,
  CLOUDFLARE_SECRET_ACCESS_KEY,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_PUBLIC_ACCOUNT_ID,
  MUSE_API_KEY
} from '$env/static/private';

const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY
  }
});

const downloadTranscript = async () => {};

const uploadTranscriptToS3 = async () => {};

export async function GET({ url }) {
  const museFid = url.searchParams.get('museFid');

  console.log('museFid');

  // check the transcript table and see if we find a record
  // if we find one
  // check if downloaded = true
  // if true
  // return the transcript
  // if false
  // download the transcript from muse
  // upload it to S3
  // return the transcript
  // if we dont

  return json({ success: true, museFid });
}
