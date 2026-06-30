# Shared Processing

These plugins are shared across multiple media workflows and provide a consistent processing pipeline regardless of library type.

Rather than defining media-specific policies, these plugins perform universal preparation, cleanup, standardization, packaging, and naming.

The shared pipeline ensures every processed file follows the same library standards before being returned to Sonarr or Radarr.

---

# Media Preparation

The first stage of every processing pipeline.

Responsibilities include:

- Validate media integrity
- Ensure required video and audio streams exist
- Remove embedded artwork
- Remove attachment streams
- Remove data streams
- Remove non-English audio tracks (preserving ENG/UND)
- Convert incompatible subtitle formats when required
- Normalize stream ordering
- Preserve container and metadata when possible

Media validation is treated as a hard requirement. Files missing required streams are intentionally failed to prevent library corruption.

---

# Rename

Standardizes media filenames after processing.

### TV Shows

Rebuilds filenames using a normalized structure including:

- Source
- Resolution
- Audio codec
- Audio channels
- Video codec

### Movies

Preserves existing release naming while rebuilding media tags.

Removes outdated codec and audio tags before appending current values.

---

# Subtitle Extraction & MP4 Mux

Final packaging stage.

Responsibilities include:

- Extract first English text subtitle
- Create external SRT sidecar
- Remove embedded subtitle streams
- Remove attachment streams
- Remove data streams
- Apply hvc1 tag to HEVC media
- Enable MP4 FastStart
- Remux to MP4

Subtitle sidecars are written beside the final media file rather than the Tdarr working directory.

---

# Design Philosophy

These plugins intentionally contain no library-specific logic.

Media-specific decisions belong to the TV, Movie, and UHD processing policies.

The shared pipeline exists to provide consistent media preparation, packaging, and library hygiene regardless of media type.
