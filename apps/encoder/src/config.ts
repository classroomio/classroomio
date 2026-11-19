/**
 * Everything the encoder is given. Deliberately small: a presigned source URL,
 * a job token scoped to one asset, and where to call back. No database URL, no
 * Redis URL, no storage credentials — ffmpeg runs on attacker-supplied media, so
 * this process is treated as the least trusted one we operate.
 */
export interface EncoderConfig {
  assetId: string;
  jobToken: string;
  sourceUrl: string;
  apiUrl: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function readConfig(): EncoderConfig {
  return {
    assetId: required('CIO_ASSET_ID'),
    jobToken: required('CIO_JOB_TOKEN'),
    sourceUrl: required('CIO_SOURCE_URL'),
    apiUrl: required('CIO_API_URL').replace(/\/+$/, '')
  };
}
