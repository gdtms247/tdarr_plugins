const details = () => ({
  id: 'PERSONAL_Global_Media_Preperation',
  Stage: 'Pre-processing',
  Name: 'PERSONAL_Global_Media_Preperation',
  Type: 'Video',
  Operation: 'Transcode',
  Description:
    'Universal media preparation and cleanup step.\n\n' +
    'Performs all initial pre-processing before transcoding:\n' +
    '- VALIDATES required streams (must contain at least 1 video and 1 audio stream, otherwise HARD FAILS job)\n' +
    '- Uses efficient single-pass stream validation for performance and reliability\n' +
    '- Removes junk streams (embedded artwork/cover-art/data/attachments)\n' +
    '- Removes non-English audio tracks while preserving ENG/UND\n' +
    '- Prevents removing all audio as safety fallback\n' +
    '- Converts incompatible subtitle codecs for container compatibility\n' +
    '- Reorders streams to standard layout (video > audio > subtitles > other)\n' +
    '- Preserves original container and stream metadata/language tags\n' +
    '- Skips if no changes required.',
  Version: '5.1.0',
  Tags: 'pre-processing,cleanup,audio,subtitle,stream hygiene,language,validation',
});

// --- NO OTHER CHANGES BELOW ---

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

function getLang(st) {
  if (st?.tags?.language) return norm(st.tags.language);
  if (st?.language) return norm(st.language);
  return 'und';
}

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const response = {
    processFile: true,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  const streams =
    file.ffProbeData?.streams && Array.isArray(file.ffProbeData.streams)
      ? file.ffProbeData.streams
      : [];

  // ================================
  // 🚨 HARD VALIDATION (FAIL JOB)
  // ================================

  if (!streams || streams.length === 0) {
    throw new Error(`❌ MEDIA VALIDATION FAILED: No ffprobe stream data found for file: ${file.file}`);
  }

  let hasVideo = false;
  let hasAudio = false;

  for (const s of streams) {
    const type = norm(s.codec_type);

    if (type === 'video') hasVideo = true;
    if (type === 'audio') hasAudio = true;

    if (hasVideo && hasAudio) break;
  }

  if (!hasVideo) {
    throw new Error(`❌ MEDIA VALIDATION FAILED: No VIDEO stream detected for file: ${file.file}`);
  }

  if (!hasAudio) {
    throw new Error(`❌ MEDIA VALIDATION FAILED: No AUDIO stream detected for file: ${file.file}`);
  }

  // ================================

  const outputContainer = String(file.container || '').toLowerCase().replace(/^\./, '');

  const dropIdx = new Set();
  const subtitleConversions = [];

  const subtitleTargetForContainer = (container, codecName) => {
    const codec = norm(codecName);

    if (container === 'mkv') {
      if (codec === 'mov_text') return 'srt';
    }

    return null;
  };

  streams.forEach((s) => {
    const codecType = norm(s.codec_type);
    const codecName = norm(s.codec_name);

    const attachedPic =
      Number(s?.disposition?.attached_pic || 0) === 1;

    if (
      codecType === 'video' &&
      (
        attachedPic ||
        ['png', 'mjpeg', 'jpeg', 'jpg'].includes(codecName)
      )
    ) {
      dropIdx.add(s.index);
    }

    if (codecType === 'data' || codecName === 'bin_data') {
      dropIdx.add(s.index);
    }

    if (codecType === 'attachment') {
      dropIdx.add(s.index);
    }

    if (codecType === 'subtitle') {
      const targetCodec = subtitleTargetForContainer(
        outputContainer,
        codecName
      );

      if (targetCodec) {
        subtitleConversions.push({
          index: s.index,
          targetCodec,
        });
      }
    }
  });

  const audioStreams = streams.filter((s) => norm(s.codec_type) === 'audio');

  const keepLangs = new Set(['eng', 'und']);

  const removableAudio = [];

  audioStreams.forEach((s) => {
    const lang = getLang(s);

    if (!keepLangs.has(lang)) {
      removableAudio.push(s);
    }
  });

  if (removableAudio.length < audioStreams.length) {
    removableAudio.forEach((s) => dropIdx.add(s.index));
  }

  const keptStreams = streams.filter((s) => !dropIdx.has(s.index));

  const orderRank = (s) => {
    const type = norm(s.codec_type);

    if (type === 'video') return 1;
    if (type === 'audio') return 2;
    if (type === 'subtitle') return 3;

    return 4;
  };

  const sortedStreams = keptStreams
    .slice()
    .sort((a, b) => {
      const ra = orderRank(a);
      const rb = orderRank(b);

      if (ra !== rb) return ra - rb;

      return a.index - b.index;
    });

  const originalOrder = streams
    .filter((s) => !dropIdx.has(s.index))
    .map((s) => s.index);

  const newOrder = sortedStreams.map((s) => s.index);

  const sameOrder =
    originalOrder.length === newOrder.length &&
    originalOrder.every((v, i) => v === newOrder[i]);

  if (
    dropIdx.size === 0 &&
    subtitleConversions.length === 0 &&
    sameOrder
  ) {
    response.processFile = false;
    response.infoLog += 'No preparation needed. Skipping.\n';
    return response;
  }

  let command = '-y <io>';

  sortedStreams.forEach((s) => {
    command += ` -map 0:${s.index}`;
  });

  command += ' -c copy';

  subtitleConversions.forEach((item) => {
    const subIndex = sortedStreams
      .filter((s) => norm(s.codec_type) === 'subtitle')
      .findIndex((s) => s.index === item.index);

    command += ` -c:s:${subIndex} ${item.targetCodec}`;
  });

  command += ' -max_muxing_queue_size 9999 -map_metadata:g -1';

  response.preset = command;

  response.infoLog += `Prepared media. Removed ${dropIdx.size} stream(s).\n`;

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
