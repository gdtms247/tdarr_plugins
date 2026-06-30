function details() {
  return {
    id: 'PERSONAL_TV_Standard_Audio',
    Stage: 'Pre-processing',
    Name: 'PERSONAL_TV_Standard_Audio',
    Type: 'Audio',
    Operation: 'Transcode',
    Description: `Resolution-aware audio standardization with skip-if-compliant.

LOW RES MEDIA (<720p HEIGHT):
  Skip if:
    - Exactly ONE audio stream: AAC 2ch
  Otherwise enforce:
    - Keep ONLY a SINGLE AAC 2.0 audio track
    - Remove ALL other audio tracks
    - Copy existing AAC 2.0 when present
    - Downmix/create from best available source if needed

HD MEDIA (>=720p HEIGHT):
  Skip if EITHER:
    1) Exactly ONE audio stream: AAC 2ch
    2) Exactly TWO audio streams: AC3 6ch + AAC 2ch

  Otherwise enforce:
    - If surround-capable track exists (>=4ch):
        Keep ONE surround as AC3 (downmix >6ch to 5.1)
        AND ONE AAC 2.0 stereo track
    - If no surround exists:
        Keep SINGLE AAC 2.0 track

ALWAYS:
  - Removes attachments (-map -0:t)
  - Removes data streams (-dn)
  - Outputs in original container

v2.0.1 Changes:
  - Optimized low-resolution mode to copy existing AAC 2.0 tracks instead of re-transcoding when compliant source exists.`,
    Version: '2.0.1',
    Link: '',
    Tags: 'personal',
  };
}

function getTitleTag(s) {
  try {
    if (s && s.tags && s.tags.title) return String(s.tags.title);
  } catch (e) {}
  return '';
}

function isDefaultDisposition(s) {
  try {
    return s && s.disposition && (s.disposition.default === 1 || s.disposition.default === true);
  } catch (e) {
    return false;
  }
}

function buildAudioStreams(streams) {
  let audioStreams = [];
  let audioOrdinal = 0;

  for (let i = 0; i < streams.length; i++) {
    const s = streams[i];

    if (!s || !s.codec_type) continue;

    if (String(s.codec_type).toLowerCase() === 'audio') {
      audioStreams.push({
        ordinal: audioOrdinal,
        channels: Number(s.channels || 0),
        codec: String(s.codec_name || '').toLowerCase(),
        title: getTitleTag(s),
        isDefault: isDefaultDisposition(s),
      });

      audioOrdinal++;
    }
  }

  return audioStreams;
}

function isStereoCompliantSingle(audioStreams) {
  if (audioStreams.length !== 1) return false;

  const a = audioStreams[0];

  return a.codec === 'aac' && a.channels === 2;
}

function isCompliantDualTrack(audioStreams) {
  if (audioStreams.length !== 2) return false;

  const isSurround = (a) => a.codec === 'ac3' && a.channels === 6;
  const isStereo = (a) => a.codec === 'aac' && a.channels === 2;

  return (
    (isSurround(audioStreams[0]) && isStereo(audioStreams[1])) ||
    (isSurround(audioStreams[1]) && isStereo(audioStreams[0]))
  );
}

function chooseSurroundOrdinal(audioStreams) {
  let cand = audioStreams.find(s => s.channels === 6);
  if (cand) return cand.ordinal;

  cand = audioStreams.find(s => s.channels > 6);
  if (cand) return cand.ordinal;

  cand = audioStreams.find(s => s.channels >= 4);
  if (cand) return cand.ordinal;

  return null;
}

function chooseStereoOrdinal(audioStreams) {
  const twos = audioStreams.filter(s => s.channels === 2);

  if (twos.length === 0) return null;

  let cand = twos.find(s => s.isDefault);

  if (cand) return cand.ordinal;

  return twos[0].ordinal;
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
    response.infoLog += `☒ File is not video.\n`;
    return response;
  }

  const streams = file.ffProbeData?.streams || [];

  const videoStream = streams.find(s => s.codec_type === 'video');

  const height = Number(videoStream?.height || 0);

  const isLowRes = height < 720;

  response.infoLog += `Detected video height: ${height}p\n`;
  response.infoLog += isLowRes
    ? `☒ Low resolution profile (<720p) detected.\n`
    : `☑ HD profile (>=720p) detected.\n`;

  const audioStreams = buildAudioStreams(streams);

  if (audioStreams.length === 0) {
    response.infoLog += `☑ No audio streams found.\n`;
    return response;
  }

  /*
      LOW RES MODE
      Force SINGLE AAC 2.0 ONLY
  */
  if (isLowRes) {
    if (isStereoCompliantSingle(audioStreams)) {
      response.infoLog += `☑ Low-res media already compliant (single AAC 2.0). Skipping.\n`;
      return response;
    }

    const stereoOrdinal = chooseStereoOrdinal(audioStreams);

    const sourceOrdinal =
      stereoOrdinal !== null ? stereoOrdinal : audioStreams[0].ordinal;

    const sourceAudio = audioStreams.find(s => s.ordinal === sourceOrdinal);

    let audioArgs = '';

    if (sourceAudio.codec === 'aac' && sourceAudio.channels === 2) {
      audioArgs =
        `-c:a:0 copy -metadata:s:a:0 title="2.0" `;

      response.infoLog += `☑ Low-res source already AAC 2.0; copying audio.\n`;
    } else {
      audioArgs =
        `-c:a:0 aac -ac:a:0 2 -metadata:s:a:0 title="2.0" `;

      response.infoLog += `☒ Transcoding low-res audio to AAC 2.0.\n`;
    }

    response.preset =
      `<io> ` +
      `-map 0 ` +
      `-map -0:t ` +
      `-dn ` +
      `-map -0:a ` +
      `-map 0:a:${sourceOrdinal} ` +
      `-c:v copy ` +
      `-c:s copy ` +
      audioArgs +
      `-max_muxing_queue_size 9999 -map_metadata:g -1`;

    response.processFile = true;

    response.infoLog += `☒ Enforcing LOW-RES audio standard: Single AAC 2.0 only.\n`;

    return response;
  }

  /*
      HD MODE
      Force SURROUND + STEREO
  */
  if (isStereoCompliantSingle(audioStreams)) {
    response.infoLog += `☑ Already compliant (single AAC 2.0). Skipping.\n`;
    return response;
  }

  if (isCompliantDualTrack(audioStreams)) {
    response.infoLog += `☑ Already compliant (AC3 5.1 + AAC 2.0). Skipping.\n`;
    return response;
  }

  const surroundOrdinal = chooseSurroundOrdinal(audioStreams);
  const stereoOrdinal = chooseStereoOrdinal(audioStreams);

  const hasSurround = surroundOrdinal !== null;
  const hasStereo = stereoOrdinal !== null;

  const stereoOutIndex = hasSurround ? 1 : 0;

  let surroundMap = '';
  let surroundArgs = '';
  let stereoMap = '';
  let stereoArgs = '';

  if (hasSurround) {
    const src = audioStreams.find(s => s.ordinal === surroundOrdinal);

    surroundMap = `-map 0:a:${surroundOrdinal} `;

    if (src.channels > 6) {
      surroundArgs =
        `-c:a:0 ac3 -b:a:0 256k -ac:a:0 6 -metadata:s:a:0 title="5.1" `;

      response.infoLog += `☒ Downmixing ${src.channels}ch to AC3 5.1.\n`;
    } else if (src.channels === 6) {
      if (src.codec === 'ac3') {
        surroundArgs =
          `-c:a:0 copy -metadata:s:a:0 title="5.1" `;

        response.infoLog += `☑ Copying AC3 5.1 surround.\n`;
      } else {
        surroundArgs =
          `-c:a:0 ac3 -b:a:0 256k -ac:a:0 6 -metadata:s:a:0 title="5.1" `;

        response.infoLog += `☒ Transcoding surround to AC3 5.1.\n`;
      }
    } else {
      surroundArgs =
        `-c:a:0 ac3 -b:a:0 256k -metadata:s:a:0 title="5.1" `;

      response.infoLog += `☒ Transcoding partial surround to AC3.\n`;
    }
  }

  if (hasStereo) {
    const src = audioStreams.find(s => s.ordinal === stereoOrdinal);

    stereoMap = `-map 0:a:${stereoOrdinal} `;

    if (src.codec === 'aac' && src.channels === 2) {
      stereoArgs =
        `-c:a:${stereoOutIndex} copy -metadata:s:a:${stereoOutIndex} title="2.0" `;

      response.infoLog += `☑ Copying AAC stereo track.\n`;
    } else {
      stereoArgs =
        `-c:a:${stereoOutIndex} aac -ac:a:${stereoOutIndex} 2 -metadata:s:a:${stereoOutIndex} title="2.0" `;

      response.infoLog += `☒ Transcoding stereo track to AAC 2.0.\n`;
    }
  } else {
    const sourceOrdinal =
      hasSurround ? surroundOrdinal : audioStreams[0].ordinal;

    stereoMap = `-map 0:a:${sourceOrdinal} `;

    stereoArgs =
      `-c:a:${stereoOutIndex} aac -ac:a:${stereoOutIndex} 2 -metadata:s:a:${stereoOutIndex} title="2.0" `;

    response.infoLog += `☒ Creating AAC 2.0 stereo track.\n`;
  }

  response.preset =
    `<io> ` +
    `-map 0 ` +
    `-map -0:t ` +
    `-dn ` +
    `-map -0:a ` +
    (hasSurround ? surroundMap : '') +
    stereoMap +
    `-c:v copy ` +
    `-c:s copy ` +
    (hasSurround ? surroundArgs : '') +
    stereoArgs +
    `-max_muxing_queue_size 9999 -map_metadata:g -1`;

  response.processFile = true;

  response.infoLog += `☒ Enforcing HD audio standard.\n`;

  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
