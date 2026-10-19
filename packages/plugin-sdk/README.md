# @classroomio/plugin-sdk

The ClassroomIO plugin SDK includes the runtime bridge and the `cio-plugin` CLI.

## CLI

| Command | Purpose |
| --- | --- |
| `cio-plugin create <directory>` | Scaffold a starter plugin. |
| `cio-plugin build [path] [--all]` | Validate, compile, and package deterministic artifacts. |
| `cio-plugin dev [path] --org <organization-id>` | Build and install a local development release into one organization. |
| `cio-plugin publish [path]` | Build, upload to quarantine, and submit for review. |
| `cio-plugin status <submission-id>` | Read a submission's review status. |

`create` accepts `--id`, `--name`, `--publisher`, and `--slug`. `build` accepts `--all`. `dev` accepts `--host`, `--token`, and `--org`. `publish` accepts `--host` and `--token`. `status` accepts `--host` and `--token`.

## Local UI development and ClassroomIO installation

```bash
## Serve the UI directly from Vite
npm run dev
```

Use the CLI separately to package and install a development release in one organization:

```bash
export CLASSROOMIO_API_URL=http://localhost:3002
export CLASSROOMIO_PLUGIN_TOKEN=<publisher-token>
export CLASSROOMIO_ORG_ID=<organization-id>
npm run seed -- --org "$CLASSROOMIO_ORG_ID"
```

`npm run dev` is the normal Vite server. `npm run seed` is the ClassroomIO installation
operation; it is unavailable in production and installs only in the chosen organization.

Use `npm run build` for the normal UI build and `npm run pack` to create the immutable plugin
archive.

## Publisher credentials

The current publishing flow requires a ClassroomIO account and access to an organization. An
organization administrator creates an API key with the narrow `plugin:publish` scope and gives the
secret to the developer securely. Set that secret as `CLASSROOMIO_PLUGIN_TOKEN`.

The key's organization owns the credential; it is not the installation target for a public
marketplace plugin. `CLASSROOMIO_ORG_ID` is required only by `dev`, where it explicitly selects the
single organization that receives the local installation. Do not use `PRIVATE_SERVER_KEY` or a
`public_api:*` key for plugin publishing.

## Publishing

```bash
export CLASSROOMIO_API_URL=https://api.classroomio.com
export CLASSROOMIO_PLUGIN_TOKEN=<publisher-token>
npx cio-plugin publish
```

The CLI uploads its content-addressed archive directly to the quarantine bucket and asks the API to validate it. A reviewer approves or rejects the submission. Approval copies verified assets to the production bucket; the production CDN serves only the approved digest.

## Environment variables

| Variable | Scope | Meaning |
| --- | --- | --- |
| `CLASSROOMIO_API_URL` | CLI | API origin. Defaults to `http://localhost:3002`. |
| `CLASSROOMIO_PLUGIN_TOKEN` | CLI | Scoped publisher token for `dev`, `publish`, and `status`. |
| `CLASSROOMIO_ORG_ID` | CLI | Target organization for `dev`; `--org` overrides it. |
| `PLUGIN_ARTIFACTS_PATH` | API host, local only | Local development artifact root. |
| `PLUGIN_API_TOKEN_SECRET` | API host, production | Independent secret used for plugin backend access tokens; never expose it to plugin code or CLI users. |
| `PLUGIN_QUARANTINE_BUCKET` | API host | Private object-storage bucket for submitted archives. |
| `PLUGIN_REVIEW_ORIGIN` | API host | Reviewer-only CDN origin for quarantined artifacts. |
| `PLUGIN_ASSET_BUCKET` | API host, production | Production object-storage bucket for approved artifacts. |
| `PLUGIN_ASSET_ORIGIN` | API host, production | Production CDN origin for approved artifacts. |

The plugin backend SDK also uses `CLASSROOMIO_ACCESS_TOKEN`, `CLASSROOMIO_CLIENT_ID`, and `CLASSROOMIO_CLIENT_SECRET` for host API access.

The reviewer queue and approval actions are platform-admin operations. The API exposes reviewer
endpoints and a preview URL; the dashboard reviewer screen and authenticated review CDN are host
deployment surfaces.
