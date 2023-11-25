import { json } from '@sveltejs/kit';

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
