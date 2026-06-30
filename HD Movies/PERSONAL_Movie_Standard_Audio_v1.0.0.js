function details() {
  return {
    id: 'PERSONAL_Movie_Standard_Audio',
    Stage: 'Pre-processing',
    Name: 'PERSONAL_Movie_Standard_Audio',
    Type: 'Audio',
    Operation: 'Transcode',
    Description: `
PERSONAL_Movie_Standard_Audio v1.0.0

Purpose:
- Standardize all movie audio into consistent playback-friendly format.

Plugin Logic:
1. Ensures stereo fallback exists:
   - If NO 2.0 track exists:
     Creates AAC stereo downmix from best surround source.

2. Standardizes surround audio:
   - 6/7/8ch -> AC3 5.1
   - 4/5ch -> AC3

3. Standardizes stereo/mono:
   - 2ch/1ch -> AAC if not AAC/MP3/Opus

4. Preserves compliant streams:
   - Already compatible audio copied without re-encode.

5. Maintains original container:
   - No mux/container changes.

6. Safe Skip:
   - If already compliant and stereo exists → skip.

Output Standard:
- AC3 for surround.
- AAC for stereo/mono.
- Guaranteed stereo fallback.
`,
    Version: '1.0.0',
    Link: '',
    Tags: 'audio,movie,standardization,ac3,aac,stereo,surround',
  };
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
    response.infoLog += '☒ File is not video. Skipping.\n';
    return response;
  }

  const streams = file.ffProbeData?.streams || [];

  const audioStreams = streams.filter(
    (s) => s.codec_type?.toLowerCase() === 'audio'
  );

  if (audioStreams.length === 0) {
    response.infoLog += '☒ No audio streams found.\n';
    return response;
  }

  let hasStereo = false;
  let bestSurroundIndex = null;
  let bestSurroundChannels = 0;

  let ffmpegAudioCmd = '';
  let convert = false;
  let audioIdx = 0;

  /*
      PASS 1 — Detect stereo and best surround source
  */
  audioStreams.forEach((stream, i) => {
    const channels = Number(stream.channels || 0);

    if (channels === 2) hasStereo = true;

    if (channels > bestSurroundChannels) {
      bestSurroundChannels = channels;
      bestSurroundIndex = i;
    }
  });

  /*
      PASS 2 — Standardize existing tracks
  */
  audioStreams.forEach((stream) => {
    const codec = String(stream.codec_name || '').toLowerCase();
    const channels = Number(stream.channels || 0);

    if (channels >= 6) {
      if (codec !== 'ac3') {
        ffmpegAudioCmd += `-c:a:${audioIdx} ac3 -ac:a:${audioIdx} 6 -metadata:s:a:${audioIdx} title="5.1" `;
        response.infoLog += `☒ Audio ${audioIdx}: ${channels}ch non-AC3 → converting to AC3 5.1\n`;
        convert = true;
      } else {
        ffmpegAudioCmd += `-c:a:${audioIdx} copy `;
      }
    }

    else if (channels >= 4) {
      if (codec !== 'ac3') {
        ffmpegAudioCmd += `-c:a:${audioIdx} ac3 `;
        response.infoLog += `☒ Audio ${audioIdx}: ${channels}ch → converting to AC3\n`;
        convert = true;
      } else {
        ffmpegAudioCmd += `-c:a:${audioIdx} copy `;
      }
    }

    else if (channels <= 2) {
      if (!['aac', 'mp3', 'opus'].includes(codec)) {
        ffmpegAudioCmd += `-c:a:${audioIdx} aac -ac:a:${audioIdx} ${channels || 2} -metadata:s:a:${audioIdx} title="${channels === 1 ? '1.0' : '2.0'}" `;
        response.infoLog += `☒ Audio ${audioIdx}: ${channels}ch non-compatible → converting to AAC\n`;
        convert = true;
      } else {
        ffmpegAudioCmd += `-c:a:${audioIdx} copy `;
      }
    }

    else {
      ffmpegAudioCmd += `-c:a:${audioIdx} copy `;
    }

    audioIdx++;
  });

  /*
      PASS 3 — Add stereo fallback if missing
  */
  if (!hasStereo && bestSurroundIndex !== null) {
    ffmpegAudioCmd += `-map 0:a:${bestSurroundIndex} -c:a:${audioIdx} aac -ac:a:${audioIdx} 2 -metadata:s:a:${audioIdx} title="2.0" `;
    response.infoLog += `☒ No stereo track found → creating AAC stereo fallback from surround source.\n`;
    convert = true;
  }

  /*
      Final Build
  */
  if (!convert) {
    response.infoLog += '☑ Audio already meets movie standards. Skipping.\n';
    return response;
  }

  response.processFile = true;
  response.reQueueAfter = true;

  response.preset =
    `<io> ` +
    `-map 0 ` +
    `-c copy ` +
    `${ffmpegAudioCmd}` +
    `-map_metadata:g -1 ` +
    `-max_muxing_queue_size 9999`;

  response.infoLog += '✅ Movie audio standardization complete.\n';

  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
