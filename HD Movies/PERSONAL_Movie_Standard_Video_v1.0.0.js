function details() {
  return {
    id: 'PERSONAL_Movie_Standard_Video',
    Stage: 'Pre-processing',
    Name: 'PERSONAL_Movie_Standard_Video',
    Type: 'Video',
    Operation: 'Transcode',
    Description: `
Purpose:
- Standardize movie video codec for long-term compatibility and playback support.

Plugin Logic:
1. Skips processing if video is already compliant:
   - H264 / AVC
   - HEVC / H265

2. Converts modern unsupported codecs:
   - AV1 / VP9 → HEVC (Intel QSV)

3. Converts legacy/uncommon codecs:
   - MPEG2 / VC1 / WMV / others → H264 (Intel QSV)

4. Preserves original container:
   - No container changes performed.

5. Preserves all non-video streams:
   - Audio copied
   - Subtitle copied
   - Metadata preserved

Output Standard:
- Modern codecs become HEVC
- Legacy codecs become H264
- Container unchanged

Expected Workflow Position:
- Run AFTER Movie Standard Audio
- Run BEFORE Rename / Packaging

Goal:
- Ensure broad playback compatibility while preserving quality and minimizing unnecessary transcoding.
`,
    Version: '1.0.0',
    Link: '',
    Tags: 'movie,video,transcode,hevc,h264,qsv',
  };
}

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

function getPrimaryVideoStream(streams) {
  for (let i = 0; i < streams.length; i++) {
    const stream = streams[i];

    if (norm(stream.codec_type) === 'video') {
      return stream;
    }
  }

  return null;
}

function isCompliant(codec) {
  return ['h264', 'avc', 'hevc', 'h265'].includes(codec);
}

function plugin(file, librarySettings, inputs) {
  const response = {
    processFile: false,
    preset: '',
    container: file.container || 'mkv',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
    maxmux: false,
  };

  if (file.fileMedium !== 'video') {
    response.infoLog += '☒ File is not video. Skipping.\n';
    return response;
  }

  const streams = file.ffProbeData?.streams || [];

  const videoStream = getPrimaryVideoStream(streams);

  if (!videoStream) {
    response.infoLog += '☒ No video stream found. Skipping.\n';
    return response;
  }

  const codec = norm(videoStream.codec_name);

  /*
      Skip if already compliant
  */
  if (isCompliant(codec)) {
    response.infoLog += `☑ Video codec already compliant (${codec.toUpperCase()}). Skipping.\n`;
    return response;
  }

  /*
      AV1 / VP9 → HEVC
  */
  if (['av1', 'vp9'].includes(codec)) {
    response.processFile = true;

    response.preset =
      `-hwaccel qsv -hwaccel_output_format qsv <io> ` +
      `-map 0 ` +
      `-c:v hevc_qsv ` +
      `-global_quality 23 ` +
      `-look_ahead 1 ` +
      `-c:a copy ` +
      `-c:s copy ` +
      `-map_metadata 0 ` +
      `-max_muxing_queue_size 9999`;

    response.infoLog += `☒ ${codec.toUpperCase()} detected → transcoding to HEVC.\n`;

    return response;
  }

  /*
      Everything Else → H264
  */
  response.processFile = true;

  response.preset =
    `-hwaccel qsv -hwaccel_output_format qsv <io> ` +
    `-map 0 ` +
    `-c:v h264_qsv ` +
    `-global_quality 23 ` +
    `-look_ahead 1 ` +
    `-c:a copy ` +
    `-c:s copy ` +
    `-map_metadata 0 ` +
    `-max_muxing_queue_size 9999`;

  response.infoLog += `☒ Legacy codec (${codec}) detected → transcoding to H264.\n`;

  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
