# Lesson Policy Acknowledgment Plugin

This plugin requires learners to explicitly acknowledge policies or compliance materials before or after completing a lesson.

## UI Model: Sandboxed Custom UI

This plugin uses **Model 2: Sandboxed custom UI**:
- It renders inside an isolated sandboxed iframe under `lesson.after`.
- **HTML is the compilation target, not the required authoring format**: developers can author the UI in Svelte, React, Vue, or Vanilla TypeScript. A build tool like Vite compiles the frontend into static assets (`dist/ui/ack.html`).
- The sandboxed webview communicates with ClassroomIO through `@classroomio/plugin-sdk` using an isolated `MessagePort` channel (`CIO_RPC_REQUEST` / `CIO_RPC_RESPONSE`) after a cryptographically nonced handshake (`CIO_BRIDGE_HANDSHAKE_INIT`).
- It persists acknowledgments via the platform hosted storage API (`storage:get` and `storage:set`) without direct access to core database tables or cookies.

### Manifest Excerpt

```json
{
  "runtime": {
    "ui": {
      "entrypoints": {
        "ackWidget": {
          "renderMode": "custom",
          "resource": "ui/ack.html"
        }
      }
    }
  },
  "permissions": {
    "required": ["plugin.storage:read", "plugin.storage:write"]
  },
  "contributes": {
    "slots": [
      {
        "id": "lesson-ack-slot",
        "target": "lesson.after",
        "renderMode": "custom",
        "entrypoint": "ackWidget"
      }
    ]
  }
}
```
