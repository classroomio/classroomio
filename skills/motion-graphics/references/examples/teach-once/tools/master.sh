#!/bin/zsh
# Graded SDR master: HLG cut → cine LUT → punch-ins/push → vignette (reframe.py), light denoise, sharpen, grain → ProRes 422 HQ BT.709, then the outro.
set -e
HERE=${0:A:h}
ROOT=${HERE:h}
PY=$HOME/.cache/cio-video/venv/bin/python
TAGS=(-color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv)
FINISH="hqdn3d=1.2:1.2:2.5:2.5,cas=strength=0.45,noise=c0s=5:c0f=t"
ffmpeg -v error -i $ROOT/cut/cut.mov -vf "scale=in_color_matrix=bt2020:in_range=tv,format=rgb48le,lut3d=file=$ROOT/look/cine.cube:interp=tetrahedral" -f rawvideo -pix_fmt rgb48le - |
  $PY $HERE/reframe.py |
  ffmpeg -v error -y -f rawvideo -pix_fmt rgb48le -s 1920x1080 -r 30 -i - \
    -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv444p10le,$FINISH,format=yuv422p10le" \
    -c:v prores_ks -profile:v 3 $TAGS $ROOT/cut/graded.mov
ffmpeg -v error -y -framerate 30 -start_number 1 -i $ROOT/outro/frames/o_%05d.png -frames:v 150 \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv422p10le" -c:v prores_ks -profile:v 3 $TAGS $ROOT/outro/outro-sdr.mov
printf "file '%s'\nfile '%s'\n" $ROOT/cut/graded.mov $ROOT/outro/outro-sdr.mov > $ROOT/cut/list-sdr.txt
ffmpeg -v error -y -f concat -safe 0 -i $ROOT/cut/list-sdr.txt -c copy $ROOT/cut/master-sdr.mov
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $ROOT/cut/master-sdr.mov
