# Aimusic Share Audio to MP4

Utility script for downloading audio from an `aimusicgen.ai` share page and wrapping it in an MP4 container (black background video + audio).

## Usage

```bash
python aimusic_to_mp4.py https://aimusicgen.ai/share/<id> --output aimusic.mp4
```

If you omit arguments, the script will prompt for a share URL.

If the share page does not expose an audio URL in the HTML, pass a direct audio link:

```bash
python aimusic_to_mp4.py --audio-url "https://.../track.mp3" --output aimusic.mp4
```

## Notes

- Requires `ffmpeg` to be installed and available in `PATH`.
- The script uses only Python standard library modules.
