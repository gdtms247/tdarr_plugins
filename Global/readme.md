# Shared Processing

These plugins provide the common processing framework used by every Tdarr media workflow.

Unlike the media-specific plugins found in the TV Shows, HD Movies, and 4K Movies folders, these plugins contain no media policy decisions. Their purpose is to prepare, standardize, package, and finalize media in a consistent manner regardless of library type.

Every media workflow eventually passes through this shared processing pipeline before being returned to Sonarr or Radarr.

---

# Design Philosophy

The Shared Processing pipeline is responsible for tasks that should be performed consistently across every media library.

Media-specific decisions such as video quality, audio layout, and bitrate optimization belong to the individual media workflows.

This separation allows processing policies to evolve independently while maintaining consistent library standards.

---

# Media Preparation

The first stage of every processing pipeline.

Responsibilities include:

- Validate media integrity.
- Ensure required video and audio streams exist.
- Remove embedded artwork.
- Remove attachment streams.
- Remove data streams.
- Remove non-English audio tracks (preserving ENG/UND).
- Convert incompatible subtitle formats when required.
- Normalize stream ordering.
- Preserve the original container and metadata whenever possible.

Media validation is treated as a hard requirement. Files missing required streams intentionally fail processing to prevent library corruption.

---

# Rename

Standardizes media filenames after processing.

## TV Shows

Rebuilds filenames using normalized media information including:

- Source
- Resolution
- Audio codec
- Audio channels
- Video codec

## Movies

Preserves existing release naming while rebuilding media tags.

Removes outdated codec, audio, and channel tags before appending the current media information.

---

# Subtitle Extraction & MP4 Mux

Final packaging stage.

Responsibilities include:

- Extract the first English text subtitle.
- Create an external SRT sidecar.
- Remove embedded subtitle streams.
- Remove attachment streams.
- Remove data streams.
- Apply the hvc1 tag to HEVC media.
- Enable MP4 FastStart.
- Remux media to MP4.

Subtitle sidecars are written beside the final media file rather than the Tdarr working directory to ensure they remain with the library.

---

# Media Workflow Integration

The Shared Processing pipeline is used by:

- TV Shows
- HD Movies
- 4K Movies

Each media workflow performs its own media-specific processing before entering the Shared Processing pipeline for final preparation, packaging, and library standardization.

Media-specific documentation can be found in the corresponding workflow folders.
