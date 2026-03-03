# License Verification API Contract

This document describes the expected contract for the external license verification API. Build this API outside of this repository; ClassroomIO will call it to verify license keys and determine which features are enabled.

## Configuration

Set these environment variables on the API server:

- `LICENSE_KEY` - Your license key (sent to the verification API)
- `LICENSE_VERIFICATION_URL` - Base URL of your license verification API (e.g. `https://license.example.com/verify`)

## Request

ClassroomIO sends a **POST** request to `LICENSE_VERIFICATION_URL` with:

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {LICENSE_KEY}`

**Body:**
```json
{
  "licenseKey": "{LICENSE_KEY}"
}
```

## Response

Your API should return a JSON object:

```json
{
  "valid": true,
  "features": ["sso", "token-auth", "no-tracking"],
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `valid` | boolean | Yes | Whether the license is valid |
| `features` | string[] | No | List of enabled feature IDs. Omit or empty = no features |
| `expiresAt` | string (ISO 8601) | No | When the license expires |

## Feature IDs

| ID | Description |
|----|-------------|
| `sso` | SSO (OIDC/SAML) - organization single sign-on setup |
| `token-auth` | Token-based authentication (API keys for programmatic access) |
| `no-tracking` | Disable PostHog, Senja, and other analytics/marketing tools |
| `custom-domain` | Custom domain support |
| `custom-branding` | Custom branding |

Add new feature IDs in `packages/utils/src/license/constants.ts` to gate additional enterprise features.

## Caching

ClassroomIO caches the license response for **1 hour**. After expiry, the next request will trigger a fresh verification call.

## Error Handling

- If your API returns non-2xx, ClassroomIO treats the license as invalid (`valid: false`, `features: []`)
- If the request fails (network error, timeout), same behavior
- ClassroomIO never blocks startup if the license API is unreachable
