#!/bin/zsh
# Background music bed from the original score (tools/music.py → music/music-original.wav, -15 LUFS):
# ~17 dB under the voice while she speaks, up on the end screen. The score fades itself out.
# Usage: music.sh [underDb] [outroDb]
set -e
ROOT=${0:A:h:h}
UNDER=${1:--23}
OUTRO=${2:--11}
GAIN="if(lt(t,28.05),$UNDER,if(lt(t,28.65),$UNDER+($OUTRO-($UNDER))*(t-28.05)/0.6,$OUTRO))"
ffmpeg -v error -y -i $ROOT/music/music-original.wav \
  -af "atrim=0:33.267,asetpts=PTS-STARTPTS,aresample=48000,volume='pow(10,($GAIN)/20)':eval=frame,afade=t=in:d=0.3" \
  -c:a pcm_s24le $ROOT/music/music-bed.wav
