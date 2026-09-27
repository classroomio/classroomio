export const MEDIA_WRITE_RULE =
  'Requires an automation key with the `media:write` scope. API and Zapier keys hold `public_api:*`, which also covers it.';

export const UPLOAD_FLOW_NOTE =
  'Send the bytes to `uploadUrl` with a single unauthenticated PUT whose `Content-Type` matches the `mimeType` you declared, then reference the returned `assetId` when attaching the asset. The URL stops working at `expiresAt`.';
