# Rebuilding a source from a recorder's raw tracks

Use this when the recorder's export hides the screen: zoom segments, a floating or enlarged camera, or a mobile export
whose screen is only 608 px wide. The 16 Nov 2026 changelog recording needed it: its analytics section was exported in
Cap's "floating" scene, so the screen was cropped to the middle and the camera filled a third of the frame.

## Cap

A Cap project (`~/Library/Application Support/so.cap.desktop/recordings/<name>.cap`) keeps:

- `content/segments/segment-N/display.mp4`: the full screen (or recorded area) with no zoom or layout.
- `content/segments/segment-N/camera.mp4`: the camera.
- `recording-meta.json`: each track's `start_time` offset within its recording segment.
- `project-config.json`: `timeline.segments` (the cuts, in raw seconds, per `recordingSegment`), `sceneSegments` (floating
  camera, hidden camera, split layouts) and `zoomSegments`, all in export seconds.

The export's timeline is the `timeline.segments` laid end to end, so export time maps to raw time segment by segment.
Render each segment from the raw tracks with an exact frame count (`round(cumulative_end * fps) - round(cumulative_start
* fps)`, so 28 cuts don't drift), concatenate, then take the audio from Cap's export unchanged. That keeps the voice,
music beds and timing identical, so a transcript made from the export still lines up.

A working implementation is `~/Videos/marketing/404-game/project/clean_sources.py` (job extras, not part of this skill).
It writes a 16:9 version (whole screen on paper, camera in a small rounded square that overlaps nothing) and a
1080x1920 vertical (whole screen at full width, camera below) laid out for the job's `native-vertical` layout with
`portrait_source: true`, which reads it at full resolution instead of through a 608 px strip.

Turn off punch-ins (`framing.zoom: false`) on these 16:9 cuts: on a screen recording they crop toward the camera and hide
the demo.
