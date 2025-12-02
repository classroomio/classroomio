# @cio/storybook

Storybook for ClassroomIO UI components.

## Development

To start the Storybook development server:

```bash
pnpm dev
```

## Build

To build the Storybook:

```bash
pnpm build
```

## Build Storybook

To build the Storybook (alternative command):

```bash
pnpm build-storybook
```

## Upload

To upload the built Storybook to Cloudflare R2:

```bash
pnpm upload:storybook
```

**Note:** This requires the build to be completed first. Make sure you have the following environment variables set:

- `CLOUDFLARE_ACCESS_KEY`
- `CLOUDFLARE_SECRET_ACCESS_KEY`
- `CLOUDFLARE_ACCOUNT_ID`

## Publish

To build and upload the Storybook in one command:

```bash
pnpm publish:storybook
```

This will build the Storybook and then upload it to R2.
