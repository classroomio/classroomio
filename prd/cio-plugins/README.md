# CIO Plugins

Product area for a ClassroomIO plugin/extension system — a way for third parties (and the core
team) to extend the platform without modifying core code.

## Folder structure

| Path | Purpose |
| --- | --- |
| [`research/`](./research/) | Background research and design exploration **before** committing to an implementation approach. Not a PRD — no acceptance criteria, phases, or build plans. |

When an approach is chosen, implementation PRDs and specs will live alongside or under this
folder (for example `prd/cio-plugins/` sibling docs), separate from `research/`.

## Starting point

Read [`research/README.md`](./research/README.md) for the index and one-line takeaway: the hard
parts of a plugin system likely already exist in the codebase (`@cio/question-types`,
`apps/embeds`, webhooks + REST API) and need naming and generalization behind a single manifest
and SDK.
