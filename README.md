# Tdarr Personal Plugin Collection

A collection of personal Tdarr plugins and Flows used to standardize television and movie libraries for long-term Plex compatibility.

The objective of this project is simple:

> **Transcode as little as possible while standardizing as much as necessary.**

Media acquisition and quality selection are intentionally performed upstream by Sonarr and Radarr. Tdarr is responsible for transforming downloaded media into predictable playback standards while preserving as much of the original quality as possible.

---

# Design Philosophy

This project is built around five guiding principles.

- Preserve quality whenever possible.
- Avoid unnecessary transcoding.
- Maximize Plex Direct Play compatibility.
- Maintain a single standardized copy of every movie and episode.
- Separate media acquisition from media normalization.

Rather than applying one processing policy to every file, each media library has its own workflow optimized for its intended purpose.

---

# Architecture

```
                     Internet
                         │
                         ▼
               Sonarr / Radarr
         (Quality Selection & Acquisition)
                         │
                         ▼
               Tdarr Media Policies
      ┌────────────────┬────────────────┐
      │                │                │
      ▼                ▼                ▼
 TV Shows         HD Movies        4K Movies
      │                │                │
      └────────────────┴────────────────┘
                       │
                       ▼
            Global Processing Pipeline
      (Preparation → Rename → Packaging)
                       │
                       ▼
             Sonarr / Radarr Notify
                       │
                       ▼
                     Plex
```

---

# Repository Structure

## [TV Shows](TV%20Shows/)

Television-specific processing policies.

- TV Optimized
- TV Standard
- Sonarr Tag Router

Designed to normalize inconsistent television content while balancing storage efficiency and playback quality.

---

## [HD Movies](HD%20Movies/)

Standard HD movie processing.

- HD Movie Video
- HD Movie Audio
- Radarr Router

Designed to preserve the cinematic experience while maximizing playback compatibility.

---

## [4K Movies](4K%20Movies/)

Ultra HD movie processing.

- 4K Audio Standardization

Designed to preserve UHD video quality while normalizing surround audio.

---

## [Global](Global/)

Reusable processing framework shared across every media workflow.

- Media Preparation
- Rename
- Subtitle Extraction & MP4 Mux

Provides consistent library preparation, packaging, and media standardization regardless of library type.

---

# Processing Responsibilities

Each application in the media pipeline has a clearly defined responsibility.

## Sonarr / Radarr

Responsible for:

- Library management
- Quality Profiles
- Custom Formats
- Release selection
- Metadata
- Downloads

## Tdarr

Responsible for:

- Media normalization
- Codec standardization
- Audio standardization
- Subtitle extraction
- Container optimization
- File naming
- Library consistency

## Plex

Responsible for:

- Library presentation
- Direct Play
- Client compatibility
- Media streaming

This separation allows each application to do what it does best while minimizing unnecessary media processing.

---

# Media Policies

Every library intentionally follows a different processing policy.

| Library | Primary Goal |
|---------|--------------|
| **TV Shows** | Normalize inconsistent media while balancing quality and storage efficiency. |
| **HD Movies** | Preserve the cinematic experience while maximizing playback compatibility. |
| **4K Movies** | Preserve premium UHD video quality while standardizing surround audio. |

---

# Why This Repository Exists

These plugins were built over several years as my media library evolved from a collection of independent Tdarr plugins into a modular processing framework built around Tdarr Flows.

The code is heavily inspired by the incredible Tdarr community. Nearly every plugin contains ideas, techniques, or examples learned from other users and adapted to fit my own media standards.

Hopefully these plugins—and more importantly the documentation behind them—help others build media workflows that match their own libraries.

Happy transcoding!
## TV Shows

Designed to normalize highly inconsistent television content.

Two processing policies are available:

- **TV Optimized** – Storage efficient with a single AAC 2.0 audio track.
- **TV Standard** – Higher quality with AC3 5.1 and AAC 2.0 audio.

Workflow selection is performed automatically using Sonarr tags.

---

## HD Movies

Designed to preserve the cinematic experience while ensuring broad playback compatibility.

Quality selection is primarily performed by Radarr. Tdarr standardizes media only when necessary.

---

## 4K Movies

Designed to preserve UHD video quality.

Video is intentionally left untouched while audio is normalized to a single high-quality surround track.

---

# Shared Processing

Every media workflow eventually enters the Shared Processing pipeline where media is prepared, renamed, packaged, and finalized before being returned to the appropriate media manager.

---

# Acknowledgements

This repository would not exist without the incredible Tdarr community.

These plugins are the result of learning from many community examples, adapting existing ideas, and refining them over time to match my own media standards and library design goals.

If you recognize pieces of your own work in these plugins, thank you for sharing your knowledge with the community.
