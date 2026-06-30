function details() {
  return {
    id: 'PERSONAL_TV_Optimized_Audio',
    Stage: 'Pre-processing',
    Name: 'PERSONAL_TV_Optimized_Audio',
    Type: 'Audio',
    Operation: 'Transcode',
    Description: `Optimized TV audio standardization.

Behavior:
1) If file already contains exactly ONE AAC 2CH audio track:
   - Skip processing

2) If AAC 2CH exists:
   - Copy best AAC stereo track
   - Drop all other audio

3) Else if other 2CH exists:
   - Transcode best stereo track to AAC 2.0
   - Drop all other audio

4) Else:
   - Select best surround track
   - Downmix/transcode to AAC 2.0
   - Drop all other audio

Outputs in original container.
Drops attachments/data streams during processing.`,
    Version: '1.0.2',
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

function isCompliant(audioStreams) {
  return (
    audioStreams.length === 1 &&
    audioStreams[0].codec === 'aac' &&
    audioStreams[0].channels === 2
  );
}

function chooseBestAacStereo(audioStreams) {
  const matches = audioStreams.filter(
    s => s.channels === 2 && s.codec === 'aac'
  );

  if (matches.length === 0) return null;

  const def = matches.find(s => s.isDefault);
  return def || matches[0];
}

function chooseBestNonAacStereo(audioStreams) {
  const matches = audioStreams.filter(
    s => s.channels === 2 && s.codec !== 'aac'
  );

  if (matches.length === 0) return null;

  const def = matches.find(s => s.isDefault);
  return def || matches[0];
}

function chooseBestSurround(audioStreams) {
  let cand = audioStreams.find(s => s.channels === 6);
  if (cand) return cand;

  cand = audioStreams.find(s => s.channels > 6);
  if (cand) return cand;

  cand = audioStreams.find(s => s.channels >= 4);
  if (cand) return cand;

  return audioStreams[0] || null;
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
  const audioStreams = buildAudioStreams(streams);

  if (audioStreams.length === 0) {
    response.infoLog += `☑ No audio streams found.\n`;
    return response;
  }

  if (isCompliant(audioStreams)) {
    response.infoLog += `☑ File already meets optimized audio standard. Skipping.\n`;
    return response;
  }

  let selectedTrack = null;
  let transcodeNeeded = true;

  selectedTrack = chooseBestAacStereo(audioStreams);

  if (selectedTrack) {
    transcodeNeeded = false;
    response.infoLog += `☑ Found AAC 2CH track. Copying stereo.\n`;
  }

  if (!selectedTrack) {
    selectedTrack = chooseBestNonAacStereo(audioStreams);

    if (selectedTrack) {
      transcodeNeeded = true;
      response.infoLog += `☑ Found non-AAC 2CH track. Transcoding to AAC.\n`;
    }
  }

  if (!selectedTrack) {
    selectedTrack = chooseBestSurround(audioStreams);

    if (selectedTrack) {
      transcodeNeeded = true;
      response.infoLog += `☑ No stereo found. Downmixing surround to AAC 2.0.\n`;
    }
  }

  if (!selectedTrack) {
    response.infoLog += `☒ No usable audio track found.\n`;
    return response;
  }

  let audioArgs = '';

  if (transcodeNeeded) {
    audioArgs = `-c:a:0 aac -ac:a:0 2 -metadata:s:a:0 title="2.0" `;
  } else {
    audioArgs = `-c:a:0 copy -metadata:s:a:0 title="2.0" `;
  }

  response.preset =
    `<io> ` +
    `-map 0 ` +
    `-map -0:t ` +
    `-dn ` +
    `-map -0:a ` +
    `-map 0:a:${selectedTrack.ordinal} ` +
    `-c:v copy ` +
    `-c:s copy ` +
    audioArgs +
    `-max_muxing_queue_size 9999 -map_metadata:g -1`;

  response.processFile = true;
  response.infoLog += `Processing optimized TV audio.\n`;

  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
