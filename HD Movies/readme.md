# HD Movies

This library standardizes HD movies for broad playback compatibility while preserving the cinematic experience.

Unlike the TV libraries, movie optimization prioritizes compatibility and audio preservation over aggressive storage reduction.

## Processing Flow

![HD Movie Flow](movie_flow.png)

---

# Video Standard

## Supported Codecs

No processing is performed for:

- H.264 / AVC
- HEVC / H.265

## Unsupported Modern Codecs

The following codecs are transcoded to HEVC using Intel Quick Sync:

- AV1
- VP9

## Legacy Codecs

Legacy codecs are transcoded to H.264 using Intel Quick Sync.

Examples include:

- MPEG2
- VC-1
- WMV
- Other unsupported legacy formats

All audio and subtitle streams are preserved during video transcoding.

---

# Audio Standard

Movie audio is normalized for consistent playback while preserving surround sound whenever possible.

## Surround Audio

Existing surround tracks are standardized to AC3.

- 6+ channel → AC3 5.1
- 4–5 channel → AC3

Existing AC3 tracks are copied without re-encoding.

## Stereo Audio

Stereo and mono tracks are converted to AAC only when necessary.

Compatible codecs are preserved:

- AAC
- MP3
- Opus

## Stereo Fallback

If no stereo track exists, an AAC 2.0 stereo track is automatically created from the best available surround source.

---

# Expected Output

## Video

- H.264 or HEVC
- Original resolution preserved
- Original container preserved

## Audio

- AC3 surround
- AAC stereo fallback
- Compatible audio copied whenever possible

---

# Shared Processing

Following movie-specific processing, the shared media pipeline performs:

- Subtitle Extraction
- Stream Hygiene
- MP4 Mux
- Library Notification
