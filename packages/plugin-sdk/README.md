# @classroomio/plugin-sdk

The ClassroomIO plugin SDK includes the runtime bridge and the `cio-plugin` CLI.

## CLI

| Command | Purpose |
| --- | --- |
| `cio-plugin create <directory>` | Scaffold a starter plugin. |
| `cio-plugin build [path] [--registry <path>]` | Validate, compile, and package deterministic artifacts. |
| `cio-plugin dev [path] --org <organization-id>` | Build and install a local development release into one organization. |

`create` accepts `--id`, `--name`, `--publisher`, and `--slug`. `build` accepts `--registry` to build plugins declared in a `registry/plugins.json` catalog. `dev` accepts `--host`, `--token`, and `--org`.

## Local UI development and ClassroomIO installation

```bash
## Serve the UI directly from Vite
npm run dev
```

Use the CLI separately to package and install a development release in one local organization:

```bash
export CLASSROOMIO_API_URL=http://localhost:3002
export CLASSROOMIO_DEV_TOKEN=<organization-api-key-with-plugin-development-scope>
export CLASSROOMIO_ORG_ID=<organization-id>
npm run seed -- --org "$CLASSROOMIO_ORG_ID"
```

`npm run dev` is the normal Vite server. `npm run seed` is the ClassroomIO local installation
operation; it is unavailable in production and installs only in the chosen development organization.

Use `npm run build` for the normal UI build and `npm run pack` to create the immutable plugin
archive.

## Contributing and releasing to production

ClassroomIO uses a PR-first, source-controlled release pipeline:

1. Build and test your plugin locally (`npm run build`, `npm run pack`, `npm run seed`).
2. Fork `classroomio-plugins` on GitHub.
3. Add your plugin source and register it in `registry/plugins.json`.
4. Open a pull request against `classroomio-plugins`.
5. Maintainers review the source code, permissions, network allowlists, and untrusted PR CI build artifacts.
6. Once merged to `main`, trusted GitHub Actions release CI compiles the deterministic artifact, uploads immutable files to R2, and registers the release with the ClassroomIO API via `POST /internal/plugin-releases`.

There is no developer-uploaded quarantine bucket, contributor-facing publish endpoint, or `plugin:publish` token.

## Environment variables

| Variable | Scope | Meaning |
| --- | --- | --- |
| `CLASSROOMIO_API_URL` | CLI | API origin. Defaults to `http://localhost:3002`. |
| `CLASSROOMIO_DEV_TOKEN` | CLI | Organization API key with `plugin:development`, used only by `dev`. |
| `CLASSROOMIO_ORG_ID` | CLI | Target organization for `dev`; `--org` overrides it. |
| `PLUGIN_ARTIFACTS_PATH` | API host, local only | Local development artifact root. |
| `PLUGIN_API_TOKEN_SECRET` | API host, production | Independent secret used for plugin backend access tokens; never expose it to plugin code or CLI users. |
| `PLUGIN_ASSET_BUCKET` | API host, production | Production object-storage bucket for approved artifacts. |
| `PLUGIN_ASSET_ORIGIN` | API host, production | Production CDN origin for approved artifacts. |
| `PLUGIN_RELEASE_DEPLOY_TOKEN` | API host & Release CI | Secret token for trusted CI release registration via `POST /internal/plugin-releases`. |

The plugin backend SDK also uses `CLASSROOMIO_ACCESS_TOKEN`, `CLASSROOMIO_CLIENT_ID`, and `CLASSROOMIO_CLIENT_SECRET` for host API access.
