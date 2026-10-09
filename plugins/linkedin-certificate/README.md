# LinkedIn Certificate Share Plugin

This plugin enables learners to share earned certificates directly to their LinkedIn profile certifications with a single click.

## UI Model: Host-Rendered Declarative Action

This plugin uses **Model 1: Host-rendered declarative UI**:
- It declares a native action contribution targeting `certificate.actions` with `renderMode: "host"`.
- It does **not** package or execute any iframe or HTML document.
- ClassroomIO renders the action natively alongside the standard certificate download buttons, ensuring 100% design fidelity, native accessibility, and zero iframe performance overhead.

### Manifest Excerpt

```json
{
  "permissions": {
    "required": ["certificates.issued:read"]
  },
  "contributes": {
    "actions": [
      {
        "id": "linkedin.share-certificate",
        "target": "certificate.actions",
        "renderMode": "host",
        "label": "Add to LinkedIn",
        "icon": "linkedin",
        "actionType": "openUrl",
        "urlTemplate": "https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name={courseTitle}&organizationName={orgName}&certUrl={certUrl}"
      }
    ]
  }
}
```
