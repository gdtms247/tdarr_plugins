function details() {
  return {
    id: 'PERSONAL_4K_Standard_Audio',
    Stage: 'Post-processing',
    Name: 'PERSONAL_4K_Standard_Audio',
    Type: 'Audio',
    Operation: 'Transcode',
    Description: `
PERSONAL_4K_Standard_Audio v1.0.1

Purpose:
- Ensure a single, highly compatible surround audio track for UHD content.

Rules:
1. Keep ONLY one surround track.
2. Prefer highest quality surround (channel count first, then codec).
3. Prefer EAC3 > AC3 > everything else.
4. Convert non-compatible codecs to EAC3 5.1.
5. Normalize ALL surround audio to 5.1.
6. Remove all other audio tracks.
7. Do NOT create stereo tracks.
8. Skip if already compliant.

Output Standard:
- Single surround track:
  - EAC3 5.1 (preferred)
  - AC3 5.1 (accepted if already present)

v1.0.1 Changes:
- FIX: Corrected FFmpeg mapping (audioIdx vs global index) to prevent crashes
- FIX: Added safe mapping fallback using '?' to avoid hard failures
- IMPROVED: Audio selection prioritizes surround channels first, then codec
- IMPROVED: Explicit enforcement of 5.1 normalization (7.1 → 5.1)
- IMPROVED: More robust handling of single-audio files
`,
    Version: '1.0.1',
    Tags: 'audio,4k,uhd,eac3,ac3,standardization',
  };
}

function norm(s) {
  return String(s || '').toLowerCase();
}

function getScore(stream) {
  const codec = norm(stream.codec_name);
  const channels = Number(stream.channels || 0);

  // Reject non-surround (4K standard requires surround)
  if (channels < 6) return 0;

  let score = 0;

  // Strong priority on channel count
  score += channels * 10;

  // Codec preference
  if (codec === 'eac3') score += 100;
  else if (codec === 'ac3') score += 90;
  else score += 50;

  return score;
}

function plugin(file, librarySettings, inputs) {
  const response = {
    processFile: false,
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  if (file.fileMedium !== 'video') {
    response.infoLog += '☒ Not a video file. Skipping.\n';
    return response;
  }

  const streams = file.ffProbeData?.streams || [];

  // FIX: Use audio-relative indexing instead of global index
  const audioStreams = streams
    .filter((s) => norm(s.codec_type) === 'audio')
    .map((s, i) => ({ ...s, audioIdx: i }));

  if (audioStreams.length === 0) {
    response.infoLog += '☒ No audio streams found.\n';
    return response;
  }

  // Select best surround track
  const sorted = audioStreams.sort((a, b) => getScore(b) - getScore(a));
  const best = sorted[0];

  const bestCodec = norm(best.codec_name);
  const bestChannels = Number(best.channels || 0);

  let needsConvert = false;

  // Enforce 4K standard: must be EAC3/AC3 AND exactly 5.1
  if (!['eac3', 'ac3'].includes(bestCodec) || bestChannels !== 6) {
    needsConvert = true;
  }

  // Skip if already perfect
  if (
    audioStreams.length === 1 &&
    !needsConvert
  ) {
    response.infoLog += '☑ Already compliant (single 5.1 surround track). Skipping.\n';
    return response;
  }

  response.processFile = true;

  let cmd = `<io> -map 0:v -map 0:s? `;

  // FIX: Safe mapping using correct audio index + fallback
  cmd += `-map 0:a:${best.audioIdx}? `;

  if (needsConvert) {
    cmd += `-c:a eac3 -ac 6 -b:a 1024k `;
    response.infoLog += `☒ Converting selected track → EAC3 5.1\n`;
  } else {
    cmd += `-c:a copy `;
    response.infoLog += `☑ Keeping best track (${bestCodec.toUpperCase()} 5.1)\n`;
  }

  cmd += `
-c:v copy
-c:s copy
-map_metadata 0
-max_muxing_queue_size 9999
`;

  response.preset = cmd;

  response.infoLog += `🎧 Selected audio track index: ${best.audioIdx}\n`;
  response.infoLog += `🧹 Removed ${audioStreams.length - 1} other audio track(s)\n`;

  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
