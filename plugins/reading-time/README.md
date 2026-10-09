# Reading Time Estimator (`com.classroomio.reading-time`)

The reference plugin for the **ClassroomIO Plugin Platform (v2 Architecture)**.

## Architecture

This plugin follows the modern, contract-first architecture modeled after Figma, VS Code, and Chrome Extensions:

- **Isolated Runtime**: The plugin runs in a sandboxed iframe without direct access to ClassroomIO internal state, stores, or database.
- **Contract-First**: Declares capabilities, contribution targets, and requested permissions in `plugin.json`.
- **SDK Bridge**: Uses `@classroomio/plugin-sdk` to communicate over bidirectional `MessageChannel` RPC.
- **Tenant Isolation**: Settings and state persist in ClassroomIO installation-scoped storage without cross-tenant data leaks.

## Manifest Structure

```json
{
  "manifestVersion": 1,
  "id": "com.classroomio.reading-time",
  "name": "Reading Time Estimator",
  "version": "1.0.0",
  "permissions": {
    "required": ["lessons.metadata:read"],
    "optional": ["plugin.storage:read", "plugin.storage:write"]
  },
  "contributes": {
    "slots": [
      {
        "id": "reading-time-sidebar",
        "target": "lesson.after",
        "entrypoint": "sidebarWidget"
      }
    ],
    "pages": [
      {
        "id": "reading-time-settings",
        "entrypoint": "settings",
        "title": "Reading Time Settings"
      }
    ]
  }
}
```
