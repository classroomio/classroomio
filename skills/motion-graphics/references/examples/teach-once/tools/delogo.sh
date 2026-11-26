#!/bin/zsh
# Logo-free master: paints the shirt print off cut/graded.mov (tools/delogo.py), then appends the outro.
# Needs look/delogo-reference.png (graded frame 38), look/person-mattes/ and look/pose.jsonl.
set -e
HERE=${0:A:h}
ROOT=${HERE:h}
PY=$HOME/.cache/cio-video/venv/bin/python
TAGS=(-color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv)
ffmpeg -v error -i $ROOT/cut/graded.mov -vf "scale=in_color_matrix=bt709:in_range=tv,format=rgb48le" -f rawvideo -pix_fmt rgb48le - |
  $PY $HERE/delogo.py $ROOT/look/delogo-reference.png $ROOT/look/person-mattes $ROOT/look/pose.jsonl ${DELOGO_DEBUG:+--debug} $DELOGO_DEBUG |
  ffmpeg -v error -y -f rawvideo -pix_fmt rgb48le -s 1920x1080 -r 30 -i - \
    -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv422p10le" -c:v prores_ks -profile:v 3 $TAGS $ROOT/cut/graded-delogo.mov
printf "file '%s'\nfile '%s'\n" $ROOT/cut/graded-delogo.mov $ROOT/outro/outro-sdr.mov > $ROOT/cut/list-sdr-delogo.txt
ffmpeg -v error -y -f concat -safe 0 -i $ROOT/cut/list-sdr-delogo.txt -c copy $ROOT/cut/master-sdr-delogo.mov
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $ROOT/cut/master-sdr-delogo.mov
