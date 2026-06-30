# Media Standards

This document defines the expected output of every media workflow.

If plugin behavior ever changes, this document should be updated first.

The goal is to document *what* the library should look like rather than *how* Tdarr currently accomplishes it.

---

# Global Standards

## Container

MP4

## Subtitle Strategy

English text subtitles extracted to external SRT.

Embedded subtitle streams removed.

Image-based subtitles are ignored.

## Language

English (ENG) and Undefined (UND) retained.

All other audio languages removed.

## Metadata

Attachments removed.

Embedded artwork removed.

Data streams removed.

Chapters removed during final MP4 mux.

---

# TV Optimized

Purpose

Storage efficiency.

## Video

Supported

- H264
- HEVC

Unsupported codecs

→ HEVC

Resolution-aware bitrate targets.

Only oversized files are transcoded.

## Audio

Single AAC 2.0

No surround retained.

## Output

Container

MP4

Audio

AAC 2.0

---

# TV Standard

Purpose

Preserve playback quality.

## Video

Supported

- H264
- HEVC

Higher bitrate thresholds.

## Audio

720+

AC3 5.1

AAC 2.0

SD

AAC 2.0

---

# HD Movies

Purpose

Preserve cinematic experience.

## Video

Keep

H264

HEVC

Convert

AV1

VP9

Legacy codecs

Original resolution preserved.

## Audio

AC3 5.1

AAC 2.0 fallback

---

# 4K Movies

Purpose

Preserve UHD quality.

## Video

Never transcoded.

HDR preserved.

Dolby Vision preserved.

## Audio

Single surround track.

Preferred

EAC3 5.1

Accepted

AC3 5.1

No stereo generated.

---

# Shared Processing

Every workflow performs:

Media Preparation

↓

Rename

↓

Subtitle Extraction

↓

MP4 Mux

↓

Library Notification

---

# Naming Standards

TV

Series.S01E01.WEBDL-1080p[h265][AAC][2.0]

Movies

Movie (2024) [HDR10][EAC3][5.1][h265]-GROUP

---

# Design Decisions

These are intentional decisions.

## Why TV has two workflows

Storage requirements differ greatly between shared television libraries and personal libraries.

## Why Movies are less aggressive

Radarr already performs quality selection.

Tdarr focuses on compatibility.

## Why 4K has no video plugin

Video quality is intentionally preserved.

Audio normalization provides the largest compatibility improvement with the least quality loss.

## Why MP4

Maximum client compatibility.

## Why external subtitles

Reduces container complexity while improving client compatibility.

## Why one standardized copy

Maintaining a single version of each title greatly simplifies storage, maintenance, and playback.
