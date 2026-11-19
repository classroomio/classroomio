Drag-and-drop / click-to-select file upload trigger. Ports `custom/file-drop-zone` (Root + Trigger merged): 192px dashed box, 56px dashed icon circle, label plus size/count hint, 50% opacity when disabled or at `maxFiles`. Validates size, count and `accept`, reporting rejects through `onFileRejected`.
```jsx
<FileDropZone maxFiles={3} maxFileSize={5 * MEGABYTE} accept={ACCEPT_IMAGE} onUpload={async (files) => {}} />
```
