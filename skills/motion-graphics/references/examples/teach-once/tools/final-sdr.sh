#!/bin/zsh
# Graded SDR master + behind graphics + front captions, H.264 BT.709 for every platform.
# The voice track is cut/voice-clean.wav (noise removed on request), copied into both channels; effects are mixed at unity under it.
# Music: music/music-bed.wav from tools/music.sh, in both outputs.
# The film starts at her first word: the cut's first 1.3 s (39 frames, an off-camera voice) are dropped.
# Usage: final-sdr.sh <out-with-sfx.mp4> <out-no-sfx.mp4>
# Versions (env): MASTER=<mov> picks the picture (default cut/master-sdr.mov; cut/master-sdr-delogo.mov has the shirt print painted out).
# FRONT=<project> picks the caption layer (default motion-front). BEHIND=none skips the behind layer when MASTER already has it (tools/band.sh).
set -e
HERE=${0:A:h}
ROOT=${HERE:h}
OUT_SFX=$1
OUT_DRY=$2
START=39
MASTER=${MASTER:-$ROOT/cut/master-sdr.mov}
FRONT=${FRONT:-$ROOT/motion-front}
BEHIND=${BEHIND:-$ROOT/motion}
if [[ $BEHIND == none ]]; then
  BEHIND_INPUT=(-f lavfi -i color=c=black@0:s=1920x1080:r=30,format=rgba)
else
  BEHIND_INPUT=(-framerate 30 -start_number $START -i $BEHIND/renders/frames-1080p/f_%05d.png)
fi
INPUTS=(-i $MASTER $BEHIND_INPUT -framerate 30 -start_number $START -i $FRONT/renders/frames-1080p/f_%05d.png -i $ROOT/cut/voice-clean.wav -i $ROOT/music/music-bed.wav)
VIDEO="[0:v]trim=start_frame=$START,setpts=PTS-STARTPTS,scale=in_color_matrix=bt709:in_range=tv,format=gbrp10le[base];[1:v]format=gbrap[behind];[2:v]format=gbrap[front];[base][behind]overlay=format=gbrp:shortest=1[mid];[mid][front]overlay=format=gbrp:shortest=1,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv[v]"
ENCODE=(-c:v libx264 -preset slow -crf 18 -profile:v high -tune film -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv -movflags +faststart -c:a aac -b:a 320k)
ffmpeg -v error -stats -y $INPUTS -i $ROOT/motion/renders/sfx-stem.wav \
  -filter_complex "$VIDEO;[3:a]pan=stereo|c0=c0|c1=c0[voice];[5:a]atrim=start=1.3,asetpts=PTS-STARTPTS[fx];[voice][4:a][fx]amix=inputs=3:normalize=0:duration=first[a]" \
  -map "[v]" -map "[a]" $ENCODE $OUT_SFX
ffmpeg -v error -stats -y $INPUTS -filter_complex "$VIDEO;[3:a]pan=stereo|c0=c0|c1=c0[voice];[voice][4:a]amix=inputs=2:normalize=0:duration=first[a]" -map "[v]" -map "[a]" $ENCODE $OUT_DRY
