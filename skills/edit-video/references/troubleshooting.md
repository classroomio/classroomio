# Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Error submitting audio frame… Input contains NaN` | Denoising audio that already has digital-silence fades at the cuts | Denoise first (`prepare.write_trimmed` does) |
| A render stalls or eats memory | `split` plus `trim` branches buffer every frame | Use `select`/`aselect` on the timeline (already done) |
| `BrokenProcessPool … has no attribute` | Worker functions defined in `__main__` can't be loaded by spawned processes | Keep worker entry points in a module (`compose.render_by_id`) |
| A wait loop never ends | `pgrep -f name` matches its own shell command | Use the shell's `wait`, or check for the output files |
| No `drawtext` or `subtitles` filter | An ffmpeg build without libass or freetype | The compositor draws text with Pillow; nothing needs those filters |
| Screenshot is a "Press & Hold" page or blank | A bot wall, or a page that never settles | `--no-js`, another outlet, or ask the user |
| An explainer item never appears | Its `at` phrase comes after the visual ends (`plan` warns) | Move the trigger later, use `until`, or split the visual in two |
| Captions cover a visual | Content in the bottom 220 px of a 16:9 full panel | Full panels already reserve that space; shorten long lists or use `split` |
| Text overflows a block | One word wider than the block | Flow and blocks shrink to fit; shorten the title |
| Logo is wrong or blurry | It was lifted from old footage | Use `brand.logo()` (built from the SVG) |
| The hook doesn't match | The hook text must match the cleaned transcript | Copy it from `plan --transcript` |
| Punch-in ignores cut points | Cut and candidate times compared at different precision | `zoom_windows` rounds both; keep it that way |
