# HD Movies

This library standardizes HD movies for broad playback compatibility while preserving the cinematic experience.

Unlike the TV library, HD Movies are curated upstream through Radarr using Custom Formats and Quality Profiles. Tdarr primarily serves as a compatibility and normalization layer rather than aggressively optimizing media.

## Processing Flow

![HD Movie Flow](movie_flow.png)

---

# Design Philosophy

- Preserve the cinematic viewing experience.
- Standardize audio for consistent playback.
- Convert only unsupported video codecs.
- Minimize unnecessary transcoding.
- Rely on Radarr for content acquisition and quality selection.

---

# Video Standard

## Supported Codecs

The following codecs are considered compliant and are left unchanged:

- H.264 / AVC
- HEVC / H.265

## Unsupported Modern Codecs

Modern codecs not universally supported are converted to HEVC using Intel Quick Sync.

Examples include:

- AV1
- VP9

## Legacy Codecs

Legacy codecs are converted to H.264 using Intel Quick Sync.

Examples include:

- MPEG2
- VC-1
- WMV
- Other unsupported legacy formats

During video processing:

- Original resolution is preserved.
- Audio streams are preserved.
- Subtitle streams are preserved.
- Container changes are deferred to the Shared Processing pipeline.

---

# Audio Standard

Movie audio is standardized for consistent playback while preserving surround sound whenever possible.

## Surround Audio

Surround tracks are normalized to AC3.

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
- Original video quality preserved whenever possible

## Audio

- AC3 surround
- AAC stereo fallback
- Compatible audio copied whenever possible

---

# Workflow

After HD Movie processing is complete, the file enters the Shared Processing pipeline for final packaging and library integration.

See **../Shared/README.md** for the complete shared processing workflow.

Following Shared Processing, the completed file is routed to the appropriate Radarr instance by **FUNCTION_Radarr_Router.js** based on its original library location.
