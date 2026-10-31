#!/usr/bin/env bash
# QA אוטומטי לקליף: ffprobe, דף 6 פריימים, SSIM פריים ראשון/אחרון. שימוש: qa_clip.sh <file.mp4>
set -e
f="$1"; b="${f%.mp4}"; d=$(dirname "$f")
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
res=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "$f")
ffmpeg -v error -y -i "$f" -vf "select='isnan(prev_selected_t)+gte(t-prev_selected_t\,1.3)',scale=640:-1,tile=3x2:margin=4:padding=4" -frames:v 1 "${b}_sheet.png"
ffmpeg -v error -y -i "$f" -vf "select=eq(n\,0)" -frames:v 1 "$d/_first.png"
ffmpeg -v error -y -sseof -0.05 -i "$f" -frames:v 1 "$d/_last.png"
ssim=$(ffmpeg -v info -i "$d/_first.png" -i "$d/_last.png" -lavfi ssim -f null - 2>&1 | grep -o 'All:[0-9.]*' | cut -d: -f2)
rm -f "$d/_first.png" "$d/_last.png"
echo "$(basename "$b") | ${dur}s | ${res} | loop_ssim=${ssim}"
