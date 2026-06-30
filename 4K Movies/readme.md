# 4K Movies

This library preserves UHD video quality while standardizing audio for consistent home theater playback.

Unlike the HD Movie and TV libraries, 4K content is intentionally left as close to the original source as possible. Quality selection is performed upstream by Radarr using custom formats and quality profiles. Tdarr only normalizes audio before passing the file through the shared processing pipeline.

## Processing Flow

![4K Movie Flow](4k_flow.png)

---

# Video Standard

No video transcoding is performed.

The library relies on Radarr to acquire compliant UHD releases.

Video quality is preserved exactly as downloaded.

---

# Audio Standard

Only a single surround track is retained.

## Preferred Format

- EAC3 5.1

## Accepted Format

- AC3 5.1

## Audio Rules

- Keep only one surround track.
- Prefer the highest quality surround track.
- Prioritize channel count before codec quality.
- Prefer EAC3 over AC3.
- Convert unsupported surround codecs to EAC3 5.1.
- Normalize all surround audio to 5.1.
- Remove all additional audio tracks.
- Do not create a stereo fallback.

---

# Expected Output

## Video

- Original UHD video preserved
- Original resolution preserved
- Original container preserved until shared MP4 mux processing

## Audio

- Single EAC3 5.1 surround track (preferred)
- Single AC3 5.1 surround track (accepted when already compliant)

---

# Shared Processing

Following 4K-specific audio processing, the shared media pipeline performs:

- File Rename
- Subtitle Extraction
- MP4 Mux
- File Validation
- Replace Original File
- Radarr UHD Notification
