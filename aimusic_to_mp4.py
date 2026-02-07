#!/usr/bin/env python3
"""Download audio from aimusicgen.ai share pages and wrap it in an MP4."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from html import unescape
from urllib.request import Request, urlopen


AUDIO_EXTENSIONS = (".mp3", ".m4a", ".wav", ".aac")


def fetch_text(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; AimAudioBot/1.0)"
        },
    )
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "ignore")


def extract_audio_url(html: str) -> str | None:
    matches = re.findall(r"https?://[^\"'\s]+", html)
    for candidate in matches:
        if candidate.lower().endswith(AUDIO_EXTENSIONS):
            return unescape(candidate)
    json_matches = re.findall(r"\{.*?\}", html)
    for blob in json_matches:
        try:
            data = json.loads(blob)
        except json.JSONDecodeError:
            continue
        for key in ("audio_url", "audioUrl", "audio"):  # common variants
            value = data.get(key)
            if isinstance(value, str) and value.lower().endswith(AUDIO_EXTENSIONS):
                return value
    return None


def download_file(url: str, destination: str) -> None:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; AimAudioBot/1.0)"
        },
    )
    with urlopen(request, timeout=60) as response, open(destination, "wb") as handle:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            handle.write(chunk)


def build_mp4(audio_path: str, output_path: str) -> None:
    command = [
        "ffmpeg",
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=black:s=1280x720:r=30",
        "-i",
        audio_path,
        "-c:v",
        "libx264",
        "-tune",
        "stillimage",
        "-c:a",
        "aac",
        "-shortest",
        output_path,
    ]
    subprocess.run(command, check=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download audio from aimusicgen.ai share pages and wrap it in MP4."
    )
    parser.add_argument(
        "share_url",
        nargs="?",
        help="Share URL from https://aimusicgen.ai/share/...",
    )
    parser.add_argument(
        "--audio-url",
        help="Optional direct audio URL (mp3/m4a/wav/aac).",
    )
    parser.add_argument(
        "--output",
        default="aimusic.mp4",
        help="Output MP4 path (default: aimusic.mp4).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if not args.audio_url and not args.share_url:
        try:
            args.share_url = input(
                "Paste the aimusic share URL (or leave blank to use --audio-url): "
            ).strip()
        except EOFError:
            args.share_url = ""

        if not args.share_url:
            print("Provide a share URL or --audio-url.", file=sys.stderr)
            return 2

    audio_url = args.audio_url
    if not audio_url:
        try:
            html = fetch_text(args.share_url)
        except Exception as exc:  # noqa: BLE001
            print(f"Failed to fetch share page: {exc}", file=sys.stderr)
            return 1
        audio_url = extract_audio_url(html)
        if not audio_url:
            print(
                "Could not find audio URL in share page."
                " Try --audio-url with a direct link.",
                file=sys.stderr,
            )
            return 1

    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = os.path.join(tmpdir, "audio")
        try:
            download_file(audio_url, audio_path)
        except Exception as exc:  # noqa: BLE001
            print(f"Failed to download audio: {exc}", file=sys.stderr)
            return 1

        try:
            build_mp4(audio_path, args.output)
        except FileNotFoundError:
            print("ffmpeg not found. Please install ffmpeg.", file=sys.stderr)
            return 1
        except subprocess.CalledProcessError as exc:
            print(f"ffmpeg failed: {exc}", file=sys.stderr)
            return 1

    print(f"Saved MP4 to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
