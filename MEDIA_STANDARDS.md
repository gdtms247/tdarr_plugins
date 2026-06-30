# Media Standards

This document defines the expected output of every media workflow.

If plugin behavior changes, this document should be updated before modifying any implementation.

The purpose of this document is to define **what the media library should look like**, not how Tdarr currently implements those standards.

---

# Global Standards

These standards apply to every media workflow.

## Container

- Final library container is MP4.
- MP4 FastStart is enabled.
- HEVC media receives the `hvc1` compatibility tag.

## Subtitle Strategy

- Extract the first compatible English text subtitle to an external `.en.srt` sidecar.
- Remove all embedded subtitle streams from the media container.
- If no compatible English text subtitle exists, no subtitle sidecar is created.
- Image-based subtitles (PGS, VobSub, etc.) are not preserved.

## Audio Languages

- Retain English (`ENG`) and Undefined (`UND`) audio streams.
- Remove all other audio languages.

## Metadata

- Remove embedded artwork.
- Remove attachment streams.
- Remove data streams.
- Remove chapter information during final MP4 mux.
- Preserve media metadata whenever possible.

## Media Validation

Every file must contain:

- At least one video stream.
- At least one audio stream.

Files failing validation intentionally fail processing to prevent corrupt media from entering the library.

---

# TV Optimized

## Purpose

Normalize television content for maximum storage efficiency and Direct Play compatibility.

## Video Standard

### Supported Codecs

- H.264
- HEVC

### Unsupported Codecs

Convert to:

- HEVC

### Processing Rules

- Resolution-aware bitrate optimization.
- Only oversized encodes are transcoded.
- Original resolution is preserved.

## Audio Standard

Output is standardized to:

- AAC 2.0

No surround audio is retained.

## Expected Output

| Category | Standard |
|----------|----------|
| Container | MP4 |
| Video | H.264 or HEVC |
| Audio | AAC 2.0 |

---

# TV Standard

## Purpose

Normalize television content while preserving playback quality.

## Video Standard

### Supported Codecs

- H.264
- HEVC

### Unsupported Codecs

Convert to:

- HEVC

### Processing Rules

- Higher bitrate thresholds than TV Optimized.
- Resolution-aware bitrate optimization.
- Original resolution is preserved.

## Audio Standard

### HD Content (720p+)

- AC3 5.1
- AAC 2.0

### SD Content (<720p)

- AAC 2.0

Surround audio is preserved whenever available while ensuring a stereo fallback.

## Expected Output

| Category | Standard |
|----------|----------|
| Container | MP4 |
| Video | H.264 or HEVC |
| Audio (HD) | AC3 5.1 + AAC 2.0 |
| Audio (SD) | AAC 2.0 |

---

# HD Movies

## Purpose

Preserve the cinematic experience while maximizing playback compatibility.

## Video Standard

### Preserve

- H.264
- HEVC

### Convert

Modern codecs:

- AV1
- VP9

Legacy codecs:

- MPEG2
- VC-1
- WMV
- Other unsupported legacy formats

Original resolution is always preserved.

## Audio Standard

Output is standardized to:

- AC3 5.1
- AAC 2.0 stereo fallback

Compatible audio is copied whenever possible.

## Expected Output

| Category | Standard |
|----------|----------|
| Container | MP4 |
| Video | H.264 or HEVC |
| Audio | AC3 5.1 + AAC 2.0 |

---

# 4K Movies

## Purpose

Preserve premium UHD video quality while standardizing surround audio.

## Video Standard

- Never transcoded.
- Original resolution preserved.
- HDR preserved.
- HDR10+ preserved.
- Dolby Vision preserved.

## Audio Standard

Output is standardized to a single surround track.

### Preferred

- EAC3 5.1

### Accepted

- AC3 5.1

### Processing Rules

- Keep one surround track.
- Normalize all surround audio to 5.1.
- Remove all additional audio tracks.
- Do not create a stereo fallback.

## Expected Output

| Category | Standard |
|----------|----------|
| Container | MP4 |
| Video | Original UHD Video |
| Audio | Single EAC3 5.1 (Preferred) / AC3 5.1 (Accepted) |

---

# Global Processing Pipeline

Every workflow performs the same final processing sequence.

1. Media Preparation
2. File Rename
3. Subtitle Extraction & MP4 Mux
4. Media Validation
5. Replace Original File
6. Sonarr / Radarr Notification

---

# Naming Standards

## TV Shows

```
Series Name S01E01 WEBDL-1080p [AAC][2.0][h265]
```

## Movies

```
Movie Name (2024) [HDR10][EAC3][5.1][h265]-GROUP
```

---

# Design Decisions

These behaviors are intentional and define the long-term architecture of the media library.

## Why TV has two workflows

TV processing is selected per series using Sonarr tags.

- **TV Optimized** is used when storage efficiency is the priority.
- **TV Standard** is used when preserving higher quality audio and less aggressive video optimization is preferred.

This allows different shows to follow different media policies without maintaining separate libraries.

## Why Movies are less aggressive

Radarr performs quality selection before Tdarr processes media.

Tdarr focuses on compatibility and normalization rather than quality selection.

## Why 4K has no video processing

Premium UHD releases are intentionally preserved exactly as downloaded.

Audio normalization provides the largest compatibility improvement with the smallest quality impact.

## Why MP4

Provides the broadest playback compatibility across Plex clients and hardware devices.

## Why external subtitles

External SRT subtitles simplify media containers while providing excellent client compatibility.

## Why a single standardized copy

Maintaining a single version of every movie and episode dramatically simplifies storage management, library maintenance, backups, and playback consistency.

## Non-Goals

The following are intentional design decisions.

- Do not maintain multiple versions of the same title.
- Do not preserve embedded subtitle streams.
- Do not preserve multiple audio languages.
- Do not artificially create surround audio.
- Do not transcode media unless required to meet library standards.
- Do not increase video quality through transcoding.
