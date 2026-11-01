import type { ApiClient } from '@/feature/common/api/api-client';
import { request } from '@/feature/common/api/request';

export type LocalImage = { uri: string; name: string; mimeType: string };

/** Uploads an image through the media route the web editor uses and returns its public URL. */
export async function uploadImage(api: ApiClient, image: LocalImage) {
  // React Native's FormData sends `{ uri, name, type }` parts as file uploads; the Hono client types expect a web File.
  const file = { uri: image.uri, name: image.name, type: image.mimeType } as unknown as File;
  const response = await request(api.media.image.$post({ form: { file } }));

  return response.url;
}
