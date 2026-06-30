# Tdarr Personal Plugin Collection

A collection of personal Tdarr plugins and Flows used to standardize television and movie libraries for long-term Plex compatibility.

The goal of this project is not to transcode everything, but to transcode **only when it improves the library**. Media acquisition, quality selection, and release preference are handled upstream by Sonarr and Radarr. Tdarr then normalizes the downloaded media into predictable playback standards while preserving as much of the original quality as possible.

---

# Design Philosophy

The library is built around four guiding principles:

- **Preserve quality whenever possible.**
- **Avoid unnecessary transcoding.**
- **Maximize Direct Play compatibility across Plex clients.**
- **Maintain a single standardized copy of every movie and episode.**

Rather than applying one processing policy to every file, each media library has its own workflow optimized for its intended purpose.

---

# Repository Structure

```
TV Shows/
```

Television-specific processing policies.

- TV Optimized
- TV Standard
- Sonarr Tag Router

---

```
HD Movies/
```

Standard HD movie processing.

- HD Movie Video
- HD Movie Audio
- Radarr Router

---

```
4K Movies/
```

UHD movie processing focused on preserving premium video quality.

- 4K Audio Standardization

---

```
Shared/
```

Common processing framework used by every media workflow.

- Media Preparation
- Rename
- Subtitle Extraction & MP4 Mux

---

# Processing Architecture

```
                Sonarr / Radarr
                       │
                       ▼
           Media-specific Processing
        (TV / HD Movies / 4K Movies)
                       │
                       ▼
            Shared Processing Pipeline
      (Preparation → Rename → Packaging)
                       │
                       ▼
              Sonarr / Radarr Notify
                       │
                       ▼
                     Plex
```

---

# Media Workflows

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
