#!/bin/zsh
# Caption-band master: graded master + behind graphics, then the frosted band over the shirt print (tools/band.py).
# Render the finals from it with: MASTER=cut/master-sdr-band.mov BEHIND=none FRONT=motion-band tools/final-sdr.sh …
set -e
HERE=${0:A:h}
ROOT=${HERE:h}
PY=$HOME/.cache/cio-video/venv/bin/python
TAGS=(-color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv)
ffmpeg -v error -i $ROOT/cut/master-sdr.mov -framerate 30 -start_number 0 -i $ROOT/motion/renders/frames-1080p/f_%05d.png \
  -filter_complex "[0:v]scale=in_color_matrix=bt709:in_range=tv,format=gbrp16le[base];[1:v]format=gbrap16le[behind];[base][behind]overlay=format=gbrp:shortest=1,format=rgb48le" \
  -f rawvideo -pix_fmt rgb48le - |
  $PY $HERE/band.py |
  ffmpeg -v error -y -f rawvideo -pix_fmt rgb48le -s 1920x1080 -r 30 -i - \
    -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv422p10le" -c:v prores_ks -profile:v 3 $TAGS $ROOT/cut/master-sdr-band.mov
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $ROOT/cut/master-sdr-band.mov
